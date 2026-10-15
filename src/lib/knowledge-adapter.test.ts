import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ChatModelRunOptions,
  ChatModelRunResult,
} from "@assistant-ui/react";
import { knowledgeAdapter, type KnowledgeMessage } from "./knowledge-adapter";

function options(controller = new AbortController()): ChatModelRunOptions {
  return {
    messages: [
      {
        id: "question",
        role: "user",
        createdAt: new Date(),
        content: [{ type: "text", text: "出差改签费可以报销吗？" }],
        metadata: { custom: {} },
        attachments: [],
      },
    ],
    runConfig: {},
    abortSignal: controller.signal,
    context: {},
    unstable_getMessage: () => {
      throw new Error(
        "The local adapter should not read internal runtime state.",
      );
    },
  };
}

async function collect() {
  const updates: ChatModelRunResult[] = [];
  const done = (async () => {
    for await (const update of knowledgeAdapter.run(options()))
      updates.push(update);
  })();
  await vi.runAllTimersAsync();
  await done;
  return updates;
}

describe("assistant-ui 本地适配器", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("按思考、检索、收集证据、补查、整理思路、回答的顺序输出消息片段", async () => {
    const updates = await collect();
    const final = updates.at(-1)!;
    expect(
      final.content?.map((part) =>
        part.type === "tool-call" ? part.toolName : part.type,
      ),
    ).toEqual([
      "reasoning",
      "search_knowledge",
      "gather_evidence",
      "reasoning",
      "search_knowledge",
      "gather_evidence",
      "reasoning",
      "text",
    ]);
    for (const part of final.content ?? [])
      if (part.type === "tool-call") expect(part.result).toBeDefined();
  });

  it("同一轮的思考和工具调用共享轮次编号，每轮先给出要查的问题", async () => {
    const updates = await collect();
    const final = updates.at(-1)!;
    expect(
      final.content?.map((part) =>
        part.type === "text"
          ? "answer"
          : "parentId" in part
            ? part.parentId
            : undefined,
      ),
    ).toEqual([
      "round-1",
      "round-1",
      "round-1",
      "round-2",
      "round-2",
      "round-2",
      "round-final",
      "answer",
    ]);
    const custom = final.metadata?.custom as KnowledgeMessage;
    expect(custom.rounds).toEqual([
      {
        id: "round-1",
        kind: "search",
        title: "因公务或个人原因改签，费用能否报销？",
        summary: "2 份文件，保留 2 段证据",
      },
      {
        id: "round-2",
        kind: "recheck",
        title: "改签费用报销需要哪些材料，什么时候提交？",
        summary: "3 份文件，保留 3 段证据",
      },
      { id: "round-final", kind: "synthesis", title: "整理回答" },
    ]);
    // The round title is known before any of its reasoning streams.
    const first = updates.find((update) => update.content?.length);
    expect(
      (first?.metadata?.custom as KnowledgeMessage).rounds?.map((r) => r.id),
    ).toEqual(["round-1"]);
  });

  it("引用标记整体出现，不会输出半个编号", async () => {
    const updates = await collect();
    for (const update of updates) {
      const text = update.content?.find((part) => part.type === "text");
      if (text?.type !== "text") continue;
      expect(text.text).not.toMatch(/\[\d*$|\]\(#c?i?t?e?-?$/);
    }
    const final = updates.at(-1)!;
    const text = final.content?.find((part) => part.type === "text");
    expect(text?.type === "text" && text.text).toContain("[1](#cite-1)");
  });

  it("完成时附带引用原文、相关度和查找统计", async () => {
    const final = (await collect()).at(-1)!;
    const custom = final.metadata?.custom as KnowledgeMessage;
    expect(custom.outcome).toBe("grounded");
    expect(custom.status).toEqual({ documents: 3, relevant: 2, evidence: 5 });
    expect(custom.citations?.[0]).toMatchObject({
      n: 1,
      ref: "travel-policy:business-change",
      title: "差旅管理办法",
      page: 4,
      score: 9,
    });
  });

  it("停止后中断等待，不再继续输出", async () => {
    const controller = new AbortController();
    const run = knowledgeAdapter.run(options(controller));
    const pending = run.next();
    const rejected = expect(pending).rejects.toMatchObject({
      name: "AbortError",
    });
    controller.abort();
    await rejected;
    expect(vi.getTimerCount()).toBe(0);
    expect((await run.next()).done).toBe(true);
  });
});
