import type {
  ChatModelAdapter,
  ThreadAssistantMessagePart,
} from "@assistant-ui/react";
import { documents, knowledgeBases, resolvePassage } from "@/data/knowledge";
import { EVIDENCE_CUTOFF, planResearch, type ResearchPlan } from "@/lib/research";

export interface SearchArgs {
  query: string;
  /** Display names of the searched knowledge bases. */
  scope: string[];
}
export interface SearchHit {
  id: string;
  title: string;
  version: string;
  updated: string;
  location: string;
}
export interface SearchResult {
  hits: SearchHit[];
}
export interface EvidenceArgs {
  question: string;
}
export interface EvidenceItem {
  ref: string;
  title: string;
  page: number;
  heading: string;
  score: number;
  summary: string;
  kept: boolean;
}
export interface ResearchStatus {
  documents: number;
  relevant: number;
  evidence: number;
}
export interface EvidenceResult {
  cutoff: number;
  items: EvidenceItem[];
  added: number;
  status: ResearchStatus;
}
export interface CitationInfo {
  n: number;
  ref: string;
  quote: string;
  title: string;
  version: string;
  page: number;
  heading: string;
  score: number;
}
/** One research round: its reasoning and tool calls share `parentId` = `id`. */
export interface ResearchRound {
  id: string;
  kind: "search" | "recheck" | "synthesis";
  /** What the round sets out to answer, shown before any of it streams. */
  title: string;
  /** Filled in once the round finishes, for its collapsed row. */
  summary?: string;
}
export interface KnowledgeMessage {
  citations?: CitationInfo[];
  outcome?: ResearchPlan["outcome"];
  status?: ResearchStatus;
  rounds?: ResearchRound[];
  elapsed?: number;
}

// Timing that reads like a real model: a wait before the first token, uneven
// token bursts that pause at punctuation, and tools that take a moment.
const pace = {
  firstToken: 900,
  beforeTool: 450,
  search: 1500,
  evidence: 2300,
  beforeAnswer: 700,
};

const pauseAfter = (chunk: string, long: number, short: number) =>
  /[。；！？\n]$/.test(chunk) ? long : /[，、：]$/.test(chunk) ? short : 0;

/** Uneven chunks of 1–3 characters for reasoning, slower than the answer. */
function reasoningChunks(text: string) {
  const chunks: { text: string; delay: number }[] = [];
  for (let i = 0; i < text.length; ) {
    const size = 1 + Math.floor(Math.random() * 3);
    const chunk = text.slice(i, i + size);
    i += size;
    chunks.push({
      text: chunk,
      delay: 40 + Math.floor(Math.random() * 30) + pauseAfter(chunk, 300, 140),
    });
  }
  return chunks;
}

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    signal.throwIfAborted();
    const cancel = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal.addEventListener("abort", cancel, { once: true });
  });
}

const scopeLabel = (base: string) =>
  base === "all"
    ? "全部知识库"
    : base === "root"
      ? "根目录文件"
      : (knowledgeBases.find((item) => item.id === base)?.name ?? base);

function hit(id: string): SearchHit {
  const doc = documents.find((item) => item.id === id)!;
  return {
    id,
    title: doc.title,
    version: doc.version,
    updated: doc.updated,
    location: doc.baseId ? scopeLabel(doc.baseId) : "根目录",
  };
}

/** Keep each citation group whole so a source link never renders half-typed. */
function answerChunks(answer: string) {
  return answer.split(/(\[\[\d+(?:,\d+)*\]\])/).flatMap((piece) => {
    const marker = /^\[\[(\d+(?:,\d+)*)\]\]$/.exec(piece);
    if (marker)
      return [{ text: `[${marker[1]}](#cite-${marker[1]})`, delay: 60 }];
    const chunks: { text: string; delay: number }[] = [];
    for (let i = 0; i < piece.length; ) {
      const size = 2 + Math.floor(Math.random() * 3);
      const chunk = piece.slice(i, i + size);
      i += size;
      chunks.push({
        text: chunk,
        delay: 26 + Math.floor(Math.random() * 20) + pauseAfter(chunk, 160, 70),
      });
    }
    return chunks;
  });
}

export function citationInfo(plan: ResearchPlan): CitationInfo[] {
  const scores = new Map(
    plan.steps.flatMap((step) =>
      step.kind === "evidence"
        ? step.candidates.map((item) => [item.ref, item.score] as const)
        : [],
    ),
  );
  return plan.citations.map((citation, index) => {
    const source = resolvePassage(citation.ref)!;
    return {
      n: index + 1,
      ref: citation.ref,
      quote: citation.quote,
      title: source.document.title,
      version: source.document.version,
      page: source.passage.page,
      heading: source.passage.heading,
      score: scores.get(citation.ref) ?? 0,
    };
  });
}

/**
 * Splits a plan into rounds: each search round opens with its reasoning and
 * ends with its evidence; reasoning with no search after it is the closing
 * synthesis. Returns the rounds and the round id of every step.
 */
