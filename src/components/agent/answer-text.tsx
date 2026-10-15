import type { ComponentProps } from "react";
import { useAuiState } from "@assistant-ui/react";
import { MarkdownText } from "@/components/assistant-ui/elements/markdown-text";
import { Citation } from "@/components/assistant-ui/elements/inline-citation";
import {
  useOpenSource,
  type SourceView,
} from "@/components/agent/source-actions";
import type { CitationInfo, KnowledgeMessage } from "@/lib/knowledge-adapter";

/** Every citation of one document in an answer, so the reader can step through them. */
export function sourceView(
  citations: CitationInfo[],
  documentId: string,
  active?: number,
): SourceView {
  const highlights = citations
    .filter((citation) => citation.ref.split(":")[0] === documentId)
    .map((citation) => ({
      n: citation.n,
      passageId: citation.ref.split(":")[1],
      quote: citation.quote,
      score: citation.score,
    }));
  return { id: documentId, highlights, active: active ?? highlights[0]?.n };
}

const noCitations: CitationInfo[] = [];

// The selector must return a stable value, so a missing list maps to one shared array.
export const useCitations = () =>
  useAuiState(
    (s) =>
      (s.message.metadata.custom as KnowledgeMessage | undefined)?.citations ??
      noCitations,
  );

/** Renders `[n](#cite-n)` links from the answer as numbered citations with a hover preview. */
function CitationLink({ href, children, ...props }: ComponentProps<"a">) {
  const citations = useCitations();
  const openSource = useOpenSource();
  const match = /^#cite-(\d+)$/.exec(href ?? "");
  const citation = match
    ? citations.find((item) => item.n === Number(match[1]))
    : undefined;
  if (!citation)
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  const documentId = citation.ref.split(":")[0];
  return (
    <Citation
      index={citation.n - 1}
      source={{
        title: citation.title,
        meta: `v${citation.version} · 第 ${citation.page} 页 · 相关度 ${citation.score}/10`,
        snippet: citation.quote,
        hint: "点击查看原文中的位置",
      }}
      onClick={() => openSource(sourceView(citations, documentId, citation.n))}
    />
  );
}

const components = { a: CitationLink };

export function AnswerText() {
  return (
    <div className="assistant-markdown">
      <MarkdownText components={components} />
    </div>
  );
}
