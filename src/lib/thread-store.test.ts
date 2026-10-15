import { describe, expect, it } from "vitest";
import { ExportedMessageRepository } from "@assistant-ui/react";
import { ThreadStore } from "./thread-store";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

const question = (id: string, text: string) =>
  ExportedMessageRepository.fromArray([
    {
      id,
      role: "user",
      content: text,
      createdAt: new Date("2026-10-14T00:00:00Z"),
    },
  ]).messages[0];

describe("本地对话历史", () => {
  it("恢复消息内容、标题和日期，并隔离不同对话", () => {
    const storage = createStorage();
    const store = new ThreadStore(storage);
    store.initialize("travel");
    store.initialize("leave");
    store.saveMessage("travel", question("q1", "改签报销"));
    store.saveMessage("leave", question("q2", "年假申请"));
    store.rename("travel", "改签报销");
    const restored = new ThreadStore(storage);
    expect(restored.get("travel").title).toBe("改签报销");
    expect(restored.get("travel").messages[0].message.content[0]).toMatchObject(
      { text: "改签报销" },
    );
    expect(restored.get("travel").messages[0].message.createdAt).toBeInstanceOf(
      Date,
    );
    expect(restored.get("leave").messages[0].message.id).toBe("q2");
  });

  it("重复保存是更新，重试分支可恢复最新 head", () => {
    const store = new ThreadStore(createStorage());
    store.initialize("one");
    store.saveMessage("one", question("q1", "原问题"));
    store.saveMessage("one", question("q1", "更新问题"));
    store.saveMessage("one", { ...question("q2", "后续问题"), parentId: "q1" });
    expect(store.get("one").messages).toHaveLength(2);
    expect(store.get("one").headId).toBe("q2");
    expect(store.get("one").messages[0].message.content[0]).toMatchObject({
      text: "更新问题",
    });
  });

  it("删除一条对话不会删除其他记录", () => {
    const store = new ThreadStore(createStorage());
    store.initialize("one");
    store.initialize("two");
    store.delete("one");
    expect(store.list().map((thread) => thread.remoteId)).toEqual(["two"]);
    expect(() => store.get("one")).toThrow("找不到这条对话");
  });
});
