import { describe, expect, it } from "vitest";
import { autoLayout, LayoutEdge, LayoutNode } from "../autoLayout";

describe("autoLayout", () => {
  it("returns a position for every node", () => {
    const nodes: LayoutNode[] = [
      { id: "a", width: 200, height: 120, manuallyPositioned: false },
      { id: "b", width: 200, height: 120, manuallyPositioned: false },
    ];
    const edges: LayoutEdge[] = [{ source: "a", target: "b" }];
    const result = autoLayout(nodes, edges);
    expect(Object.keys(result).sort()).toEqual(["a", "b"]);
    expect(typeof result.a.x).toBe("number");
    expect(typeof result.b.x).toBe("number");
  });

  it("respects manuallyPositioned: keeps pinned x/y verbatim", () => {
    const nodes: LayoutNode[] = [
      { id: "a", width: 200, height: 120, manuallyPositioned: true, x: 999, y: 888 },
      { id: "b", width: 200, height: 120, manuallyPositioned: false },
    ];
    const edges: LayoutEdge[] = [{ source: "a", target: "b" }];
    const result = autoLayout(nodes, edges);
    expect(result.a).toEqual({ x: 999, y: 888 });
    expect(result.b).not.toEqual({ x: 999, y: 888 });
  });

  it("is deterministic on identical input", () => {
    const nodes: LayoutNode[] = [
      { id: "a", width: 200, height: 120, manuallyPositioned: false },
      { id: "b", width: 200, height: 120, manuallyPositioned: false },
      { id: "c", width: 200, height: 120, manuallyPositioned: false },
    ];
    const edges: LayoutEdge[] = [
      { source: "a", target: "b" },
      { source: "b", target: "c" },
    ];
    const r1 = autoLayout(nodes, edges);
    const r2 = autoLayout(nodes, edges);
    expect(r1).toEqual(r2);
  });
});
