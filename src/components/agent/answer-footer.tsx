import { useState } from "react";
import { useAuiState } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { Sources } from "@/components/assistant-ui/elements/sources";
import { documents } from "@/data/knowledge";
import { useOpenSource } from "@/components/agent/source-actions";
import { sourceView, useCitations } from "@/components/agent/answer-text";
import type { KnowledgeMessage } from "@/lib/knowledge-adapter";

/**
 * Closes a finished answer: whether the evidence was sufficient (PaperQA2
 * marks a run certain or unsure), the cited documents collapsed into one pill
 * (Onyx).
 */
export function AnswerFooter() {
  const openSource = useOpenSource();
  const citations = useCitations();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const custom = useAuiState(
    (s) => s.message.metadata.custom as KnowledgeMessage | undefined,
  );
  const status = useAuiState((s) => s.message.status?.type);

  if (status === "incomplete")
    return (
      <p className="answer-stopped" role="status">
        已停止查找。你可以重新查找，或继续下一步演示。
      </p>
    );
  if (status !== "complete" || !custom?.outcome) return null;

  const cited = [
    ...new Set(citations.map((citation) => citation.ref.split(":")[0])),
  ];
  const grounded = custom.outcome === "grounded";
  const allDropped = citations.length === 0;

  return (
    <div className="answer-footer">
      <p className="answer-outcome">
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            grounded ? "bg-emerald-500" : "bg-amber-500",
          )}
        />
        {grounded
          ? `依据充分 · 引用 ${citations.length} 处原文`
          : allDropped
            ? "依据不足 · 检索到的段落相关度均低于阈值"
            : "依据不足 · 资料只能说明为什么无法给出确定结论"}
        <span className="answer-outcome-note">演示数据</span>
      </p>
      {cited.length > 0 && (
        <Sources
          layout="list"
          label="来源"
          open={sourcesOpen}
          onOpenChange={setSourcesOpen}
          className="max-w-none"
          sources={cited.map((id) => {
            const doc = documents.find((item) => item.id === id)!;
            const count = citations.filter(
              (citation) => citation.ref.split(":")[0] === id,
            ).length;
            return {
              title: doc.title,
              snippet: [
                ...new Set(
                  citations
                    .filter((citation) => citation.ref.split(":")[0] === id)
                    .map((citation) => citation.heading),
                ),
              ].join("；"),
              author: `v${doc.version} · 引用 ${count} 处`,
              publishedAt: doc.updated,
            };
          })}
          onSelect={(index) => openSource(sourceView(citations, cited[index]))}
        />
      )}
    </div>
  );
}
