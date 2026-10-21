import { describe, expect, it } from "vitest";
import { buildCanvasGraph, CanvasStep } from "../buildCanvasGraph";

const step = (id: string, overrides: Partial<CanvasStep> = {}): CanvasStep => ({
  id,
  subject: `Subject ${id}`,
  delayHours: 24,
  sentCount: 0,
  ...overrides,
});

describe("buildCanvasGraph", () => {
  const steps: CanvasStep[] = [
    step("a", { next: { id: "b" }, delayHours: 0 }),
    step("b", { next: { id: "c" }, delayHours: 24 }),
    step("c", { delayHours: 48 }),
    step("d", { delayHours: 12 }),
  ];

  it("builds the trigger node plus one node per step", () => {
    const { nodes } = buildCanvasGraph(steps, "Waitlist confirmed");
    expect(nodes.map((n) => n.id)).toEqual(["trigger", "step:a", "step:b", "step:c", "step:d"]);
    expect(nodes[0].type).toBe("triggerNode");
    expect((nodes[0].data as { data: { label: string } }).data.label).toBe("Waitlist confirmed");
    expect(nodes.slice(1).every((n) => n.type === "emailStepNode")).toBe(true);
  });

  it("draws trigger→head and one delay edge per NEXT link", () => {
    const { edges } = buildCanvasGraph(steps, "Waitlist confirmed");
    expect(edges.map((e) => [e.source, e.target])).toEqual([
      ["trigger", "step:a"],
      ["step:a", "step:b"],
      ["step:b", "step:c"],
    ]);
    expect(edges.every((e) => e.type === "delayEdge")).toBe(true);
    expect(edges.map((e) => (e.data as { targetStepId: string }).targetStepId)).toEqual(["a", "b", "c"]);
    expect(edges.map((e) => e.label)).toEqual(["0h", "24h", "48h"]);
  });

  it("marks steps outside the chain as orphans", () => {
    const { nodes, orphanIds } = buildCanvasGraph(steps, "Waitlist confirmed");
    expect(orphanIds).toEqual(["d"]);
    const orphanFlag = (id: string) =>
      (nodes.find((n) => n.id === `step:${id}`)?.data as { data: { orphan: boolean } }).data.orphan;
    expect(orphanFlag("d")).toBe(true);
    expect(orphanFlag("a")).toBe(false);
  });

  it("keeps stored positions and lays out the rest with dagre", () => {
    const positioned = [step("a", { next: { id: "b" }, positionX: 500, positionY: 300 }), step("b")];
    const { nodes } = buildCanvasGraph(positioned, "Waitlist confirmed");
    const a = nodes.find((n) => n.id === "step:a")!;
    const b = nodes.find((n) => n.id === "step:b")!;
    expect(a.position).toEqual({ x: 500, y: 300 });
    expect((a.data as { data: { manuallyPositioned: boolean } }).data.manuallyPositioned).toBe(true);
    expect((b.data as { data: { manuallyPositioned: boolean } }).data.manuallyPositioned).toBe(false);
    expect(typeof b.position.x).toBe("number");
    expect(typeof b.position.y).toBe("number");
  });

  it("returns the trigger node alone and no edges when there are no steps", () => {
    const { nodes, edges, orphanIds } = buildCanvasGraph([], "No trigger");
    expect(nodes.map((n) => n.id)).toEqual(["trigger"]);
    expect(edges).toEqual([]);
    expect(orphanIds).toEqual([]);
  });
});
