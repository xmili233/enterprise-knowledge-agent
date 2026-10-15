import { useAuiState } from "@assistant-ui/react";
import { cn } from "@/lib/utils";
import { useCitations } from "@/components/agent/answer-text";
import type { KnowledgeMessage } from "@/lib/knowledge-adapter";

export function AnswerFooter() {
  const citations = useCitations();
  const custom = useAuiState((s) => s.message.metadata.custom as KnowledgeMessage | undefined);
  const status = useAuiState((s) => s.message.status?.type);

  if (status === "incomplete") return <p className="answer-stopped" role="status">已停止查找。</p>;
  if (status !== "complete" || !custom?.outcome) return null;

  const grounded = custom.outcome === "grounded";

  return (
    <div className="answer-footer">
      <p className="answer-outcome">
        <span aria-hidden className={cn("size-1.5 rounded-full", grounded ? "bg-emerald-500" : "bg-amber-500")} />
        {grounded ? `依据充分 · 引用 ${citations.length} 处原文` : citations.length === 0 ? "依据不足 · 检索到的段落相关度均低于阈值" : "依据不足 · 资料只能说明为什么无法给出确定结论"}
      </p>
    </div>
  );
}
