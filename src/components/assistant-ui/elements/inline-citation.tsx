"use client";

import type { ComponentProps } from "react";
import { PreviewCard } from "@base-ui/react/preview-card";
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
        aria-label={`引用 ${index + 1}：${source.title}`}
        className={cn(
          "bg-foreground/[0.06] text-muted-foreground hover:text-foreground/90 data-[popup-open]:bg-foreground data-[popup-open]:text-background ms-0.5 inline-flex h-4 min-w-4 translate-y-[-2px] cursor-pointer items-center justify-center rounded-[5px] px-1 align-middle font-mono text-[10px] font-medium tabular-nums transition-colors motion-reduce:transition-none",
          className,
        )}
      >
        {index + 1}
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
