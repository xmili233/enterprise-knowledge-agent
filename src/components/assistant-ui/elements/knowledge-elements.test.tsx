import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RunActivity } from "./run-activity";
import { RetrievalChunks } from "./retrieval-chunks";
import { DocumentReference } from "./document-reference";

describe("知识问答组件的数据表达", () => {
  it("收起过程仍保留回答，并显示最近的进行中活动", () => {
    const html = renderToStaticMarkup(createElement(RunActivity, {
      status: "running", statusLabel: "查找中", open: false, onOpenChange() {},
      entries: [{ id: "search", kind: "tool", label: "正在核对材料", content: createElement("p", null, "详细工具结果") }],
      children: createElement("p", null, "最终回答独立于过程"),
    }));
    expect(html).toContain("最终回答独立于过程");
    expect(html).toContain("正在核对材料");
    expect(html).not.toContain("详细工具结果");
  });

  it("逐行保留相关度、筛选结论与低分理由，并能定位原文", () => {
    const html = renderToStaticMarkup(createElement(RetrievalChunks, {
      query: "申请材料", cutoff: 5, searching: false,
      chunks: [
        { id: "good", source: "差旅制度", locator: "第 4 页", score: 9, summary: "需要书面确认", kept: true },
        { id: "low", source: "通用清单", locator: "第 1 页", score: 4, summary: "通用材料清单，没有涉及改签", kept: false },
      ],
      onSelect() {},
    }));
    expect(html).toContain('aria-label="相关度 9/10"');
    expect(html).toContain('aria-label="相关度 4/10"');
    expect(html).toContain("2 段候选 · 保留 1 段 · 5 分起采用");
    expect(html).toContain("需要书面确认");
    expect(html).toContain("通用材料清单，没有涉及改签");
    expect(html).toContain("采用");
    expect(html).toContain("排除");
    expect(html).toContain("查看差旅制度 · 第 4 页的原文");
  });

  it("同页的两处引用有各自的操作名称，只有所选引用高亮", () => {
    const html = renderToStaticMarkup(createElement(DocumentReference, {
      title: "差旅制度", meta: "v2.1 · 2 处引用", activeIndex: 1, onJump() {},
      anchors: [
        { page: 4, label: "引用 1", quote: "公务改签可以申请报销" },
        { page: 4, label: "引用 2", quote: "需取得书面确认" },
      ],
    }));
    expect(html).toContain("查看差旅制度的引用 1原文");
    expect(html).toContain("查看差旅制度的引用 2原文");
    expect(html.match(/aria-current="true"/g)).toHaveLength(1);
    expect(html).not.toContain("总页数");
  });
});
