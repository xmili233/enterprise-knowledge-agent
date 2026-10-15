"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ShimmerLabel } from "./surfaces";

// Adapted from the assistant-ui `elements-retrieval-chunks` registry item to
// show PaperQA2-style evidence gathering as one labelled step row: every
// candidate passage carries a 0-10 relevance score and a one-line summary, and
// passages under the cutoff stay visible but recede, with the reason stated.
export interface RetrievalChunk {
  id: string;
  source: string;
  locator: string;
  /** Relevance from 0 to 10. */
  score: number;
  text: string;
  kept: boolean;
}

export function RetrievalChunks({
  chunks,
  cutoff,
  searching,
  onSelect,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children" | "chunks" | "onSelect"> & {
  chunks: readonly RetrievalChunk[];
  cutoff: number;
  searching: boolean;
  onSelect?: ((id: string) => void) | undefined;
}) {
  return (
    <div
      data-slot="retrieval-chunks"
      className={cn("research-step", className)}
      {...props}
    >
      <span className="research-step-label">筛选</span>
      <div className="research-step-body">
        {searching ? (
          <ShimmerLabel className="research-step-meta">
            正在阅读候选段落并打分
          </ShimmerLabel>
        ) : (
          <ol className="evidence-rows">
            {chunks.map((chunk, index) => (
              <li
                key={chunk.id}
                className={chunk.kept ? undefined : "is-dropped"}
                style={{ animationDelay: `${index * 160}ms` }}
              >
                <span
                  className="evidence-score"
                  aria-label={`相关度 ${chunk.score} / 10`}
                >
                  {chunk.score} 分
                </span>
                <button
                  type="button"
                  disabled={!onSelect}
                  onClick={() => onSelect?.(chunk.id)}
                >
                  <span className="evidence-summary">{chunk.text}</span>
                  <span className="research-step-meta">
                    {chunk.kept
                      ? `${chunk.source} · ${chunk.locator}`
                      : `低于 ${cutoff} 分，已排除 · ${chunk.source} · ${chunk.locator}`}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
