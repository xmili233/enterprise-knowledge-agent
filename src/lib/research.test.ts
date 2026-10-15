import { describe, expect, it } from "vitest";
import { documents, resolvePassage } from "../data/knowledge";
import {
  EVIDENCE_CUTOFF,
  guidedQuestions,
  planResearch,
  sampleQuestions,
} from "./research";

const plans = [
  ...sampleQuestions,
  "我还剩几天年假？",
  "今天会议室有空闲吗？",
  "公司明年准备上市吗？",
].map((question) => [question, planResearch(question)] as const);

describe("模拟查找的证据契约", () => {
  it.each(plans)("检索命中和候选段落都对应实际资料：%s", (_question, plan) => {
    for (const step of plan.steps) {
      if (step.kind === "search")
        for (const id of step.hits)
          expect(documents.some((doc) => doc.id === id)).toBe(true);
      if (step.kind === "evidence")
        for (const candidate of step.candidates) {
          expect(resolvePassage(candidate.ref)).toBeDefined();
          expect(candidate.score).toBeGreaterThanOrEqual(0);
          expect(candidate.score).toBeLessThanOrEqual(10);
        }
    }
  });

  it.each(plans)("每处引用都原样出自段落原文：%s", (_question, plan) => {
    for (const citation of plan.citations)
      expect(resolvePassage(citation.ref)?.passage.text).toContain(
        citation.quote,
      );
  });

  it.each(plans)("回答只引用通过阈值的证据：%s", (_question, plan) => {
    const kept = new Set(
      plan.steps.flatMap((step) =>
        step.kind === "evidence"
          ? step.candidates
              .filter((candidate) => candidate.score >= EVIDENCE_CUTOFF)
              .map((candidate) => candidate.ref)
          : [],
      ),
    );
    for (const citation of plan.citations) expect(kept).toContain(citation.ref);
  });

  it.each(plans)("引用编号与引用列表一一对应：%s", (_question, plan) => {
    const markers = [...plan.answer.matchAll(/\[\[(\d+)\]\]/g)].map((match) =>
      Number(match[1]),
    );
    expect(new Set(markers)).toEqual(
      new Set(plan.citations.map((_, index) => index + 1)),
    );
  });

  it("改签回答经过补查，并保留公务、个人原因和书面确认", () => {
    const plan = planResearch("出差改签费可以报销吗？");
    expect(plan.outcome).toBe("grounded");
    expect(plan.steps.filter((step) => step.kind === "search")).toHaveLength(2);
    expect(plan.citations.map((citation) => citation.ref)).toEqual(
      expect.arrayContaining([
        "travel-policy:business-change",
        "travel-policy:personal-change",
        "travel-policy:evidence",
      ]),
    );
    expect(plan.answer).toContain("书面确认");
  });

  it.each(guidedQuestions)("引导演示的每一步都能找到依据：%s", (question) => {
    const plan = planResearch(question);
    expect(plan.outcome).toBe("grounded");
    expect(plan.citations.length).toBeGreaterThan(0);
  });

  it("引导演示的三个问题对应不同场景", () => {
    const answers = new Set(guidedQuestions.map((q) => planResearch(q).answer));
    expect(answers.size).toBe(guidedQuestions.length);
  });

  it("个人年假余额不能由制度推断", () => {
    expect(planResearch("我还剩几天年假？").outcome).toBe("insufficient");
  });

  it("静态使用说明不回答实时会议室空闲问题", () => {
    expect(planResearch("今天会议室有空闲吗？").outcome).toBe("insufficient");
  });

  it("未覆盖的问题没有虚构证据", () => {
    const plan = planResearch("公司明年准备上市吗？");
    expect(plan.outcome).toBe("insufficient");
    expect(plan.citations).toEqual([]);
    expect(
      plan.steps.every(
        (step) =>
          step.kind !== "evidence" ||
          step.candidates.every((item) => item.score < EVIDENCE_CUTOFF),
      ),
    ).toBe(true);
  });
});
