import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  ComposerPrimitive,
  MessagePrimitive,
  type PartState,
  ThreadPrimitive,
  useAui,
  useAuiState,
} from "@assistant-ui/react";
import {
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Square,
} from "lucide-react";
import { ResearchProcess } from "@/components/agent/research-process";
import { AnswerText } from "@/components/agent/answer-text";
import { AnswerFooter } from "@/components/agent/answer-footer";
import { guidedQuestions } from "@/lib/research";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import "./knowledge-assistant.css";
import "./agent/agent.css";

interface Props {
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

export function KnowledgeAssistant(props: Props) {
  const empty = useAuiState((s) => s.thread.isEmpty);
  const rootRef = useRef<HTMLDivElement>(null);
  const previousComposer = useRef<DOMRect | null>(null);
  const exitRef = useRef<HTMLHeadingElement>(null);
  const [headingExit, setHeadingExit] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  function prepareSend() {
    if (!empty || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = rootRef.current;
    const composer = root?.querySelector(".assistant-composer");
    const heading = root?.querySelector(".assistant-welcome h1");
    if (!root || !composer || !heading) return;
    previousComposer.current = composer.getBoundingClientRect();
    const bounds = heading.getBoundingClientRect();
    const container = root.getBoundingClientRect();
    setHeadingExit({
      top: bounds.top - container.top,
      left: bounds.left - container.left,
      width: bounds.width,
    });
  }

  useLayoutEffect(() => {
    if (empty) {
      previousComposer.current = null;
      setHeadingExit(null);
      return;
    }
    const previous = previousComposer.current;
    previousComposer.current = null;
    const root = rootRef.current;
    const composer = root?.querySelector<HTMLElement>(".assistant-composer");
    if (!previous || !root || !composer) return;
    const current = composer.getBoundingClientRect();
    const style = getComputedStyle(root);
    const easing = style.getPropertyValue("--ease-out").trim();
    // The composer also shrinks to a single row, so animate its height with the move.
    const move = composer.animate([
      {
        transform: `translate(${previous.left - current.left}px, ${previous.top - current.top}px)`,
        height: `${previous.height}px`,
      },
      { transform: "translate(0, 0)", height: `${current.height}px` },
    ], {
      duration: parseFloat(style.getPropertyValue("--duration-composer")),
      easing,
    });
    props.inputRef.current?.focus({ preventScroll: true });
    const fade = exitRef.current?.animate([
      { opacity: 1, transform: "translateY(0)" },
      { opacity: 0, transform: "translateY(-8px)" },
    ], {
      duration: parseFloat(style.getPropertyValue("--duration-welcome")),
      easing,
      fill: "forwards",
    });
    if (fade) fade.onfinish = () => setHeadingExit(null);
    return () => {
      move.cancel();
      fade?.cancel();
    };
  }, [empty, props.inputRef]);

  return (
    <ThreadPrimitive.Root
      ref={rootRef}
      className={`knowledge-assistant ${empty ? "is-empty" : "has-messages"}`}
      aria-label="企业知识问答"
    >
      <ThreadPrimitive.Viewport className="assistant-viewport">
        {empty ? (
          <div className="assistant-welcome">
            <h1>有什么可以帮你？</h1>
          </div>
        ) : (
          <ThreadPrimitive.Messages>
            {({ message }) =>
              message.role === "user" ? (
                <MessagePrimitive.Root className="assistant-user-message">
                  <div className="assistant-user-bubble">
                    <MessagePrimitive.Parts />
                  </div>
                </MessagePrimitive.Root>
              ) : (
                <AssistantMessage />
              )
            }
          </ThreadPrimitive.Messages>
        )}
        <ThreadPrimitive.ViewportFooter key="composer" className="assistant-footer">
          <ThreadPrimitive.ScrollToBottom
            className="assistant-scroll-bottom"
            aria-label="回到最新消息"
            title="回到最新消息"
          >
            <ArrowDown size={17} />
          </ThreadPrimitive.ScrollToBottom>
          <KnowledgeComposer {...props} onBeforeSend={prepareSend} />
        </ThreadPrimitive.ViewportFooter>
      </ThreadPrimitive.Viewport>
      {headingExit && !empty && (
        <h1 ref={exitRef} className="assistant-welcome-exit" style={headingExit} aria-hidden="true">
          有什么可以帮你？
        </h1>
      )}
    </ThreadPrimitive.Root>
  );
}

/**
 * Shows the "cannot edit" hint on hover, or straight away when the visitor
 * tries to type, paste or tap. Opening is ours alone: focus moves into the
 * input after each send, and that must not pop the hint.
 */
function useEditHint() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return {
    open,
    hover() {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(true), 400);
    },
    nudge() {
      clearTimeout(timer.current);
      // Defer past the trigger's own click handling, which closes tooltips.
      setTimeout(() => setOpen(true), 0);
      timer.current = setTimeout(() => setOpen(false), 2200);
    },
    hide() {
      clearTimeout(timer.current);
      setOpen(false);
    },
  };
}

