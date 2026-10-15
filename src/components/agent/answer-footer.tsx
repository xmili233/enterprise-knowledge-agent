import { ChevronRightIcon, FilesIcon } from "lucide-react";
import { useAuiState } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { DocumentReference } from "@/components/assistant-ui/elements/document-reference";
import { documents } from "@/data/knowledge";
import { useOpenSource } from "@/components/agent/source-actions";
import { sourceView, useCitations } from "@/components/agent/answer-text";
import type { KnowledgeMessage } from "@/lib/knowledge-adapter";

export function AnswerFooter() {
  const openSource = useOpenSource();
  const citations = useCitations();
  const custom = useAuiState((s) => s.message.metadata.custom as KnowledgeMessage | undefined);
  const status = useAuiState((s) => s.message.status?.type);

  if (status === "incomplete") return <p className="answer-stopped" role="status">已停止查找。</p>;
  if (status !== "complete" || !custom?.outcome) return null;

  const cited = [...new Set(citations.map((citation) => citation.ref.split(":")[0]))];
  const grounded = custom.outcome === "grounded";

  return (
    <div className="answer-footer">
      <p className="answer-outcome">
        <span aria-hidden className={cn("size-1.5 rounded-full", grounded ? "bg-emerald-500" : "bg-amber-500")} />
        {grounded ? `依据充分 · 引用 ${citations.length} 处原文` : citations.length === 0 ? "依据不足 · 检索到的段落相关度均低于阈值" : "依据不足 · 资料只能说明为什么无法给出确定结论"}
      </p>
      {cited.length > 0 && (
        <details className="answer-references">
          <summary><FilesIcon size={15} aria-hidden /><span>{cited.length} 份引用文档</span><ChevronRightIcon size={13} aria-hidden className="reference-chevron" /></summary>
          <div className="answer-reference-grid">
            {cited.map((id) => {
              const doc = documents.find((item) => item.id === id)!;
              const refs = citations.filter((citation) => citation.ref.split(":")[0] === id);
              return (
                <DocumentReference key={id} title={doc.title} meta={`v${doc.version} · ${refs.length} 处引用`}
                  anchors={refs.map((citation) => ({ page: citation.page, quote: citation.quote, label: `引用 ${citation.n}` }))}
                  onJump={(index) => openSource(sourceView(citations, id, refs[index].n))}
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
}
