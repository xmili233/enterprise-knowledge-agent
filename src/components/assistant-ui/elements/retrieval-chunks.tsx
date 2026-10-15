"use client";

import type { ComponentProps } from "react";
import { ScanTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShimmerLabel } from "./surfaces";

// Adapted from assistant-ui/elements-retrieval-chunks; scores retain the demo's 0–10 scale.
export interface RetrievalChunk {
  id: string;
  source: string;
  locator: string;
  score: number;
  summary: string;
  kept: boolean;
}

export function RetrievalChunks({
  query, chunks, cutoff, searching, onSelect, className, ...props
}: Omit<ComponentProps<"div">, "children" | "chunks" | "onSelect"> & {
  query: string;
  chunks: readonly RetrievalChunk[];
  cutoff: number;
  searching: boolean;
  onSelect?: (id: string) => void;
}) {
  const kept = chunks.filter((chunk) => chunk.kept);

  return (
    <div data-slot="retrieval-chunks" aria-label={`筛选依据：${query}`} aria-busy={searching} className={cn("agent-retrieval", className)} {...props}>
      <div className="agent-tool-heading">
        <ScanTextIcon size={15} aria-hidden /><span>筛选依据</span>
        <span className="agent-tool-state">{searching ? <ShimmerLabel>评分中</ShimmerLabel> : `${chunks.length} 段候选 · 保留 ${kept.length} 段 · ${cutoff} 分起采用`}</span>
      </div>
      {!searching && (chunks.length ? (
        <ul className="agent-evidence-list">
          {chunks.map((chunk) => (
            <li key={chunk.id} className={cn("agent-evidence-row", !chunk.kept && "is-dropped")}>
              <span className="agent-score" aria-label={`相关度 ${chunk.score}/10`}>{chunk.score}<span>/10</span></span>
              <div className="agent-evidence-content">
                <p className="agent-evidence-summary">{chunk.summary}</p>
                <button type="button" className="agent-evidence-source" disabled={!onSelect} onClick={() => onSelect?.(chunk.id)} aria-label={`查看${chunk.source} · ${chunk.locator}的原文`}>
                  {chunk.source} · {chunk.locator}
                </button>
              </div>
              <span className="agent-evidence-decision">{chunk.kept ? "采用" : "排除"}</span>
            </li>
          ))}
        </ul>
      ) : <p className="agent-tool-caption">没有找到足以支持回答的段落</p>)}
    </div>
  );
}
