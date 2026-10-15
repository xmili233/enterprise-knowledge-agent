import { useMemo } from "react";
import {
  useAui,
  type RemoteThreadListAdapter,
  type ThreadHistoryAdapter,
} from "@assistant-ui/react";
import { createAssistantStream } from "assistant-stream";
import { ThreadStore } from "./thread-store";

export function createThreadAdapter(
  store: ThreadStore,
): RemoteThreadListAdapter {
  return {
    async list() {
      return {
        threads: store
          .list()
          .map(
            ({ messages: _messages, headId: _head, ...metadata }) => metadata,
          ),
      };
    },
    async initialize(id) {
      store.initialize(id);
      return { remoteId: id };
    },
    async fetch(id) {
      return store.get(id);
    },
    async rename(id, title) {
      store.rename(id, title);
    },
    async archive(id) {
      store.setStatus(id, "archived");
    },
    async unarchive(id) {
      store.setStatus(id, "regular");
    },
    async delete(id) {
      store.delete(id);
    },
    async generateTitle(id, messages) {
      const question =
        messages
          .find((message) => message.role === "user")
          ?.content.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ")
          .trim() || "新对话";
      const title =
        question.length > 24 ? `${question.slice(0, 24)}…` : question;
      store.rename(id, title);
      return createAssistantStream((controller) =>
        controller.appendText(title),
      );
    },
    unstable_useAdapters: function useHistoryAdapters() {
      const aui = useAui();
      const history = useMemo<ThreadHistoryAdapter>(() => {
        const save: ThreadHistoryAdapter["append"] = async (item) => {
          const { remoteId } = await aui.threadListItem.initialize();
          store.saveMessage(remoteId, item);
        };
        return {
          async load() {
            const { remoteId } = aui.threadListItem.getState();
            if (!remoteId) return { messages: [] };
            const { messages, headId } = store.get(remoteId);
            return { messages, headId };
          },
          append: save,
          update: save,
        };
      }, [aui]);
      return useMemo(() => ({ history }), [history]);
    },
  };
}
