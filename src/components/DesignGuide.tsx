import { isValidElement, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import overview from "@/content/design/overview.md?raw";
import scenarios from "@/content/design/scenarios.md?raw";
import priorities from "@/content/design/priorities.md?raw";
import references from "@/content/design/references.md?raw";
import ingestion from "@/content/design/ingestion.md?raw";
import retrieval from "@/content/design/retrieval.md?raw";
import citations from "@/content/design/citations.md?raw";
import boundaries from "@/content/design/boundaries.md?raw";
import evals from "@/content/design/evals.md?raw";
import implementation from "@/content/design/implementation.md?raw";
import "./design-guide.css";

const chapters = [
  { id: "overview", title: "概览", content: overview },
  { id: "scenarios", title: "场景拆解", content: scenarios },
  { id: "priorities", title: "准确性优先", content: priorities },
  { id: "references", title: "参考项目", content: references },
  { id: "ingestion", title: "资料入库", content: ingestion },
  { id: "retrieval", title: "检索与补查", content: retrieval },
  { id: "citations", title: "引用与核对", content: citations },
  { id: "boundaries", title: "权限与边界", content: boundaries },
  { id: "evals", title: "评估与观测", content: evals },
  { id: "implementation", title: "实现与取舍", content: implementation },
];
let diagramId = 0;
function Mermaid({ children, label }: { children: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    import("mermaid")
      .then(async ({ default: mermaid }) => {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "neutral",
          fontFamily: "sans-serif",
          flowchart: { useMaxWidth: false, nodeSpacing: 36, rankSpacing: 36 },
          sequence: { useMaxWidth: false, wrap: true },
        });
        const result = await mermaid.render(
          `guide-diagram-${++diagramId}`,
          children,
        );
        if (!cancelled && ref.current) ref.current.innerHTML = result.svg;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [children]);
  return error ? (
    <div className="diagram-fallback">
      <p>流程图暂时无法显示，以下是图表源码。</p>
      <pre>{children}</pre>
    </div>
  ) : (
    <div
      className="guide-diagram"
      ref={ref}
      role="img"
      tabIndex={0}
      aria-label={`${label}图示`}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        if (event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) return;
        event.preventDefault();
        event.currentTarget.scrollBy({ left: event.key === "ArrowRight" ? 80 : -80 });
      }}
    />
  );
}
// The chapter title is the section's h2, so the chapter's own headings start at h3.
function Markdown({ children, label }: { children: string; label: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h2: ({ children }) => <h3>{children}</h3>,
        h3: ({ children }) => <h4>{children}</h4>,
        pre: ({ children }) =>
          isValidElement<{ className?: string }>(children) &&
          children.props.className === "language-mermaid" ? (
            <>{children}</>
          ) : (
            <pre>{children}</pre>
          ),
        code: ({ className, children }) =>
          className === "language-mermaid" ? (
            <Mermaid label={label}>{String(children).trim()}</Mermaid>
          ) : (
            <code className={className}>{children}</code>
          ),
        table: ({ children }) => (
          <div className="guide-table">
            <table>{children}</table>
          </div>
        ),
        a: ({ children, ...props }) => (
          <a {...props} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
export default function DesignGuide({
  chapter,
  onClose,
  onFocusReturn,
}: {
  chapter: string;
  onClose: () => void;
  onFocusReturn: () => void;
}) {
  const reading = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(chapter);
  useEffect(() => {
    const id = chapters.some((item) => item.id === chapter)
      ? chapter
      : "overview";
    setActive(id);
    const frame = requestAnimationFrame(() =>
      document
        .getElementById(`design-${id}`)
        ?.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [chapter]);
  useEffect(() => {
    const root = reading.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("design-", ""));
      },
      { root, rootMargin: "0px 0px -65% 0px", threshold: 0 },
    );
    root
      .querySelectorAll(".guide-chapter")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  function navigate(id: string) {
    location.hash = `design/${id}`;
    document
      .getElementById(`design-${id}`)
      ?.scrollIntoView({ block: "start", behavior: "instant" });
    setActive(id);
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="design-dialog"
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          reading.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          onFocusReturn();
        }}
      >
        <header className="guide-header">
          <DialogTitle>设计讲解</DialogTitle>
          <DialogDescription className="sr-only">
            企业知识助手的场景拆解、准确性取舍、Agent 设计与当前实现
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" aria-label="关闭设计讲解">
              <X size={18} />
            </Button>
          </DialogClose>
        </header>
        <div className="guide-mobile-select">
          <Select value={active} onValueChange={navigate}>
            <SelectTrigger aria-label="选择讲解章节">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((item) => (
                <SelectItem value={item.id} key={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="guide-layout">
          <div
            className="guide-reading"
            ref={reading}
            tabIndex={-1}
            aria-label="设计讲解正文"
          >
            <article>
              {chapters.map((item) => (
                <section
                  className="guide-chapter"
                  id={`design-${item.id}`}
                  key={item.id}
                  aria-labelledby={`design-title-${item.id}`}
                >
                  <h2 id={`design-title-${item.id}`}>{item.title}</h2>
                  <Markdown label={item.title}>{item.content}</Markdown>
                </section>
              ))}
            </article>
          </div>
          <nav className="guide-toc" aria-label="本页目录">
            <p>本页目录</p>
            {chapters.map((item) => (
              <button
                key={item.id}
                aria-current={active === item.id ? "location" : undefined}
                onClick={() => navigate(item.id)}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </div>
      </DialogContent>
    </Dialog>
  );
}
