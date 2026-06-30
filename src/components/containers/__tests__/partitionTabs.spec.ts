import { describe, expect, it } from "vitest";
import { partitionTabs } from "../partitionTabs";
import type { Tab } from "../TabsContainer";

const tab = (label: string, group?: string): Tab => ({
  label,
  content: null,
  group,
});

describe("partitionTabs", () => {
  it("returns empty partition for empty input", () => {
    expect(partitionTabs([])).toEqual({ ungrouped: [], groups: [] });
  });

  it("keeps tabs without a group in the ungrouped stratum, in declared order", () => {
    const result = partitionTabs([tab("a"), tab("b"), tab("c")]);
    expect(result.ungrouped.map((t) => t.label)).toEqual(["a", "b", "c"]);
    expect(result.groups).toEqual([]);
  });

  it("clusters tabs by group label", () => {
    const result = partitionTabs([tab("a", "Casebook"), tab("b", "Casebook"), tab("c", "Work")]);
    expect(result.ungrouped).toEqual([]);
    expect(result.groups).toEqual([
      { label: "Casebook", items: [expect.objectContaining({ label: "a" }), expect.objectContaining({ label: "b" })] },
      { label: "Work", items: [expect.objectContaining({ label: "c" })] },
    ]);
  });

  it("renders groups in the order they first appear", () => {
    const result = partitionTabs([tab("a", "Work"), tab("b", "Casebook"), tab("c", "Work"), tab("d", "Casebook")]);
    expect(result.groups.map((g) => g.label)).toEqual(["Work", "Casebook"]);
    expect(result.groups[0].items.map((t) => t.label)).toEqual(["a", "c"]);
    expect(result.groups[1].items.map((t) => t.label)).toEqual(["b", "d"]);
  });

  it("preserves ungrouped tabs above grouped tabs regardless of array order", () => {
    const result = partitionTabs([tab("one", "Work"), tab("two"), tab("three", "Work"), tab("four")]);
    expect(result.ungrouped.map((t) => t.label)).toEqual(["two", "four"]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].items.map((t) => t.label)).toEqual(["one", "three"]);
  });

  it("treats an empty-string group as 'no group'", () => {
    const result = partitionTabs([tab("a", ""), tab("b", "Work")]);
    expect(result.ungrouped.map((t) => t.label)).toEqual(["a"]);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].label).toBe("Work");
  });
});