export function planRounds(plan: ResearchPlan) {
  const rounds: ResearchRound[] = [];
  const roundOf: string[] = [];
  let current: ResearchRound | undefined;
  plan.steps.forEach((step, index) => {
    const previous = plan.steps[index - 1];
    const opens =
      !current ||
      step.kind === "think" ||
      (step.kind === "search" && previous?.kind !== "think");
    if (opens) {
      const searches =
        step.kind === "search" || plan.steps[index + 1]?.kind === "search";
      const searchRounds = rounds.filter((item) => item.kind !== "synthesis");
      const evidence = plan.steps
        .slice(index)
        .find((item) => item.kind === "evidence");
      current = searches
        ? {
            id: `round-${searchRounds.length + 1}`,
            kind: searchRounds.length ? "recheck" : "search",
            title: evidence?.kind === "evidence" ? evidence.question : "查找资料",
          }
        : { id: "round-final", kind: "synthesis", title: "整理回答" };
      rounds.push(current);
    }
    roundOf.push(current!.id);
  });
  return { rounds, roundOf };
}

/**
 * Local assistant-ui adapter that replays a scripted research run as real
 * message parts: reasoning, tool calls with results, then a cited answer.
 * Parts of one round share a `parentId`, preserving the question each step investigates.
 */
export const knowledgeAdapter = {
  async *run({ messages, abortSignal }) {
    const startedAt = Date.now();
    const question =
      [...messages]
        .reverse()
        .find((message) => message.role === "user")
        ?.content.filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("\n") ?? "";
    const plan = planResearch(question);
    const { rounds, roundOf } = planRounds(plan);
    const shown: ResearchRound[] = [];
    const parts: ThreadAssistantMessagePart[] = [];
    const found = new Set<string>();
    const relevant = new Set<string>();
    let evidence = 0;
    const roundHits = new Map<string, number>();
    const status = (): ResearchStatus => ({
      documents: found.size,
      relevant: relevant.size,
      evidence,
    });
    const update = (extra: KnowledgeMessage = {}) => ({
      content: [...parts],
      metadata: {
        custom: {
          status: status(),
          rounds: shown.map((round) => ({ ...round })),
          ...extra,
        } satisfies KnowledgeMessage,
      },
    });
    const enter = (parentId: string) => {
      if (!shown.some((round) => round.id === parentId))
        shown.push({ ...rounds.find((round) => round.id === parentId)! });
    };

    await wait(pace.firstToken, abortSignal);
    for (const [index, step] of plan.steps.entries()) {
      const parentId = roundOf[index];
      enter(parentId);
      if (step.kind === "think") {
        let text = "";
        parts.push({ type: "reasoning", text, parentId });
        for (const chunk of reasoningChunks(step.text)) {
          text += chunk.text;
          parts[parts.length - 1] = { type: "reasoning", text, parentId };
          yield update();
          await wait(chunk.delay, abortSignal);
        }
        continue;
      }
      await wait(pace.beforeTool, abortSignal);
      const toolCallId = `${step.kind}-${index}`;
      if (step.kind === "search") {
        const args: SearchArgs = {
          query: step.query,
          scope: step.bases.map(scopeLabel),
        };
        const call = {
          type: "tool-call" as const,
          toolCallId,
          toolName: "search_knowledge",
          args: { ...args },
          argsText: JSON.stringify(args),
          parentId,
        };
        parts.push(call);
        yield update();
        await wait(pace.search, abortSignal);
        step.hits.forEach((id) => found.add(id));
        roundHits.set(parentId, step.hits.length);
        const result: SearchResult = { hits: step.hits.map(hit) };
        parts[parts.length - 1] = { ...call, result };
        yield update();
        continue;
      }
      const args: EvidenceArgs = { question: step.question };
      const call = {
        type: "tool-call" as const,
        toolCallId,
        toolName: "gather_evidence",
        args: { ...args },
        argsText: JSON.stringify(args),
        parentId,
      };
      parts.push(call);
      yield update();
      await wait(pace.evidence, abortSignal);
      const items = step.candidates
        .map((candidate): EvidenceItem => {
          const source = resolvePassage(candidate.ref)!;
          return {
            ...candidate,
            title: source.document.title,
            page: source.passage.page,
            heading: source.passage.heading,
            kept: candidate.score >= EVIDENCE_CUTOFF,
          };
        })
        .sort((a, b) => b.score - a.score);
      const kept = items.filter((item) => item.kept);
      kept.forEach((item) => relevant.add(item.ref.split(":")[0]));
      evidence += kept.length;
      const round = shown.find((item) => item.id === parentId)!;
      const files = `${roundHits.get(parentId) ?? 0} 份文件`;
      round.summary = kept.length
        ? `${files}，保留 ${kept.length} 段证据`
        : `${files}，没有相关段落`;
      const result: EvidenceResult = {
        cutoff: EVIDENCE_CUTOFF,
        items,
        added: kept.length,
        status: status(),
      };
      parts[parts.length - 1] = { ...call, result };
      yield update();
    }

    const citations = citationInfo(plan);
    await wait(pace.beforeAnswer, abortSignal);
    let text = "";
    parts.push({ type: "text", text });
    for (const chunk of answerChunks(plan.answer)) {
      text += chunk.text;
      parts[parts.length - 1] = { type: "text", text };
      yield update({ citations });
      await wait(chunk.delay, abortSignal);
    }
    yield update({
      citations,
      outcome: plan.outcome,
      elapsed: Date.now() - startedAt,
    });
  },
} satisfies ChatModelAdapter;
