import { describe, expect, it } from "vitest";
import { fitDiagram, zoomDiagram } from "./diagram-viewport";

describe("流程图画布", () => {
  it.each([[360, 600, 1240, 1400], [2200, 1200, 1240, 1400], [940, 600, 440, 1100]])(
    "在 %i × %i 的画布完整显示 %i × %i 的图",
    (width, height, diagramWidth, diagramHeight) => {
      const view = fitDiagram(width, height, diagramWidth, diagramHeight);
      expect(view.x).toBeGreaterThanOrEqual(0);
      expect(view.y).toBeGreaterThanOrEqual(0);
      expect(view.x + diagramWidth * view.scale).toBeLessThanOrEqual(width);
      expect(view.y + diagramHeight * view.scale).toBeLessThanOrEqual(height);
    },
  );

  it("缩放时鼠标指向的图中位置保持不变", () => {
    const camera = { x: -80, y: 50, scale: 0.5 };
    const next = zoomDiagram(camera, 1.25, 300, 220);
    expect((300 - next.x) / next.scale).toBeCloseTo((300 - camera.x) / camera.scale);
    expect((220 - next.y) / next.scale).toBeCloseTo((220 - camera.y) / camera.scale);
  });

  it("限制缩放范围，恢复原始比例时保持画布中心", () => {
    const camera = fitDiagram(1200, 800, 600, 1000);
    expect(zoomDiagram(camera, 100, 600, 400).scale).toBe(4);
    expect(zoomDiagram(camera, 0, 600, 400).scale).toBe(0.05);
    const actualSize = zoomDiagram(camera, 1, 600, 400);
    expect(actualSize.x + 300).toBeCloseTo(600);
    expect(actualSize.y + 500).toBeCloseTo(400);
  });
});
