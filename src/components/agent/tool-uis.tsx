import { makeAssistantToolUI } from "@assistant-ui/react";
import { WebSearch } from "@/components/assistant-ui/elements/web-search";
import { RetrievalChunks } from "@/components/assistant-ui/elements/retrieval-chunks";
import { useOpenSource } from "@/components/agent/source-actions";
import type {
  EvidenceArgs,
  EvidenceResult,
  SearchArgs,
  SearchResult,
} from "@/lib/knowledge-adapter";

const scopeText = (scope: string[]) =>
  scope.map((name) => (name === "全部知识库" ? name : `「${name}」`)).join("和");

function Stopped({ label }: { label: string }) {
  return <p className="text-muted-foreground text-xs">{label}已停止</p>;
}

/** Search step: query, searched scope and the documents it found (Onyx-style search step). */
export const SearchKnowledgeUI = makeAssistantToolUI<SearchArgs, SearchResult>({
  toolName: "search_knowledge",
  render: function SearchKnowledge({ args, result, status }) {
    const openSource = useOpenSource();
    if (!result && status.type !== "running") return <Stopped label="检索" />;
    return (
      <WebSearch
        query={args.query}
        scope={scopeText(args.scope ?? [])}
        searching={!result}
        results={(result?.hits ?? []).map((hit) => ({
          id: hit.id,
          title: hit.title,
          meta: `v${hit.version} · ${hit.location}`,
        }))}
        onSelect={(id) => openSource({ id })}
      />
    );
  },
});

/** Evidence step: scored candidate passages, kept or dropped against the cutoff (PaperQA2-style). */
export const GatherEvidenceUI = makeAssistantToolUI<
  EvidenceArgs,
  EvidenceResult
>({
  toolName: "gather_evidence",
  render: function GatherEvidence({ args, result, status }) {
    const openSource = useOpenSource();
    if (!result && status.type !== "running")
      return <Stopped label="收集证据" />;
    return (
      <RetrievalChunks
        query={args.question ?? ""}
        cutoff={result?.cutoff ?? 5}
        searching={!result}
        chunks={(result?.items ?? []).map((item) => ({
          id: item.ref,
          source: item.title,
          locator: `${item.heading.split(" · ").at(-1)} · 第 ${item.page} 页`,
          score: item.score,
          summary: item.summary,
          kept: item.kept,
        }))}
        onSelect={(ref) => {
          const [id, passageId] = ref.split(":");
          openSource({ id, passageId });
        }}
      />
    );
  },
});

export function ResearchToolUIs() {
  return (
    <>
      <SearchKnowledgeUI />
      <GatherEvidenceUI />
    </>
  );
}
