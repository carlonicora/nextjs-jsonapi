import { describe, expect, it } from "vitest";
import { computeLayeredLayout, fitLayeredLayoutToAspectRatio } from "../computeLayeredLayout";
import type { D3Link, D3Node } from "../../interfaces";

function makeNode(id: string, name = id, extra: Partial<D3Node> = {}): D3Node {
  return { id, name, instanceType: "test", ...extra };
}

function makeLink(source: string, target: string): D3Link {
  return { source, target } as D3Link;
}

const MIN_WIDTH = 80;
const MIN_HEIGHT = 80;

describe("computeLayeredLayout", () => {
  it("returns an empty map for an empty graph", () => {
    const result = computeLayeredLayout([], [], {
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    expect(result!.size).toBe(0);
  });

  it("places a single isolated node at a finite coordinate", () => {
    const nodes = [makeNode("a")];
    const result = computeLayeredLayout(nodes, [], {
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    const pos = result!.get("a");
    expect(pos).toBeDefined();
    expect(Number.isFinite(pos!.x)).toBe(true);
    expect(Number.isFinite(pos!.y)).toBe(true);
  });

  it("orders a linear chain left-to-right when rankdir=LR", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const links = [makeLink("a", "b"), makeLink("b", "c")];
    const result = computeLayeredLayout(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    const a = result!.get("a")!;
    const b = result!.get("b")!;
    const c = result!.get("c")!;
    expect(a.x).toBeLessThan(b.x);
    expect(b.x).toBeLessThan(c.x);
  });

  it("orders a linear chain top-to-bottom when rankdir=TB", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const links = [makeLink("a", "b"), makeLink("b", "c")];
    const result = computeLayeredLayout(nodes, links, {
      rankdir: "TB",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    const a = result!.get("a")!;
    const b = result!.get("b")!;
    const c = result!.get("c")!;
    expect(a.y).toBeLessThan(b.y);
    expect(b.y).toBeLessThan(c.y);
  });

  it("places siblings on the same rank but separated", () => {
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const links = [makeLink("a", "b"), makeLink("a", "c")];
    const result = computeLayeredLayout(nodes, links, {
      rankdir: "LR",
      nodesep: 50,
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    const a = result!.get("a")!;
    const b = result!.get("b")!;
    const c = result!.get("c")!;
    expect(b.x).toBeGreaterThan(a.x);
    expect(c.x).toBeGreaterThan(a.x);
    expect(Math.abs(b.x - c.x)).toBeLessThan(5);
    expect(Math.abs(b.y - c.y)).toBeGreaterThanOrEqual(50);
  });

  it("uses label width to widen ranks for long names", () => {
    const nodes = [makeNode("a", "x"), makeNode("b", "x".repeat(50))];
    const links = [makeLink("a", "b")];
    const narrow = computeLayeredLayout(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    const wider = computeLayeredLayout(
      [makeNode("a", "x".repeat(50)), makeNode("b", "x".repeat(50))],
      [makeLink("a", "b")],
      {
        rankdir: "LR",
        minNodeWidth: MIN_WIDTH,
        minNodeHeight: MIN_HEIGHT,
      },
    );
    const narrowGap = narrow!.get("b")!.x - narrow!.get("a")!.x;
    const widerGap = wider!.get("b")!.x - wider!.get("a")!.x;
    expect(widerGap).toBeGreaterThan(narrowGap);
  });

  it("handles a scene-shaped graph (scene chain + location branches)", () => {
    const nodes = [
      makeNode("s1", "Scene 1", { instanceType: "scenes" }),
      makeNode("s2", "Scene 2", { instanceType: "scenes" }),
      makeNode("s3", "Scene 3", { instanceType: "scenes" }),
      makeNode("loc1", "Loc 1", { instanceType: "locations" }),
      makeNode("loc2", "Loc 2", { instanceType: "locations" }),
      makeNode("loc3", "Loc 3", { instanceType: "locations" }),
    ];
    const links = [
      makeLink("s1", "s2"),
      makeLink("s2", "s3"),
      makeLink("s1", "loc1"),
      makeLink("s2", "loc2"),
      makeLink("s3", "loc3"),
    ];
    const result = computeLayeredLayout(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    expect(result!.size).toBe(6);
    expect(result!.get("s1")!.x).toBeLessThan(result!.get("s2")!.x);
    expect(result!.get("s2")!.x).toBeLessThan(result!.get("s3")!.x);
    expect(result!.get("loc1")!.x).toBeGreaterThan(result!.get("s1")!.x);
    expect(result!.get("loc2")!.x).toBeGreaterThan(result!.get("s2")!.x);
    expect(result!.get("loc3")!.x).toBeGreaterThan(result!.get("s3")!.x);
  });

  it("ignores links to/from unknown nodes", () => {
    const nodes = [makeNode("a"), makeNode("b")];
    const links = [makeLink("a", "b"), makeLink("a", "ghost"), makeLink("ghost", "b")];
    const result = computeLayeredLayout(nodes, links, {
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    expect(result).not.toBeNull();
    expect(result!.size).toBe(2);
  });
});

function boundingBoxAspect(positions: Map<string, { x: number; y: number }>): number {
  if (positions.size <= 1) return NaN;
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  positions.forEach((p) => {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  });
  const w = xMax - xMin;
  const h = yMax - yMin;
  if (h === 0) return Infinity;
  return w / h;
}

describe("fitLayeredLayoutToAspectRatio", () => {
  it("returns an empty map for an empty graph", () => {
    const result = fitLayeredLayoutToAspectRatio([], [], {
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 1.5,
    });
    expect(result).not.toBeNull();
    expect(result!.size).toBe(0);
  });

  it("returns a single node at finite coords without crashing", () => {
    const result = fitLayeredLayoutToAspectRatio([makeNode("a")], [], {
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 1.5,
    });
    expect(result).not.toBeNull();
    const pos = result!.get("a")!;
    expect(Number.isFinite(pos.x)).toBe(true);
    expect(Number.isFinite(pos.y)).toBe(true);
  });

  it("nudges aspect ratio toward a wider target than single-pass", () => {
    // A branchy DAG with vertical structure under TB: a -> b1,b2,b3,b4,b5
    // Single-pass TB makes this tall (5 siblings stacked vertically below a).
    const nodes = [makeNode("a"), makeNode("b1"), makeNode("b2"), makeNode("b3"), makeNode("b4"), makeNode("b5")];
    const links = [
      makeLink("a", "b1"),
      makeLink("a", "b2"),
      makeLink("a", "b3"),
      makeLink("a", "b4"),
      makeLink("a", "b5"),
    ];
    const baseline = computeLayeredLayout(nodes, links, {
      rankdir: "TB",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    const fitted = fitLayeredLayoutToAspectRatio(nodes, links, {
      rankdir: "TB",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 4.0,
    });
    expect(baseline).not.toBeNull();
    expect(fitted).not.toBeNull();
    const baseAspect = boundingBoxAspect(baseline!);
    const fitAspect = boundingBoxAspect(fitted!);
    expect(Math.abs(fitAspect - 4.0)).toBeLessThan(Math.abs(baseAspect - 4.0));
  });

  it("nudges aspect ratio toward a narrower target than single-pass", () => {
    // A wide LR chain (single rank deep, multi-rank wide); single-pass is
    // very wide. Target 0.5 (taller than wide) should reduce ranksep and
    // increase nodesep — though with no siblings the height grows slowly.
    // We use a graph with one branching point to give the fitter vertical
    // structure to expand into.
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c"), makeNode("d"), makeNode("e")];
    const links = [makeLink("a", "b"), makeLink("a", "c"), makeLink("b", "d"), makeLink("c", "e")];
    const baseline = computeLayeredLayout(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
    });
    const fitted = fitLayeredLayoutToAspectRatio(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 0.6,
    });
    expect(baseline).not.toBeNull();
    expect(fitted).not.toBeNull();
    const baseAspect = boundingBoxAspect(baseline!);
    const fitAspect = boundingBoxAspect(fitted!);
    expect(Math.abs(fitAspect - 0.6)).toBeLessThan(Math.abs(baseAspect - 0.6));
  });

  it("skips fitting for single-rank graphs (zero height in LR)", () => {
    // Linear LR chain: all nodes on the same y (single rank tall),
    // bbox height collapses to 0 — fitter should return positions
    // unchanged from single-pass.
    const nodes = [makeNode("a"), makeNode("b"), makeNode("c")];
    const links = [makeLink("a", "b"), makeLink("b", "c")];
    const fitted = fitLayeredLayoutToAspectRatio(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 0.5,
    });
    expect(fitted).not.toBeNull();
    expect(fitted!.size).toBe(3);
  });

  it("treats invalid targetAspectRatio (zero or NaN) as a no-op fit", () => {
    const nodes = [makeNode("a"), makeNode("b")];
    const links = [makeLink("a", "b")];
    const zero = fitLayeredLayoutToAspectRatio(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: 0,
    });
    const nan = fitLayeredLayoutToAspectRatio(nodes, links, {
      rankdir: "LR",
      minNodeWidth: MIN_WIDTH,
      minNodeHeight: MIN_HEIGHT,
      targetAspectRatio: NaN,
    });
    expect(zero).not.toBeNull();
    expect(zero!.size).toBe(2);
    expect(nan).not.toBeNull();
    expect(nan!.size).toBe(2);
  });
});
