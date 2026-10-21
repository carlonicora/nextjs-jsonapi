import dagre from "dagre";

export type LayoutNode = {
  id: string;
  /** node body dimensions in canvas px — used by dagre to allocate space */
  width: number;
  height: number;
  /** if true, dagre leaves position alone and uses these (x, y) verbatim */
  manuallyPositioned: boolean;
  x?: number;
  y?: number;
};

export type LayoutEdge = {
  source: string;
  target: string;
};

export type LayoutResult = Record<string, { x: number; y: number }>;

/**
 * Deterministic LR layout. Pinned nodes keep their (x, y). Unpinned nodes
 * are laid out by dagre and returned in the result map.
 */
export function autoLayout(nodes: LayoutNode[], edges: LayoutEdge[]): LayoutResult {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 60, ranksep: 100, marginx: 24, marginy: 24 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const n of nodes) {
    g.setNode(n.id, { width: n.width, height: n.height });
  }
  for (const e of edges) {
    if (g.hasNode(e.source) && g.hasNode(e.target)) {
      g.setEdge(e.source, e.target);
    }
  }

  dagre.layout(g);

  const result: LayoutResult = {};
  for (const n of nodes) {
    if (n.manuallyPositioned && typeof n.x === "number" && typeof n.y === "number") {
      result[n.id] = { x: n.x, y: n.y };
    } else {
      const laid = g.node(n.id);
      // dagre returns center coords; React Flow expects top-left, so subtract half dims.
      result[n.id] = {
        x: laid.x - n.width / 2,
        y: laid.y - n.height / 2,
      };
    }
  }
  return result;
}
