"use client";

import { Fragment, type ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { ShimmerLabel } from "./surfaces";

// Adapted from the assistant-ui `elements-web-search` registry item for an
// internal knowledge base. It renders as one labelled step row: the query and
// the searched scope (as Onyx names a search step), then the documents found.
export interface WebSearchResult {
  id: string;
  title: string;
  meta: string;
}

export function WebSearch({
  query,
  scope,
  results,
  searching,
  onSelect,
  className,
  ...props
}: Omit<
  ComponentProps<"div">,
  "children" | "query" | "results" | "onSelect"
> & {
  query: string;
  scope: string;
  results: readonly WebSearchResult[];
  searching: boolean;
  onSelect?: ((id: string) => void) | undefined;
}) {
  return (
    <div data-slot="web-search" className={cn("research-step", className)} {...props}>
      <span className="research-step-label">检索</span>
      <div className="research-step-body">
        <p>
          {query}
          <span className="research-step-meta"> · {scope}</span>
        </p>
        {searching ? (
          <ShimmerLabel className="research-step-meta">正在检索</ShimmerLabel>
        ) : results.length ? (
          <p className="research-step-files">
            {results.map((result, index) => (
              <Fragment key={result.id}>
                {index > 0 && "、"}
                <button
                  type="button"
                  title={result.meta}
                  disabled={!onSelect}
                  onClick={() => onSelect?.(result.id)}
                >
                  {result.title}
                </button>
              </Fragment>
            ))}
          </p>
        ) : (
          <p className="research-step-meta">没有找到文件</p>
        )}
      </div>
    </div>
  );
}
