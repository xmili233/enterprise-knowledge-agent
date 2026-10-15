import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  AssistantRuntimeProvider,
  useAuiEvent,
  useAuiState,
  useLocalRuntime,
  useRemoteThreadListRuntime,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArrowDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeAssistant } from "@/components/KnowledgeAssistant";
import { KnowledgeLibrary } from "@/components/KnowledgeLibrary";
import { SourcePanel } from "@/components/SourcePanel";
import {
  SourceActions,
  type SourceView,
} from "@/components/agent/source-actions";
import { ResearchToolUIs } from "@/components/agent/tool-uis";
import { TooltipProvider } from "@/components/ui/tooltip";
import { knowledgeAdapter } from "@/lib/knowledge-adapter";
import { createThreadAdapter } from "@/lib/thread-adapter";
import { ThreadStore } from "@/lib/thread-store";
import { useSectionPaging } from "@/lib/use-section-paging";
import "./app.css";
import "./workspace.css";

const DesignGuide = lazy(() => import("@/components/DesignGuide"));
const guideChapter = () =>
  location.hash.startsWith("#design/")
    ? location.hash.slice(8) || "overview"
    : null;
const useKnowledgeRuntime = () => useLocalRuntime(knowledgeAdapter);

export default function App() {
  const [adapter] = useState(() =>
    createThreadAdapter(new ThreadStore(window.localStorage)),
  );
  const runtime = useRemoteThreadListRuntime({
    adapter,
    runtimeHook: useKnowledgeRuntime,
  });
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <TooltipProvider>
        <ResearchToolUIs />
        <Workspace />
      </TooltipProvider>
    </AssistantRuntimeProvider>
  );
}

function Workspace() {
  const empty = useAuiState((s) => s.thread.isEmpty);
  const [source, setSource] = useState<SourceView | null>(null);
  const [chapter, setChapter] = useState(guideChapter);
  const [storageError, setStorageError] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const guideRef = useRef<HTMLButtonElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  useSectionPaging(libraryRef);
  useAuiEvent("thread.historyWriteError", () => setStorageError(true));

  useEffect(() => {
    const sync = () => setChapter(guideChapter());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function closeGuide() {
    history.replaceState(null, "", location.pathname + location.search);
    setChapter(null);
  }

  return (
    <SourceActions.Provider value={setSource}>
    <div className="app-shell">
      <a href="#main" className="skip-link">
        跳到主要内容
      </a>
      <main id="main" className="workspace-main">
        <header className="workspace-header">
          <div className="workspace-brand">
            <BookOpen size={20} strokeWidth={1.7} aria-hidden="true" />
            <span>企业内部知识助手</span>
          </div>
          {!empty && (
            <ThreadListPrimitive.Root>
              <ThreadListPrimitive.New
                className="new-chat-entry"
                onClick={() => {
                  document.getElementById("main")?.scrollIntoView({ behavior: "instant" });
                }}
              >
                新对话
              </ThreadListPrimitive.New>
            </ThreadListPrimitive.Root>
          )}
          <Button
            ref={guideRef}
            variant="ghost"
            className="design-entry"
            onClick={() => {
              location.hash = "design/overview";
            }}
          >
            设计讲解
          </Button>
        </header>
        <section className="assistant-section" aria-label="提问与对话">
          {storageError && (
            <p className="storage-error" role="alert">
              这次对话未能保存到浏览器，请检查浏览器存储空间后重试。
            </p>
          )}
          <div className="chat-view">
            <KnowledgeAssistant inputRef={inputRef} />
          </div>
          {empty && (
            <div className="knowledge-explore-wrap">
              <a href="#knowledge-library" className="knowledge-explore">
                <ArrowDown size={16} strokeWidth={1.5} aria-hidden="true" />
                <span>向下浏览知识库</span>
              </a>
            </div>
          )}
        </section>
        <div ref={libraryRef} id="knowledge-library" className="library-view" tabIndex={-1}>
          <KnowledgeLibrary
            onOpenDocument={(id) => setSource({ id })}
          />
        </div>
      </main>
      <SourcePanel view={source} setView={setSource} />
      {chapter !== null && (
        <Suspense
          fallback={
            <div role="status" className="guide-loading">
              正在打开设计讲解…
            </div>
          }
        >
          <DesignGuide
            chapter={chapter}
            onClose={closeGuide}
            onFocusReturn={() => guideRef.current?.focus()}
          />
        </Suspense>
      )}
    </div>
    </SourceActions.Provider>
  );
}
