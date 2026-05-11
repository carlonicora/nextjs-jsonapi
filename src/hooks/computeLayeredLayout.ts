import * as dagre from "dagre";
import { D3Link, D3Node } from "../interfaces";

export type LayeredRankDir = "LR" | "RL" | "TB" | "BT";

export interface LayeredLayoutOptions {
  rankdir?: LayeredRankDir;
  nodesep?: number;
  ranksep?: number;
  minNodeWidth: number;
  minNodeHeight: number;
}

export interface LayeredLayoutPosition {
  x: number;
  y: number;
}

const DEFAULT_RANKDIR: LayeredRankDir = "LR";
const DEFAULT_NODESEP = 50;
const DEFAULT_RANKSEP = 120;

const TITLE_PX_PER_CHAR_16 = 8;
const NAME_PX_PER_CHAR_12 = 6.5;
const NAME_PX_PER_CHAR_16_BOLD = 8;
const SUBTITLE_PX_PER_CHAR_11 = 6;
const LABEL_PADDING_PX = 16;

function estimateLabelWidth(node: D3Node): number {
  if (node.subtitle) {
    const titleWidth = (node.name?.length ?? 0) * TITLE_PX_PER_CHAR_16;
    const subtitleWidth = node.subtitle.length * SUBTITLE_PX_PER_CHAR_11;
    return Math.max(titleWidth, subtitleWidth) + LABEL_PADDING_PX;
  }
  const perChar = node.bold ? NAME_PX_PER_CHAR_16_BOLD : NAME_PX_PER_CHAR_12;
  return (node.name?.length ?? 0) * perChar + LABEL_PADDING_PX;
}

function linkEndpointId(end: D3Link["source"] | D3Link["target"]): string {
  return typeof end === "string" ? end : end.id;
}

/**
 * Compute a layered DAG layout using dagre. Pure function: no DOM, no React,
 * no d3 globals. Returns a Map of node.id -> { x, y } in graph coordinates.
 *
 * Returns null if dagre.layout throws (e.g. an unexpected cycle). Callers
 * should fall back to their previous layout in that case.
 */
export function computeLayeredLayout(
  nodes: D3Node[],
  links: D3Link[],
  opts: LayeredLayoutOptions,
): Map<string, LayeredLayoutPosition> | null {
  if (nodes.length === 0) return new Map();

  const rankdir = opts.rankdir ?? DEFAULT_RANKDIR;
  const nodesep = opts.nodesep ?? DEFAULT_NODESEP;
  const ranksep = opts.ranksep ?? DEFAULT_RANKSEP;

  const g = new dagre.graphlib.Graph({ directed: true });
  g.setGraph({ rankdir, nodesep, ranksep, marginx: 20, marginy: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    const width = Math.max(opts.minNodeWidth, estimateLabelWidth(node));
    const height = opts.minNodeHeight;
    g.setNode(node.id, { width, height });
  }

  const seen = new Set<string>();
  for (const link of links) {
    const sourceId = linkEndpointId(link.source);
    const targetId = linkEndpointId(link.target);
    if (!g.hasNode(sourceId) || !g.hasNode(targetId)) continue;
    const key = `${sourceId}->${targetId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    g.setEdge(sourceId, targetId);
  }

  try {
    dagre.layout(g);
  } catch {
    return null;
  }

  const positions = new Map<string, LayeredLayoutPosition>();
  for (const node of nodes) {
    const laid = g.node(node.id);
    if (laid && Number.isFinite(laid.x) && Number.isFinite(laid.y)) {
      positions.set(node.id, { x: laid.x, y: laid.y });
    }
  }
  return positions;
}