/**
 * Guided demo composer: the current step's question is filled in and cannot be
 * edited, so the visitor can only send it and walk the scenarios in order.
 */
function KnowledgeComposer({ inputRef, onBeforeSend }: Props & { onBeforeSend: () => void }) {
  const aui = useAui();
  const empty = useAuiState((s) => s.thread.isEmpty);
  const busy = useAuiState((s) => s.thread.isRunning);
  const text = useAuiState((s) => s.composer.text);
  const asked = useAuiState(
    (s) => s.thread.messages.filter((message) => message.role === "user").length,
  );
  const question = guidedQuestions[asked];
  const total = guidedQuestions.length;
  const ready = !!question && text === question;
  const hint = useEditHint();

  // Each sent question advances the step; a new conversation starts over.
  useEffect(() => {
    aui.composer.setText(question ?? "");
  }, [aui, question]);

  return (
    <ComposerPrimitive.Root
      className="assistant-composer"
      onSubmit={(event) => {
        if (!ready) event.preventDefault();
        else onBeforeSend();
      }}
    >
      <Tooltip
        open={hint.open}
        onOpenChange={(open) => {
          if (!open) hint.hide();
        }}
      >
        <TooltipTrigger asChild>
          <ComposerPrimitive.Input
            ref={inputRef}
            id="question"
            className="assistant-input"
            readOnly
            aria-readonly
            placeholder="演示已完成"
            aria-label={`演示问题 ${Math.min(asked + 1, total)} / ${total}，只能发送，不能修改`}
            minRows={empty ? 2 : 1}
            maxRows={8}
            addAttachmentOnPaste={false}
            onMouseEnter={hint.hover}
            onMouseLeave={hint.hide}
            onBlur={hint.hide}
            onPaste={hint.nudge}
            onPointerUp={(event) => {
              if (event.pointerType !== "mouse") hint.nudge();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (!ready) event.preventDefault();
              } else if (
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey &&
                (event.key.length === 1 ||
                  event.key === "Backspace" ||
                  event.key === "Delete")
              ) {
                hint.nudge();
              }
            }}
          />
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8}>
          {question ? "演示版本，问题不能修改，直接发送即可" : "演示已完成，可以重新开始"}
        </TooltipContent>
      </Tooltip>
      <div className="assistant-composer-bottom">
        {busy ? (
          <ComposerPrimitive.Cancel
            className="assistant-send"
            aria-label="停止回答"
            title="停止回答"
          >
            <Square size={13} fill="currentColor" />
          </ComposerPrimitive.Cancel>
        ) : question ? (
          <ComposerPrimitive.Send
            className="assistant-send"
            disabled={!ready}
            onClick={onBeforeSend}
            aria-label="发送问题"
            title="发送问题"
          >
            <ArrowUp size={20} />
          </ComposerPrimitive.Send>
        ) : (
          <button
            type="button"
            className="assistant-restart"
            onClick={() => aui.threads.switchToNewThread()}
          >
            <RotateCcw size={14} />
            重新开始
          </button>
        )}
      </div>
    </ComposerPrimitive.Root>
  );
}

// A reply's activity stays in one disclosure; its answer remains outside.
const groupBy = (part: PartState): readonly `group-${string}`[] =>
  part.type === "reasoning" || part.type === "tool-call"
    ? ["group-process"]
    : [];

function AssistantMessage() {
  // A real model takes a moment before its first token; show that wait.
  const waiting = useAuiState(
    (s) =>
      s.message.status?.type === "running" && s.message.parts.length === 0,
  );

  return (
    <MessagePrimitive.Root
      className="assistant-answer"
      aria-label="知识助手的回答"
    >
      {waiting && (
        <p className="assistant-starting" role="status">
          <span className="shimmer">正在思考</span>
        </p>
      )}
      <MessagePrimitive.GroupedParts groupBy={groupBy}>
        {({ part }) => {
          if (part.type === "group-process")
            return <ResearchProcess indices={part.indices} />;
          switch (part.type) {
            case "tool-call":
              return part.toolUI ?? null;
            case "text":
              return <AnswerText />;
            default:
              return null;
          }
        }}
      </MessagePrimitive.GroupedParts>
      <AnswerFooter />
    </MessagePrimitive.Root>
  );
}
