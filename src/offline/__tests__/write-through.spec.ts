import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceStore } from "../store/DeviceStore";
import { artwork, fakeCacheStorage, npc, setUpSync, tearDownSync } from "../sync/__tests__/sync-fixtures";
import { markOfflineUnavailable, OfflineUnavailableError } from "../config";
import { writeThrough } from "../write-through";

const ok = (data: any) => ({ ok: true, status: 200, statusText: "OK", data });

describe("writeThrough", () => {
  let store: DeviceStore;
  let cache: ReturnType<typeof fakeCacheStorage>;

  beforeEach(async () => {
    store = await setUpSync();
    // The device keeps root record C (its root record is stored).
    await store.putRecord({
      type: "roots",
      id: "C",
      rootId: "C",
      resource: { type: "roots", id: "C", attributes: { name: "C" } },
      updatedAt: null,
    });
    cache = fakeCacheStorage(["wyrdli-offline-1", "wyrdli-images"]);
    vi.stubGlobal("caches", cache.storage);
  });

  afterEach(() => {
    tearDownSync();
    vi.unstubAllGlobals();
  });

  it("stores the answer of an online write", async () => {
    await writeThrough({ method: "PATCH", url: "http://api.test/npcs/n1" }, ok({ data: npc("n1", "Saved") }));

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Saved");
  });

  it("in a browser that cannot keep the device copy, stores nothing and logs nothing per request", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    markOfflineUnavailable(new OfflineUnavailableError("the browser offers no private file storage"));
    warn.mockClear();

    await writeThrough({ method: "PATCH", url: "http://api.test/npcs/n1" }, ok({ data: npc("n1", "Saved") }));

    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it("stores nothing for a write in a root record the device does not keep (a player's root record)", async () => {
    await writeThrough(
      { method: "PATCH", url: "http://api.test/npcs/p1" },
      ok({ data: npc("p1", "Player's", "P"), included: [npc("p2", "Other", "P")] }),
    );
    await writeThrough(
      { method: "POST", url: "http://api.test/roots/P/npcs" },
      ok({ data: { type: "npcs", id: "p3", attributes: { name: "No relationship" } } }),
    );

    expect(await store.getRecord("npcs", "p1")).toBeUndefined();
    expect(await store.getRecord("npcs", "p2")).toBeUndefined();
    expect(await store.getRecord("npcs", "p3")).toBeUndefined();
    expect(await store.linksFrom("p1")).toEqual([]);
  });

  it("never overwrites a record that has a waiting change (a queue entry targets it) or a base", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "Mine"), updatedAt: null });
    await store.enqueue({
      rootId: "C",
      method: "POST",
      path: "npcs",
      body: { data: npc("n1", "Mine") },
      base: null,
    });
    await store.putRecord({
      type: "npcs",
      id: "n2",
      rootId: "C",
      resource: npc("n2", "Mine"),
      updatedAt: null,
      base: npc("n2", "Base"),
    });

    await writeThrough(
      { method: "PATCH", url: "http://api.test/npcs/n1" },
      ok({ data: npc("n1", "Server"), included: [npc("n2", "Server")] }),
    );

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Mine");
    expect((await store.getRecord("npcs", "n2"))?.resource.attributes.name).toBe("Mine");
  });

  it("updates the links of the written record from the answer's relationships", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "A"), updatedAt: null });
    await store.putLink({ fromType: "npcs", fromId: "n1", toType: "npcs", toId: "old", kind: "friends", props: {} });

    await writeThrough(
      { method: "PATCH", url: "http://api.test/npcs/n1" },
      ok({
        data: {
          ...npc("n1", "A"),
          relationships: {
            root: { data: { type: "roots", id: "C" } },
            friends: { data: [{ type: "npcs", id: "new" }] },
            portrait: { data: { type: "artworks", id: "a1" } },
          },
        },
      }),
    );

    const links = (await store.linksFrom("n1")).map((link) => `${link.kind}:${link.toId}`).sort();
    expect(links).toEqual(["friends:new", "portrait:a1", "root:C"]);
  });

  it("removes the old cached image when an online write changes an artwork's image URL", async () => {
    const images = cache.caches.get("wyrdli-images")!;
    images.set("http://api.test/artworks/a1/image?v=1", {});
    await store.putRecord({
      type: "artworks",
      id: "a1",
      rootId: "C",
      resource: artwork("a1", "http://api.test/artworks/a1/image?v=1"),
      updatedAt: null,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 })),
    );

    await writeThrough(
      { method: "PATCH", url: "http://api.test/artworks/a1" },
      ok({ data: artwork("a1", "http://api.test/artworks/a1/image?v=2") }),
    );

    expect(images.has("http://api.test/artworks/a1/image?v=1")).toBe(false);
  });
});
