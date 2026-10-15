import { useState, type ReactNode } from "react";
import { useAuiState } from "@assistant-ui/react";
import {
  CheckIcon,
  ChevronRightIcon,
  CircleDashedIcon,
  LoaderIcon,
} from "lucide-react";
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from "@/components/assistant-ui/elements/collapsible-root";
import type { KnowledgeMessage, ResearchRound as Round } from "@/lib/knowledge-adapter";

const kindLabel: Record<Round["kind"], string> = {
  search: "查找",
  recheck: "补查",
  synthesis: "",
};

const useCustom = () =>
  useAuiState((s) => s.message.metadata.custom as KnowledgeMessage | undefined);

/** Quiet heading over the rounds; it states that the process is simulated. */
export function ResearchProcess({ children }: { children: ReactNode }) {
  const custom = useCustom();
  const running = useAuiState((s) => s.message.status?.type === "running");
  const rounds = custom?.rounds?.filter((round) => round.kind !== "synthesis");
  const elapsed = custom?.elapsed
    ? ` · 用时 ${Math.max(1, Math.round(custom.elapsed / 1000))} 秒`
    : "";
  return (
    <div className="research-process">
      <p className="research-process-head">
        {running || !rounds?.length
          ? "查找过程 · 模拟"
          : `查找过程 · ${rounds.length} 轮${elapsed} · 模拟`}
      </p>
      {children}
    </div>
  );
}

/**
 * One research round. It is open only while it is the round being worked on,
 * then folds into a single row with its result as the next round begins.
 */
export function ResearchRound({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const [manual, setManual] = useState<boolean | null>(null);
  const round = useAuiState((s) =>
    (s.message.metadata.custom as KnowledgeMessage | undefined)?.rounds?.find(
      (item) => item.id === id,
    ),
  );
  // The newest part decides which round is live, so pauses between a round's
  // steps never fold it early.
  const phase = useAuiState((s) => {
    const last = s.message.parts.at(-1);
    const current =
      (last?.type === "reasoning" || last?.type === "tool-call") &&
      last.parentId === id;
    if (!current) return "done";
    if (s.message.status?.type === "running") return "active";
    if (s.message.status?.type === "incomplete") return "stopped";
    return "done";
  });
  const open = manual ?? phase === "active";
  const kind = round ? kindLabel[round.kind] : "查找";
  const Icon =
    phase === "active"
      ? LoaderIcon
      : phase === "stopped"
        ? CircleDashedIcon
        : CheckIcon;

  return (
    <CollapsibleRoot
      open={open}
      onOpenChange={setManual}
      className="research-round"
      data-phase={phase}
    >
      <CollapsibleTrigger className="research-round-trigger">
        <Icon className="research-round-icon" aria-hidden />
        <span className="research-round-text">
          {kind && <span className="research-round-kind">{kind}：</span>}
          <span className={phase === "active" ? "shimmer" : undefined}>
            {round?.title ?? "查找资料"}
          </span>
          {!open && phase === "stopped" && (
            <span className="research-round-summary"> · 已停止</span>
          )}
          {!open && phase === "done" && round?.summary && (
            <span className="research-round-summary"> · {round.summary}</span>
          )}
        </span>
        <ChevronRightIcon className="research-round-chevron" aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="research-round-content">
        <div className="research-round-body">{children}</div>
      </CollapsibleContent>
    </CollapsibleRoot>
  );
}
