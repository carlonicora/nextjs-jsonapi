import { describe, expect, it } from "vitest";
import { RootSync } from "../RootSync";

describe("RootSync", () => {
  it("rehydrate parses serverTime, lockedFrom and every entries[].updatedAt with new Date", () => {
    const sync = new RootSync().rehydrate({
      jsonApi: {
        type: "root-syncs",
        id: "c1",
        attributes: {
          serverTime: "2026-11-01T10:00:00.000Z",
          locked: false,
          lockedFrom: "2026-11-20T00:00:00.000Z",
          entries: [
            { type: "npcs", id: "n1", updatedAt: "2026-10-30T08:00:00.000Z" },
            { type: "scenes", id: "s1", updatedAt: "2026-10-31T09:30:00.000Z" },
          ],
          links: [
            { fromType: "npcs", fromId: "n1", toType: "scenes", toId: "s1", kind: "APPEARS_IN", props: { x: 1 } },
          ],
        },
      },
      included: [],
    } as any);

    expect(sync.id).toBe("c1");
    expect(sync.serverTime).toBeInstanceOf(Date);
    expect(sync.serverTime.toISOString()).toBe("2026-11-01T10:00:00.000Z");
    expect(sync.locked).toBe(false);
    expect(sync.lockedFrom).toBeInstanceOf(Date);
    expect(sync.lockedFrom?.toISOString()).toBe("2026-11-20T00:00:00.000Z");
    expect(sync.entries.map((e) => e.updatedAt)).toEqual([
      new Date("2026-10-30T08:00:00.000Z"),
      new Date("2026-10-31T09:30:00.000Z"),
    ]);
    expect(sync.entries.every((e) => e.updatedAt instanceof Date)).toBe(true);
    expect(sync.links).toEqual([
      { fromType: "npcs", fromId: "n1", toType: "scenes", toId: "s1", kind: "APPEARS_IN", props: { x: 1 } },
    ]);
  });

  it("a null lockedFrom rehydrates as undefined", () => {
    const sync = new RootSync().rehydrate({
      jsonApi: {
        type: "root-syncs",
        id: "c1",
        attributes: { serverTime: "2026-11-01T10:00:00.000Z", locked: true, lockedFrom: null, entries: [], links: [] },
      },
      included: [],
    } as any);
    expect(sync.locked).toBe(true);
    expect(sync.lockedFrom).toBeUndefined();
  });
});
