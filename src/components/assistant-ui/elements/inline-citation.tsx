"use client";

import type { ComponentProps } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
import { FileTextIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { floating, mono } from "./surfaces";

// Adapted from the assistant-ui `elements-inline-citation` registry item:
// internal documents carry a locator line instead of a domain and URL, and the
// trigger opens the cited passage rather than an external page.
export interface Source {
  title: string;
  snippet: string;
  /** Version, page and similar locators shown above the title. */
  meta?: string | undefined;
  hint?: string | undefined;
}

export interface CitationProps extends Omit<
  ComponentProps<"button">,
  "aria-label" | "children" | "className" | "type"
> {
  index: number;
  source: Source;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  className?: string | undefined;
}

export function Citation({
  index,
  source,
  open,
  onOpenChange,
  className,
  ...props
}: CitationProps) {
  return (
    <PreviewCard.Root open={open} onOpenChange={onOpenChange}>
      <PreviewCard.Trigger
        delay={0}
        render={<button type="button" {...props} />}
        data-slot="inline-citation-marker"
        aria-label={`引用 ${index + 1}：${source.title}`}
        className={cn("citation-marker", className)}
      >
        <FileTextIcon size={14} strokeWidth={1.8} aria-hidden />
        <span>{index + 1}</span>
      </PreviewCard.Trigger>
      <PreviewCard.Portal>
        <PreviewCard.Positioner side="top" sideOffset={8}>
          <PreviewCard.Popup
            className={cn(
              floating,
              "z-50 w-72 origin-(--transform-origin) rounded-2xl p-3.5 shadow-sm outline-none",
              "transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none",
              "data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0",
              "data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0",
            )}
          >
            {source.meta ? (
              <span className={cn(mono, "text-muted-foreground")}>
                {source.meta}
              </span>
            ) : null}
            <p
              className={cn(
                "text-[13px] leading-snug font-medium",
                source.meta && "mt-1.5",
              )}
            >
              {source.title}
            </p>
            <p className="text-foreground/80 mt-1.5 text-[13px] leading-relaxed">
              <mark className="bg-[var(--source-highlight)] text-inherit">
                {source.snippet}
              </mark>
            </p>
            {source.hint ? (
              <p className="text-muted-foreground mt-2.5 text-xs">
                {source.hint}
              </p>
            ) : null}
          </PreviewCard.Popup>
        </PreviewCard.Positioner>
      </PreviewCard.Portal>
    </PreviewCard.Root>
  );
}
