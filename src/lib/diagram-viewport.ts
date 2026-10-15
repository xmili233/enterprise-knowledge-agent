export type DiagramCamera = { x: number; y: number; scale: number };

export function fitDiagram(width: number, height: number, diagramWidth: number, diagramHeight: number): DiagramCamera {
  const scale = Math.min(Math.max(1, width - 40) / diagramWidth, Math.max(1, height - 40) / diagramHeight, 2);
  return { scale, x: (width - diagramWidth * scale) / 2, y: (height - diagramHeight * scale) / 2 };
}

export function zoomDiagram(camera: DiagramCamera, scale: number, x: number, y: number): DiagramCamera {
  const nextScale = Math.min(4, Math.max(0.05, scale));
  const ratio = nextScale / camera.scale;
  return { scale: nextScale, x: x - (x - camera.x) * ratio, y: y - (y - camera.y) * ratio };
}
