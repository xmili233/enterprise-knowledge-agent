import { useEffect, useRef, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { documents, type KnowledgeDocument } from "@/data/knowledge";
import type {
  SourceHighlight,
  SourceView,
} from "@/components/agent/source-actions";

export function SourcePanel({
  view,
  setView,
}: {
  view: SourceView | null;
  setView: (view: SourceView | null) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const doc = documents.find((item) => item.id === view?.id);
  const highlights = view?.highlights ?? [];
  const activeIndex = Math.max(
    0,
    highlights.findIndex((item) => item.n === view?.active),
  );
  const active = highlights[activeIndex];

  useEffect(() => {
    if (!view) return;
    const frame = requestAnimationFrame(() => {
      const target =
        scrollRef.current?.querySelector(`[data-cite="${view.active}"]`) ??
        scrollRef.current?.querySelector(`[data-passage="${view.passageId}"]`);
      if (target)
        target.scrollIntoView({ block: "center", behavior: "instant" });
      else scrollRef.current?.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [view]);

  function step(offset: number) {
    const next = highlights[activeIndex + offset];
    if (view && next) setView({ ...view, active: next.n });
  }

  return (
    <Sheet
      open={!!view}
      onOpenChange={(open) => {
        if (!open) setView(null);
      }}
    >
      <SheetContent
        className="source-panel"
        aria-describedby="source-description"
        onOpenAutoFocus={() => {
          returnFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          returnFocusRef.current?.focus({ preventScroll: true });
        }}
      >
        <SheetHeader className="source-header">
          <div className="panel-type">
            {highlights.length || view?.passageId ? "引用原文" : "文件预览"}
          </div>
          <SheetTitle>{doc?.title ?? "资料阅读"}</SheetTitle>
          <SheetDescription id="source-description">
            可核对章节与原文内容
          </SheetDescription>
        </SheetHeader>
        {doc && (
          <div className="source-scroll" ref={scrollRef}>
            <div className="document-meta">
              <Badge variant="secondary">v{doc.version}</Badge>
              <span>{doc.code}</span>
              <span>更新于 {doc.updated}</span>
            </div>
            {active ? (
              <div className="citation-nav" role="group" aria-label="本文件中的引用">
                <span className="citation-nav-mark" aria-hidden />
                <p aria-live="polite">
                  回答引用此文件 {highlights.length} 处 · 当前为引用 {active.n}
                  <small>相关度 {active.score}/10</small>
                </p>
                {highlights.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="上一处引用"
                      disabled={activeIndex === 0}
                      onClick={() => step(-1)}
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label="下一处引用"
                      disabled={activeIndex === highlights.length - 1}
                      onClick={() => step(1)}
                    >
                      <ChevronDown size={15} />
                    </button>
                  </>
                )}
              </div>
            ) : view?.passageId ? (
              <p className="highlight-label">
                <span />
                已定位到候选段落
              </p>
            ) : null}
            <DocumentReader
              document={doc}
              passageId={view?.passageId}
              highlights={highlights}
              active={active?.n}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Wraps each cited sentence in a mark, so a citation points at its exact words rather than the whole passage. */
function markQuotes(
  text: string,
  highlights: SourceHighlight[],
  active?: number,
): ReactNode[] {
  const spans = highlights
    .map((item) => ({ ...item, start: text.indexOf(item.quote) }))
    .filter((item) => item.start >= 0)
    .sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    nodes.push(text.slice(cursor, span.start));
    nodes.push(
      <mark
        key={span.n}
        data-cite={span.n}
        className={span.n === active ? "is-active" : undefined}
      >
        {span.quote}
        <sup>{span.n}</sup>
      </mark>,
    );
    cursor = span.start + span.quote.length;
  }
  nodes.push(text.slice(cursor));
  return nodes;
}

function DocumentReader({
  document: doc,
  passageId,
  highlights,
  active,
}: {
  document: KnowledgeDocument;
  passageId?: string;
  highlights: SourceHighlight[];
  active?: number;
}) {
  return (
    <article className="document-paper" aria-label={doc.title}>
      <p className="document-company">澄明科技</p>
      <h2>{doc.title}</h2>
      {doc.passages.map((passage) => {
        const marks = highlights.filter((item) => item.passageId === passage.id);
        return (
          <section
            key={passage.id}
            data-passage={passage.id}
            className={
              passage.id === passageId || marks.length
                ? "passage highlighted"
                : "passage"
            }
          >
            <div className="passage-heading">
              <h3>{passage.heading}</h3>
              <span>第 {passage.page} 页</span>
            </div>
            <p>
              {marks.length ? (
                markQuotes(passage.text, marks, active)
              ) : passage.id === passageId ? (
                <mark>{passage.text}</mark>
              ) : (
                passage.text
              )}
            </p>
          </section>
        );
      })}
      <p className="document-end">文档节选结束</p>
    </article>
  );
}
