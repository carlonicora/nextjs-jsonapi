import { Tab } from "./TabsContainer";

export type PartitionedTabs = {
  ungrouped: Tab[];
  groups: Array<{ label: string; items: Tab[] }>;
};

/**
 * Split a `Tab[]` into ungrouped + grouped strata for the
 * `RoundPageContainer` `layout="rail"` navigation.
 *
 * Tabs without a `group` land in `ungrouped` (the pinned stratum) in declared
 * order. Grouped tabs cluster under their `group` label; groups appear in the
 * order they first occur in the input array.
 *
 * Pure function — safe to call on every render. Complexity O(n).
 */
export function partitionTabs(tabs: Tab[]): PartitionedTabs {
  const ungrouped: Tab[] = [];
  const groupMap = new Map<string, Tab[]>();
  const groupOrder: string[] = [];

  for (const tab of tabs) {
    if (!tab.group) {
      ungrouped.push(tab);
      continue;
    }
    if (!groupMap.has(tab.group)) {
      groupMap.set(tab.group, []);
      groupOrder.push(tab.group);
    }
    // The map entry is guaranteed to exist because we just initialized it.
    groupMap.get(tab.group)!.push(tab);
  }

  return {
    ungrouped,
    groups: groupOrder.map((label) => ({
      label,
      items: groupMap.get(label)!,
    })),
  };
}
