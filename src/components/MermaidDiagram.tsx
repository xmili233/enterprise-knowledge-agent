import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus, Scan, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { fitDiagram, zoomDiagram, type DiagramCamera } from "@/lib/diagram-viewport";

type Diagram = { svg: string; width: number; height: number };
let diagramId = 0;

function DiagramCanvas({ diagram, title, interactive = false }: { diagram: Diagram; title: string; interactive?: boolean }) {
  const viewport = useRef<HTMLDivElement>(null);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const [camera, setCamera] = useState<DiagramCamera>({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);

  const fit = useCallback(() => {
    const element = viewport.current;
    if (element) setCamera(fitDiagram(element.clientWidth, element.clientHeight, diagram.width, diagram.height));
  }, [diagram.width, diagram.height]);

  const zoom = useCallback((scale: number) => {
    const element = viewport.current;
    if (element) setCamera((current) => zoomDiagram(current, scale, element.clientWidth / 2, element.clientHeight / 2));
  }, []);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => observer.disconnect();
  }, [fit]);

  useEffect(() => {
    const element = viewport.current;
    if (!element || !interactive) return;
    function wheel(event: WheelEvent) {
      event.preventDefault();
      const bounds = element!.getBoundingClientRect();
      const factor = Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.005);
      setCamera((current) => zoomDiagram(current, current.scale * factor, event.clientX - bounds.left, event.clientY - bounds.top));
    }
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [interactive]);

  function releasePointer() {
    pointer.current = null;
    setDragging(false);
  }

  return (
    <div className={`diagram-view${interactive ? " is-interactive" : ""}`}>
      <div
        className={`diagram-canvas${dragging ? " is-dragging" : ""}`}
        ref={viewport}
        role={interactive ? "region" : "img"}
        aria-label={interactive ? `${title}，方向键平移，加减键缩放，0 键适应窗口` : title}
        tabIndex={interactive ? 0 : undefined}
        onPointerDown={interactive ? (event) => {
          if (event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          setDragging(true);
        } : undefined}
        onPointerMove={interactive ? (event) => {
          const previous = pointer.current;
          if (!previous || previous.id !== event.pointerId) return;
          const dx = event.clientX - previous.x;
          const dy = event.clientY - previous.y;
          pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          setCamera((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
        } : undefined}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        onLostPointerCapture={releasePointer}
        onKeyDown={interactive ? (event) => {
          if (event.altKey || event.ctrlKey || event.metaKey) return;
          const directions: Record<string, [number, number]> = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] };
          const direction = directions[event.key];
          if (direction) {
            event.preventDefault();
            setCamera((current) => ({ ...current, x: current.x + direction[0], y: current.y + direction[1] }));
          } else if (["+", "=", "-", "0"].includes(event.key)) {
            event.preventDefault();
            if (event.key === "0") fit();
            else zoom(camera.scale * (event.key === "-" ? 1 / 1.25 : 1.25));
          }
        } : undefined}
      >
        <div
          className="diagram-stage"
          style={{ width: diagram.width, height: diagram.height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}
          dangerouslySetInnerHTML={{ __html: diagram.svg }}
        />
      </div>
      {interactive && (
        <footer className="diagram-navigation">
          <span className="diagram-hint">拖动平移 · 滚轮或按钮缩放</span>
          <div className="diagram-controls" aria-label="流程图缩放">
            <button type="button" aria-label="缩小流程图" disabled={camera.scale <= 0.05} onClick={() => zoom(camera.scale / 1.25)}><Minus size={17} /></button>
            <output aria-label="当前缩放比例">{Math.round(camera.scale * 100)}%</output>
            <button type="button" aria-label="放大流程图" disabled={camera.scale >= 4} onClick={() => zoom(camera.scale * 1.25)}><Plus size={17} /></button>
            <button type="button" className="diagram-text-button" onClick={() => zoom(1)}>100%</button>
            <button type="button" className="diagram-text-button" onClick={fit}><Scan size={16} />适应窗口</button>
          </div>
        </footer>
      )}
    </div>
  );
}

export function MermaidDiagram({ children, label }: { children: string; label: string }) {
  const [diagram, setDiagram] = useState<Diagram>();
  const [error, setError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const title = /^%% title:\s*(.+)$/m.exec(children)?.[1] ?? `${label}流程图`;

  useEffect(() => {
    let cancelled = false;
    setError(false);
    setDiagram(undefined);
    import("mermaid").then(async ({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: "neutral", fontFamily: "sans-serif", flowchart: { useMaxWidth: false, wrappingWidth: 280, minNodeWidth: 0, padding: 10, nodeSpacing: 24, rankSpacing: 24 }, sequence: { useMaxWidth: false, wrap: true } });
      const result = await mermaid.render(`guide-diagram-${++diagramId}`, children);
      // Mermaid includes HTML labels such as <br>, so parse the fragment as HTML rather than XML.
      const template = document.createElement("template");
      template.innerHTML = result.svg;
      const dimensions = template.content.querySelector("svg")?.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
      if (!dimensions || dimensions.length !== 4 || !dimensions.every(Number.isFinite) || dimensions[2] <= 0 || dimensions[3] <= 0) throw new Error("Invalid diagram dimensions");
      if (!cancelled) setDiagram({ svg: result.svg, width: dimensions[2], height: dimensions[3] });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [children]);

  if (error) return <p className="diagram-fallback" role="status">流程图暂时无法显示，请刷新页面后重试。</p>;

  return (
    <Dialog open={fullscreen} onOpenChange={setFullscreen}>
      <figure className="guide-figure" aria-busy={!diagram}>
        <div className="diagram-toolbar">
          <figcaption>{title}</figcaption>
          <DialogTrigger asChild>
            <button type="button" disabled={!diagram} className="diagram-expand" aria-label={`全屏查看${title}`}><Maximize2 size={15} />全屏查看</button>
          </DialogTrigger>
        </div>
        {diagram && !fullscreen ? (
          <div className="diagram-preview" role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: diagram.svg }} />
        ) : (
          <div className="diagram-preview">
            {diagram ? <div className="diagram-preview-placeholder" style={{ aspectRatio: `${diagram.width} / ${diagram.height}` }} aria-hidden /> : <span className="diagram-placeholder" role="status">正在生成流程图…</span>}
          </div>
        )}
      </figure>
      <DialogContent className="diagram-fullscreen" showCloseButton={false}>
        <header className="diagram-fullscreen-header">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="sr-only">完整流程图画布，可拖动、缩放或适应窗口。按 Escape 返回讲解。</DialogDescription>
          <DialogClose asChild><button type="button" aria-label="退出流程图全屏"><X size={20} /></button></DialogClose>
        </header>
        {diagram && <DiagramCanvas diagram={diagram} title={title} interactive />}
      </DialogContent>
    </Dialog>
  );
}
