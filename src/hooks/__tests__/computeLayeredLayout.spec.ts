import { describe, expect, it } from "vitest";
import { computeLayeredLayout } from "../computeLayeredLayout";
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
