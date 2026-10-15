"use client";

import type { ComponentProps } from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShimmerLabel } from "./surfaces";

// Adapted from assistant-ui/elements-web-search: enterprise files replace URLs.
export interface WebSearchResult {
  id: string;
  title: string;
  meta: string;
}

export function WebSearch({
  query, scope, results, searching, onSelect, className, ...props
}: Omit<ComponentProps<"div">, "children" | "query" | "results" | "onSelect"> & {
  query: string;
  scope: string;
  results: readonly WebSearchResult[];
  searching: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <div data-slot="web-search" aria-busy={searching} className={cn("agent-search", className)} {...props}>
      <div className="agent-tool-heading">
        <SearchIcon size={15} aria-hidden />
        <span>检索</span>
        <span className="agent-search-query">{query}</span>
        <span className="agent-tool-state">
          {searching ? <ShimmerLabel>检索中</ShimmerLabel> : `${results.length} 份文件`}
        </span>
      </div>
      <div className="agent-search-details">
        <span className="agent-search-scope">{scope}</span>
        {!searching && (results.length ? (
          <ul className="agent-search-results" aria-label="检索到的文件">
            {results.map((result) => (
              <li key={result.id}>
                <button type="button" disabled={!onSelect} onClick={() => onSelect?.(result.id)} aria-label={`查看${result.title}`} title={`${result.title} · ${result.meta}`}>
                  {result.title}
                </button>
              </li>
            ))}
          </ul>
        ) : <span>没有找到相关文件</span>)}
      </div>
    </div>
  );
}
