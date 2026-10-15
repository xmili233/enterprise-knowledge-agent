import type {
  ExportedMessageRepository,
  ExportedMessageRepositoryItem,
} from "@assistant-ui/react";

type SavedThread = ExportedMessageRepository & {
  remoteId: string;
  title?: string;
  status: "regular" | "archived";
  lastMessageAt: Date;
};

const storageKey = "enterprise-knowledge-conversations";

export class ThreadStore {
  constructor(private storage: Pick<Storage, "getItem" | "setItem">) {}

  private read(): SavedThread[] {
    const raw = this.storage.getItem(storageKey);
    if (!raw) return [];
    const data: unknown = JSON.parse(raw, (key, value) =>
      (key === "createdAt" || key === "lastMessageAt") &&
      typeof value === "string"
        ? new Date(value)
        : value,
    );
    if (!Array.isArray(data)) throw new Error("本地对话记录无法读取。");
    return data as SavedThread[];
  }

  list() {
    return this.read().sort(
      (a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime(),
    );
  }

  get(id: string) {
    const thread = this.read().find((item) => item.remoteId === id);
    if (!thread) throw new Error("找不到这条对话。");
    return thread;
  }

  private write(thread: SavedThread) {
    const threads = this.read();
    const index = threads.findIndex(
      (item) => item.remoteId === thread.remoteId,
    );
    if (index < 0) threads.push(thread);
    else threads[index] = thread;
    this.storage.setItem(storageKey, JSON.stringify(threads));
  }

  initialize(id: string) {
    if (!this.read().some((item) => item.remoteId === id)) {
      this.write({
        remoteId: id,
        status: "regular",
        lastMessageAt: new Date(),
        messages: [],
      });
    }
  }

  rename(id: string, title: string) {
    this.write({ ...this.get(id), title });
  }

  setStatus(id: string, status: SavedThread["status"]) {
    this.write({ ...this.get(id), status });
  }

  delete(id: string) {
    this.storage.setItem(
      storageKey,
      JSON.stringify(this.read().filter((item) => item.remoteId !== id)),
    );
  }

  saveMessage(id: string, item: ExportedMessageRepositoryItem) {
    const thread = this.get(id);
    const messages = thread.messages.filter(
      (entry) => entry.message.id !== item.message.id,
    );
    messages.push(item);
    this.write({
      ...thread,
      messages,
      headId: item.message.id,
      lastMessageAt: new Date(),
    });
  }
}
