import { useRef, useState } from "react";
import { MessagePrimitive, useAuiState, useScrollLock } from "@assistant-ui/react";
import { CheckIcon } from "lucide-react";
import { Reasoning } from "@/components/assistant-ui/elements/reasoning.aui";
import { RunActivity, type RunActivityEntry, type RunActivityStatus } from "@/components/assistant-ui/elements/run-activity";
import type { KnowledgeMessage } from "@/lib/knowledge-adapter";

/** One disclosure per reply; its entries keep the runtime's original part order. */
export function ResearchProcess({ indices }: { indices: readonly number[] }) {
  const parts = useAuiState((s) => s.message.parts);
  const status = useAuiState((s) => s.message.status);
  const custom = useAuiState((s) => s.message.metadata.custom as KnowledgeMessage | undefined);
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const lockScroll = useScrollLock(rootRef, 220);
  const running = status?.type === "running" && !parts.some((part) => part.type === "text");
  const stopped = status?.type === "incomplete";
  const phase: RunActivityStatus = running ? "running" : stopped ? "cancelled" : "complete";
  const rounds = custom?.rounds ?? [];
  const searches = rounds.filter((round) => round.kind !== "synthesis").length;

  const entries: RunActivityEntry[] = indices.flatMap((index) => {
    const part = parts[index];
    if (part.type !== "reasoning" && part.type !== "tool-call") return [];
    const round = rounds.find((item) => item.id === part.parentId);
    const complete = Boolean(round?.summary) || (!running && !stopped);
    const current = !complete && round?.id === rounds.at(-1)?.id;
    const label = part.type === "reasoning"
      ? round?.title ?? "查找思路"
      : part.toolName === "search_knowledge" ? "检索企业文档" : "筛选依据";
    return [{
      id: part.type === "tool-call" ? part.toolCallId : `commentary-${index}`,
      kind: part.type === "reasoning" ? "commentary" : "tool",
      label,
      content: part.type === "reasoning" ? (
        <div className="activity-round">
          <div className="activity-round-heading">
            {complete ? <CheckIcon size={14} aria-hidden /> : <span className="activity-round-marker" aria-hidden />}
            <strong>{round?.kind === "search" ? "查找：" : round?.kind === "recheck" ? "补查：" : ""}{label}</strong>
            <span className="activity-round-state">{complete ? "已完成" : current && stopped ? "已停止" : current ? "进行中" : ""}</span>
          </div>
          <div className="activity-commentary"><MessagePrimitive.PartByIndex index={index} components={{ Reasoning }} /></div>
        </div>
      ) : (
        <div className="activity-tool"><MessagePrimitive.PartByIndex index={index} components={{}} /></div>
      ),
    }];
  });

  return (
    <div ref={rootRef} onAnimationStart={(event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.slot === "collapsible-content") lockScroll();
    }}>
      <RunActivity
        className="research-process"
        status={phase}
        statusLabel={`${running ? "正在查找依据" : stopped ? "查找已停止" : "已完成查找"}${searches ? ` · ${searches} 轮检索` : ""}${custom?.status?.evidence ? ` · ${custom.status.evidence} 段依据` : ""}`}
        durationLabel={custom?.elapsed ? `· ${Math.max(1, Math.round(custom.elapsed / 1000))} 秒` : undefined}
        open={manualOpen ?? running}
        onOpenChange={setManualOpen}
        entries={entries}
      />
    </div>
  );
}
