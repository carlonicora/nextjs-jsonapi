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

export interface FitLayeredLayoutOptions extends LayeredLayoutOptions {
  targetAspectRatio: number;
  maxIterations?: number;
  tolerance?: number;
}

const DEFAULT_RANKDIR: LayeredRankDir = "LR";
const DEFAULT_NODESEP = 50;
const DEFAULT_RANKSEP = 120;

const MIN_NODESEP = 20;
const MAX_NODESEP = 400;
const MIN_RANKSEP = 40;
const MAX_RANKSEP = 600;
const MIN_FACTOR = 0.25;
const MAX_FACTOR = 4;
const DEFAULT_TOLERANCE = 0.05;
const DEFAULT_MAX_ITERATIONS = 4;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

interface DagreRunResult {
  positions: Map<string, LayeredLayoutPosition>;
  bbox: { width: number; height: number };
}

/**
 * Run dagre once for the given nodes/links/opts and return both the
 * computed positions and the bounding box of the laid-out graph.
 * Internal helper — callers should use `computeLayeredLayout` or
 * `fitLayeredLayoutToAspectRatio`.
 */
function runDagreOnce(nodes: D3Node[], links: D3Link[], opts: LayeredLayoutOptions): DagreRunResult | null {
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
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const node of nodes) {
    const laid = g.node(node.id);
    if (laid && Number.isFinite(laid.x) && Number.isFinite(laid.y)) {
      positions.set(node.id, { x: laid.x, y: laid.y });
      const halfW = (laid.width ?? opts.minNodeWidth) / 2;
      const halfH = (laid.height ?? opts.minNodeHeight) / 2;
      xMin = Math.min(xMin, laid.x - halfW);
      xMax = Math.max(xMax, laid.x + halfW);
      yMin = Math.min(yMin, laid.y - halfH);
      yMax = Math.max(yMax, laid.y + halfH);
    }
  }

  const bbox =
    positions.size === 0
      ? { width: 0, height: 0 }
      : { width: Math.max(0, xMax - xMin), height: Math.max(0, yMax - yMin) };

  return { positions, bbox };
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
  const result = runDagreOnce(nodes, links, opts);
  return result ? result.positions : null;
}

/**
 * Compute a layered layout, then iteratively re-run dagre with adjusted
 * `nodesep`/`ranksep` until the bounding-box aspect ratio is within
 * `tolerance` of `targetAspectRatio` (or `maxIterations` is reached).
 *
 * Degenerate cases (empty graph, single-rank graph where one axis has
 * zero extent, missing target ratio) skip fitting and return the
 * single-pass result.
 */
export function fitLayeredLayoutToAspectRatio(
  nodes: D3Node[],
  links: D3Link[],
  opts: FitLayeredLayoutOptions,
): Map<string, LayeredLayoutPosition> | null {
  if (nodes.length === 0) return new Map();
  if (!Number.isFinite(opts.targetAspectRatio) || opts.targetAspectRatio <= 0) {
    return computeLayeredLayout(nodes, links, opts);
  }

  const maxIterations = opts.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const tolerance = opts.tolerance ?? DEFAULT_TOLERANCE;
  const rankdir = opts.rankdir ?? DEFAULT_RANKDIR;
  const isHorizontalFlow = rankdir === "LR" || rankdir === "RL";

  let nodesep = opts.nodesep ?? DEFAULT_NODESEP;
  let ranksep = opts.ranksep ?? DEFAULT_RANKSEP;

  let best: DagreRunResult | null = null;

  for (let i = 0; i < maxIterations; i++) {
    const result = runDagreOnce(nodes, links, {
      ...opts,
      nodesep,
      ranksep,
    });
    if (!result) return best ? best.positions : null;
    best = result;

    if (result.positions.size <= 1) return result.positions;

    const { width, height } = result.bbox;
    if (width === 0 || height === 0) return result.positions;

    const currentAspect = width / height;
    const ratio = opts.targetAspectRatio / currentAspect;

    if (Math.abs(ratio - 1) < tolerance) return result.positions;

    const factor = clamp(Math.sqrt(ratio), MIN_FACTOR, MAX_FACTOR);

    if (isHorizontalFlow) {
      ranksep = clamp(ranksep * factor, MIN_RANKSEP, MAX_RANKSEP);
      nodesep = clamp(nodesep / factor, MIN_NODESEP, MAX_NODESEP);
    } else {
      ranksep = clamp(ranksep / factor, MIN_RANKSEP, MAX_RANKSEP);
      nodesep = clamp(nodesep * factor, MIN_NODESEP, MAX_NODESEP);
    }
  }

  return best ? best.positions : null;
}
