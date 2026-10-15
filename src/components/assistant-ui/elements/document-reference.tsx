"use client";

import type { ComponentProps } from "react";
import { ArrowUpRightIcon, FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { field, paper } from "./surfaces";

// Adapted from assistant-ui/elements-document-reference (MIT).
// Indexes distinguish multiple quoted sentences on the same page.
export interface DocumentAnchor {
  page: number;
  quote: string;
  label: string;
}

export function DocumentReference({
  title, meta, anchors, activeIndex, onJump, className, ...props
}: Omit<ComponentProps<"div">, "children" | "title"> & {
  title: string;
  meta: string;
  anchors: readonly DocumentAnchor[];
  activeIndex?: number;
  onJump: (index: number) => void;
}) {
  return (
    <div data-slot="document-reference" className={cn(paper, "document-reference", className)} {...props}>
      <div className="document-reference-header">
        <span className="agent-file-icon"><FileTextIcon size={17} aria-hidden /></span>
        <span className="agent-file-label"><strong>{title}</strong><small>{meta}</small></span>
      </div>
      <div className="document-reference-anchors">
        {anchors.map((anchor, index) => (
          <button key={index} type="button" aria-current={activeIndex === index || undefined} onClick={() => onJump(index)} className={cn("document-anchor", activeIndex === index && field)} aria-label={`查看${title}的${anchor.label}原文`}>
            <span className="document-anchor-heading"><span>第 {anchor.page} 页 · {anchor.label}</span><ArrowUpRightIcon size={12} aria-hidden /></span>
            <span className="document-anchor-quote">{anchor.quote}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
