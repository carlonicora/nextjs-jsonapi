import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DeviceStore } from "../../store/DeviceStore";
import { RootSync } from "../models/RootSync";
import {
  artwork,
  book,
  bookTypes,
  Books,
  fakeCacheStorage,
  npc,
  page,
  setUpSync,
  syncTestConfig,
  tearDownSync,
  TestModel,
} from "./sync-fixtures";

const { JsonApiGet } = vi.hoisted(() => ({ JsonApiGet: vi.fn() }));
vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet,
  JsonApiPost: vi.fn(),
  getApiUrl: () => "http://api.test/",
  buildUrl: (endpoint: string) => `http://api.test/${endpoint}`,
}));

import { SYNC_FETCH_CONCURRENCY, syncAll, syncRoot } from "../sync-root";
import { getOfflineState, subscribeOfflineState } from "../../state";

type Answer = { ok: boolean; response: number; raw?: any; data?: any };

const syncAnswer = (attributes: Record<string, unknown>, id = "C"): Answer => ({
  ok: true,
  response: 200,
  data: new RootSync().rehydrate({
    jsonApi: {
      type: "root-syncs",
      id,
      attributes: {
        serverTime: "2026-11-01T10:00:00.000Z",
        locked: false,
        lockedFrom: null,
        entries: [],
        links: [],
        ...attributes,
      },
    },
    included: [],
  } as any),
});

const listAnswer = (resources: any[]): Answer => ({ ok: true, response: 200, raw: { data: resources }, data: [] });
const oneAnswer = (resource: any): Answer => ({ ok: true, response: 200, raw: { data: resource }, data: {} });
const statusAnswer = (status: number): Answer => ({ ok: false, response: status, raw: undefined, data: [] });

/** Answers JsonApiGet by endpoint (query string included); unknown endpoints fail the test. */
function serve(routes: Record<string, Answer>) {
  JsonApiGet.mockImplementation(async (params: { endpoint: string }) => {
    const answer = routes[params.endpoint];
    if (!answer) throw new Error(`unexpected GET ${params.endpoint}`);
    return answer;
  });
}

const entry = (type: string, id: string, updatedAt = "2026-10-31T10:00:00.000Z") => ({ type, id, updatedAt });

describe("syncRoot", () => {
  let store: DeviceStore;
  let cache: ReturnType<typeof fakeCacheStorage>;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    store = await setUpSync();
    JsonApiGet.mockReset();
    cache = fakeCacheStorage();
    vi.stubGlobal("caches", cache.storage);
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) => ({ ok: true, status: 200, url, clone: () => ({ url }) }));
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    tearDownSync();
    vi.unstubAllGlobals();
  });

  it("deletes local records whose id is not in entries (unless localOnly with a pending queue entry)", async () => {
    await store.putRecord({
      type: "npcs",
      id: "gone",
      rootId: "C",
      resource: npc("gone", "Gone"),
      updatedAt: null,
    });
    await store.putRecord({
      type: "npcs",
      id: "kept",
      rootId: "C",
      resource: npc("kept", "Kept"),
      updatedAt: new Date("2026-10-31T10:00:00.000Z"),
    });
    await store.putRecord({
      type: "npcs",
      id: "new",
      rootId: "C",
      resource: npc("new", "New"),
      updatedAt: null,
      localOnly: true,
    });
    await store.enqueue({
      rootId: "C",
      method: "POST",
      path: "npcs",
      body: { data: npc("new", "New") },
      recordType: "npcs",
      recordId: "new",
      base: null,
    });
    await store.setSyncState("C", {
      serverTime: new Date("2026-11-01T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });

    serve({ "roots/C/sync": syncAnswer({ entries: [entry("npcs", "kept")] }) });

    await syncRoot("C");

    expect(await store.getRecord("npcs", "gone")).toBeUndefined();
    expect(await store.getRecord("npcs", "kept")).toBeDefined();
    expect(await store.getRecord("npcs", "new")).toBeDefined();
  });

  it("fetches root-list types with updatedSince = the stored serverTime, by-id types per changed entry; URLs from EndpointCreator", async () => {
    await store.setSyncState("C", {
      serverTime: new Date("2026-10-31T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });
    await store.putRecord({
      type: "npcs",
      id: "old",
      rootId: "C",
      resource: npc("old", "Old"),
      updatedAt: new Date("2026-10-20T00:00:00.000Z"),
    });
    await store.putRecord({
      type: "templates",
      id: "t-old",
      rootId: "C",
      resource: { type: "templates", id: "t-old", attributes: { name: "Old" } },
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    });

    serve({
      "roots/C/sync": syncAnswer({
        entries: [
          entry("roots", "C"),
          entry("npcs", "n1"),
          entry("npcs", "old", "2026-10-20T00:00:00.000Z"),
          entry("templates", "t1"),
          entry("templates", "t-old", "2026-10-01T00:00:00.000Z"),
        ],
      }),
      "roots/C": oneAnswer({ type: "roots", id: "C", attributes: { name: "Camp" } }),
      "roots/C/npcs?fetchAll=true&updatedSince=2026-10-31T00:00:00.000Z": listAnswer([npc("n1", "Alda")]),
      "templates/t1": oneAnswer({ type: "templates", id: "t1", attributes: { name: "T" } }),
    });

    await syncRoot("C");

    const endpoints = JsonApiGet.mock.calls.map((call) => call[0].endpoint);
    // The sync answer, then the root record; the other reads run concurrently, in any order.
    expect(endpoints.slice(0, 2)).toEqual(["roots/C/sync", "roots/C"]);
    expect([...endpoints.slice(2)].sort()).toEqual([
      "roots/C/npcs?fetchAll=true&updatedSince=2026-10-31T00:00:00.000Z",
      "templates/t1",
    ]);
    expect(JsonApiGet.mock.calls[0][0].classKey.name).toBe("root-syncs");
    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Alda");
    expect((await store.getRecord("npcs", "n1"))?.updatedAt).toEqual(new Date("2026-10-31T10:00:00.000Z"));
    expect((await store.getRecord("templates", "t1"))?.rootId).toBe("C");
    expect((await store.getRecord("roots", "C"))?.resource.attributes.name).toBe("Camp");
  });

  it("keeps the included records of types the device does not sync (the root record's owner) for display, never those of synced types", async () => {
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("roots", "C")] }),
      "roots/C": {
        ok: true,
        response: 200,
        data: {},
        raw: {
          data: {
            type: "roots",
            id: "C",
            attributes: { name: "Camp" },
            relationships: { owner: { data: { type: "users", id: "u1" } } },
          },
          included: [{ type: "users", id: "u1", attributes: { name: "The GM" } }, npc("n-included", "Not in entries")],
        },
      },
    });

    await syncRoot("C");

    const owner = await store.getRecord("users", "u1");
    expect(owner?.resource.attributes.name).toBe("The GM");
    expect(owner?.rootId).toBe("C");
    expect(await store.getRecord("npcs", "n-included")).toBeUndefined();
  });

  it("a first sync sends no updatedSince", async () => {
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1")] }),
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Alda")]),
    });

    await syncRoot("C");

    expect(await store.getRecord("npcs", "n1")).toBeDefined();
  });

  it("replaces the root record's links", async () => {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "A"),
      updatedAt: new Date("2026-10-31T10:00:00.000Z"),
    });
    await store.putRecord({
      type: "npcs",
      id: "n2",
      rootId: "C",
      resource: npc("n2", "B"),
      updatedAt: new Date("2026-10-31T10:00:00.000Z"),
    });
    await store.putLink({ fromType: "npcs", fromId: "n1", toType: "npcs", toId: "n2", kind: "OLD", props: {} });
    await store.setSyncState("C", {
      serverTime: new Date("2026-11-01T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });

    const link = { fromType: "npcs", fromId: "n2", toType: "npcs", toId: "n1", kind: "KNOWS", props: { x: 3 } };
    serve({ "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1"), entry("npcs", "n2")], links: [link] }) });

    await syncRoot("C");

    expect(await store.linksFrom("n1")).toEqual([]);
    expect(await store.linksFrom("n2")).toEqual([link]);
  });

  it("stores the sync state only after every fetch succeeded or answered 403/404 (a record the GM cannot read, e.g. a shared template, is skipped and listed in the console)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("templates", "t1"), entry("templates", "t2")] }),
      "templates/t1": statusAnswer(403),
      "templates/t2": statusAnswer(404),
    });

    await syncRoot("C");

    expect((await store.getSyncState("C")).serverTime).toEqual(new Date("2026-11-01T10:00:00.000Z"));
    expect(warn.mock.calls.flat().join(" ")).toContain("templates/t1");
    expect(warn.mock.calls.flat().join(" ")).toContain("templates/t2");

    // A failure that is not 403/404 leaves the sync state untouched.
    await store.setSyncState("C", { serverTime: null, locked: false, lockedFrom: null });
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("templates", "t1")] }),
      "templates/t1": statusAnswer(500),
    });

    await expect(syncRoot("C")).rejects.toThrow();
    expect((await store.getSyncState("C")).serverTime).toBeNull();
    warn.mockRestore();
  });

  it("never overwrites a record that has a pending queue entry", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "Mine"), updatedAt: null });
    await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "Mine") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });

    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1"), entry("npcs", "n2")] }),
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Theirs"), npc("n2", "Other")]),
    });

    await syncRoot("C");

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Mine");
    expect((await store.getRecord("npcs", "n2"))?.resource.attributes.name).toBe("Other");
  });

  it("keeps a record created on this device while its POST is unsent, though the entry has no recordType/recordId", async () => {
    await store.putRecord({
      type: "npcs",
      id: "fresh",
      rootId: "C",
      resource: npc("fresh", "Fresh"),
      updatedAt: null,
      localOnly: true,
    });
    await store.enqueue({
      rootId: "C",
      method: "POST",
      path: "npcs",
      body: { data: npc("fresh", "Fresh") },
      base: null,
    });
    await store.setSyncState("C", {
      serverTime: new Date("2026-11-01T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });

    serve({ "roots/C/sync": syncAnswer({ entries: [] }) });

    await syncRoot("C");

    expect((await store.getRecord("npcs", "fresh"))?.resource.attributes.name).toBe("Fresh");
  });

  it("treats a record targeted by a queued path <type>/<id> (a custom write) as waiting: never overwritten", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "Mine"), updatedAt: null });
    await store.enqueue({ rootId: "C", method: "POST", path: "npcs/n1/merge", body: {}, base: null });

    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1")] }),
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Theirs")]),
    });

    await syncRoot("C");

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Mine");
  });

  it("a shared artwork another root record still uses is not deleted when it leaves this root", async () => {
    const art = artwork("a1", "http://api.test/artworks/a1/image?v=1");
    await store.putRecord({ type: "artworks", id: "a1", rootId: "C", resource: art, updatedAt: null });
    await store.putRecord({ type: "artworks", id: "a1", rootId: "D", resource: art, updatedAt: null });
    await store.setSyncState("C", {
      serverTime: new Date("2026-11-01T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });

    serve({ "roots/C/sync": syncAnswer({ entries: [] }) });

    await syncRoot("C");

    expect(await store.getRecord("artworks", "a1")).toBeDefined();
    expect(await store.listRecords({ type: "artworks", rootId: "C" })).toEqual([]);
    expect((await store.listRecords({ type: "artworks", rootId: "D" })).map((r) => r.id)).toEqual(["a1"]);
  });

  it("refetches a record once it leaves the waiting state, even when its updatedAt is not newer than the last sync", async () => {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Mine"),
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
      base: npc("n1", "Base"),
    });
    const seq = await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "Mine") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });
    await store.setSyncState("C", {
      serverTime: new Date("2026-10-31T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });

    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1", "2026-10-31T10:00:00.000Z")] }),
      "roots/C/npcs?fetchAll=true&updatedSince=2026-10-31T00:00:00.000Z": listAnswer([npc("n1", "Theirs")]),
    });
    await syncRoot("C");
    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Mine");

    // The GM discards the change: the next sync must bring the server's version back.
    await store.removeQueueEntry(seq);
    serve({
      "roots/C/sync": syncAnswer({
        serverTime: "2026-11-02T10:00:00.000Z",
        entries: [entry("npcs", "n1", "2026-10-31T10:00:00.000Z")],
      }),
      // Older than the updatedSince window: the whole list in one read, never one read per record.
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Theirs")]),
    });
    await syncRoot("C");

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Theirs");
  });

  it("retries a record skipped with 403/404 only when its updatedAt in the sync answer is newer than when it was skipped", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("templates", "t1")] }),
      "templates/t1": statusAnswer(403),
    });
    await syncRoot("C");
    expect(await store.getRecord("templates", "t1")).toBeUndefined();

    // Same updatedAt: not asked for again (an unknown GET would fail the test).
    serve({
      "roots/C/sync": syncAnswer({ serverTime: "2026-11-02T10:00:00.000Z", entries: [entry("templates", "t1")] }),
    });
    await syncRoot("C");
    expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).toEqual([
      "roots/C/sync",
      "templates/t1",
      "roots/C/sync",
    ]);

    // Changed on the server since it was skipped: asked for again.
    serve({
      "roots/C/sync": syncAnswer({
        serverTime: "2026-11-03T10:00:00.000Z",
        entries: [entry("templates", "t1", "2026-11-02T12:00:00.000Z")],
      }),
      "templates/t1": oneAnswer({ type: "templates", id: "t1", attributes: { name: "T" } }),
    });
    await syncRoot("C");

    expect((await store.getRecord("templates", "t1"))?.resource.attributes.name).toBe("T");
    warn.mockRestore();
  });

  it("a root-list record the GM cannot read (absent from the list) is not refetched, and never drops updatedSince for the list", async () => {
    await store.setSyncState("C", {
      serverTime: new Date("2026-10-31T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "hidden", "2026-10-31T10:00:00.000Z")] }),
      "roots/C/npcs?fetchAll=true&updatedSince=2026-10-31T00:00:00.000Z": listAnswer([]),
    });
    await syncRoot("C");
    expect(await store.getRecord("npcs", "hidden")).toBeUndefined();

    // Unchanged on the server: no list download at all (an unknown GET would fail the test).
    serve({
      "roots/C/sync": syncAnswer({
        serverTime: "2026-11-02T10:00:00.000Z",
        entries: [entry("npcs", "hidden", "2026-10-31T10:00:00.000Z"), entry("npcs", "n2", "2026-11-02T09:00:00.000Z")],
      }),
      "roots/C/npcs?fetchAll=true&updatedSince=2026-11-01T10:00:00.000Z": listAnswer([npc("n2", "Two")]),
    });
    await syncRoot("C");

    expect((await store.getRecord("npcs", "n2"))?.resource.attributes.name).toBe("Two");
    expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).not.toContain("roots/C/npcs?fetchAll=true");
  });

  it("a stale root-list record older than the updatedSince window brings the whole list in one read, never a read by id", async () => {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Mine"),
      updatedAt: null,
    });
    await store.setSyncState("C", {
      serverTime: new Date("2026-11-01T00:00:00.000Z"),
      locked: false,
      lockedFrom: null,
    });
    serve({
      "roots/C/sync": syncAnswer({
        entries: [entry("npcs", "n1", "2026-10-20T00:00:00.000Z"), entry("npcs", "n2", "2026-11-01T09:00:00.000Z")],
      }),
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Theirs"), npc("n2", "Two")]),
    });

    await syncRoot("C");

    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Theirs");
    expect((await store.getRecord("npcs", "n1"))?.updatedAt).toEqual(new Date("2026-10-20T00:00:00.000Z"));
    expect((await store.getRecord("npcs", "n2"))?.resource.attributes.name).toBe("Two");
    expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).toEqual([
      "roots/C/sync",
      "roots/C/npcs?fetchAll=true",
    ]);
  });

  it("never overwrites a record whose edit is queued while the sync runs (the waiting set is read in the write transaction)", async () => {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Old"),
      updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    // The GM saves an edit right after the sync read the queue (the reconnect window).
    const readQueue = store.queue.bind(store);
    let edited = false;
    store.queue = async (filter) => {
      const entries = await readQueue(filter);
      if (!edited) {
        edited = true;
        void store.putRecord({
          type: "npcs",
          id: "n1",
          rootId: "C",
          resource: npc("n1", "Mine"),
          updatedAt: new Date("2026-10-01T00:00:00.000Z"),
          base: npc("n1", "Old"),
        });
        void store.enqueue({
          rootId: "C",
          method: "PATCH",
          path: "npcs/n1",
          body: { data: npc("n1", "Mine") },
          recordType: "npcs",
          recordId: "n1",
          base: npc("n1", "Old"),
        });
      }
      return entries;
    };
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("npcs", "n1")] }),
      "roots/C/npcs?fetchAll=true": listAnswer([npc("n1", "Theirs")]),
    });

    await syncRoot("C");

    const record = await store.getRecord("npcs", "n1");
    expect(record?.resource.attributes.name).toBe("Mine");
    expect(record?.base?.attributes.name).toBe("Old");
  });

  it("downloads each artwork's imageUrl into the images cache under that exact URL, again whenever a sync brings a new URL for the same artwork, removing the old entry", async () => {
    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("artworks", "a1")] }),
      "artworks/a1": oneAnswer(artwork("a1", "http://api.test/artworks/a1/image?v=1")),
    });

    await syncRoot("C");

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/artworks/a1/image?v=1");
    const images = cache.caches.get("wyrdli-images")!;
    expect([...images.keys()]).toEqual(["http://api.test/artworks/a1/image?v=1"]);

    serve({
      "roots/C/sync": syncAnswer({
        serverTime: "2026-11-02T10:00:00.000Z",
        entries: [entry("artworks", "a1", "2026-11-02T09:00:00.000Z")],
      }),
      "artworks/a1": oneAnswer(artwork("a1", "http://api.test/artworks/a1/image?v=2")),
    });

    await syncRoot("C");

    expect([...images.keys()]).toEqual(["http://api.test/artworks/a1/image?v=2"]);
  });

  it("linked-list types: each changed record's target found through its sync link, each target's list read once, only entries of the type kept", async () => {
    tearDownSync();
    const PlayerNotes = { name: "player-notes", model: TestModel };
    store = await setUpSync({
      types: [
        ...syncTestConfig().types,
        {
          module: PlayerNotes,
          fetch: "linked-list",
          linkedList: {
            linkKind: "NOTE_ON",
            endpoint: (rootId, target) => `roots/${rootId}/${target.type}/${target.id}/player-notes`,
          },
          readOnly: true,
          serverOwnedFields: [],
        },
      ],
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const note = (id: string) => ({ type: "player-notes", id, attributes: { text: id } });
    const link = (fromId: string, toType: string, toId: string) => ({
      fromType: "player-notes",
      fromId,
      toType,
      toId,
      kind: "NOTE_ON",
      props: {},
    });
    serve({
      "roots/C/sync": syncAnswer({
        entries: [entry("player-notes", "p1"), entry("player-notes", "p2"), entry("player-notes", "p3")],
        links: [link("p1", "sessions", "s1"), link("p2", "clues", "k1"), link("p3", "sessions", "s1")],
      }),
      "roots/C/sessions/s1/player-notes": listAnswer([note("p1"), note("p3"), note("other")]),
      "roots/C/clues/k1/player-notes": statusAnswer(403),
    });

    await syncRoot("C");

    const calls = JsonApiGet.mock.calls.map((call) => call[0]);
    // The target reads run concurrently, in any order.
    expect(calls[0].endpoint).toBe("roots/C/sync");
    expect(
      calls
        .slice(1)
        .map((call) => call.endpoint)
        .sort(),
    ).toEqual(["roots/C/clues/k1/player-notes", "roots/C/sessions/s1/player-notes"]);
    expect(calls.slice(1).every((call) => call.classKey === PlayerNotes)).toBe(true);
    expect((await store.getRecord("player-notes", "p1"))?.updatedAt).toEqual(new Date("2026-10-31T10:00:00.000Z"));
    expect(await store.getRecord("player-notes", "p3")).toBeDefined();
    expect(await store.getRecord("player-notes", "p2")).toBeUndefined();
    expect(await store.getRecord("player-notes", "other")).toBeUndefined();
    expect((await store.getSyncState("C")).serverTime).toEqual(new Date("2026-11-01T10:00:00.000Z"));
    warn.mockRestore();
  });

  it(`keeps at most SYNC_FETCH_CONCURRENCY (${SYNC_FETCH_CONCURRENCY}) record reads in flight at once`, async () => {
    const ids = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
    const pending: (() => void)[] = [];
    let inFlight = 0;
    let maxInFlight = 0;
    JsonApiGet.mockImplementation(async ({ endpoint }: { endpoint: string }) => {
      if (endpoint === "roots/C/sync") return syncAnswer({ entries: ids.map((id) => entry("templates", id)) });
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise<void>((resolve) => pending.push(resolve));
      inFlight -= 1;
      const id = endpoint.split("/")[1];
      return oneAnswer({ type: "templates", id, attributes: { name: id } });
    });

    const running = syncRoot("C");
    await vi.waitFor(() => expect(pending).toHaveLength(SYNC_FETCH_CONCURRENCY));
    for (let released = 0; released < ids.length; released += 1) {
      await vi.waitFor(() => expect(pending.length).toBeGreaterThan(0));
      pending.shift()!();
    }
    await running;

    expect(maxInFlight).toBe(SYNC_FETCH_CONCURRENCY);
    expect(JsonApiGet).toHaveBeenCalledTimes(1 + ids.length);
    for (const id of ids) expect((await store.getRecord("templates", id))?.resource.attributes.name).toBe(id);
  });

  it("finishes the root record's read before any other type's read starts", async () => {
    const events: string[] = [];
    JsonApiGet.mockImplementation(async ({ endpoint }: { endpoint: string }) => {
      if (endpoint === "roots/C/sync") {
        return syncAnswer({ entries: [entry("roots", "C"), entry("npcs", "n1"), entry("templates", "t1")] });
      }
      events.push(`start ${endpoint}`);
      if (endpoint === "roots/C") {
        await new Promise((resolve) => setTimeout(resolve, 5));
        events.push(`end ${endpoint}`);
        return oneAnswer({ type: "roots", id: "C", attributes: { name: "Camp" } });
      }
      events.push(`end ${endpoint}`);
      if (endpoint === "roots/C/npcs?fetchAll=true") return listAnswer([npc("n1", "Alda")]);
      if (endpoint === "templates/t1") return oneAnswer({ type: "templates", id: "t1", attributes: { name: "T" } });
      throw new Error(`unexpected GET ${endpoint}`);
    });

    await syncRoot("C");

    expect(events.slice(0, 2)).toEqual(["start roots/C", "end roots/C"]);
    expect(events).toHaveLength(6);
    expect(await store.getRecord("npcs", "n1")).toBeDefined();
    expect(await store.getRecord("templates", "t1")).toBeDefined();
  });

  it("a failing read (not 403/404) stops the sync: no new read starts and nothing is written", async () => {
    const ids = ["t1", "t2", "t3", "t4", "t5", "t6", "t7", "t8"];
    const pending: (() => void)[] = [];
    JsonApiGet.mockImplementation(async ({ endpoint }: { endpoint: string }) => {
      if (endpoint === "roots/C/sync") {
        return syncAnswer({ entries: [entry("npcs", "n1"), ...ids.map((id) => entry("templates", id))] });
      }
      if (endpoint === "templates/t1") return statusAnswer(500);
      await new Promise<void>((resolve) => pending.push(resolve));
      if (endpoint === "roots/C/npcs?fetchAll=true") return listAnswer([npc("n1", "Alda")]);
      const id = endpoint.split("/")[1];
      return oneAnswer({ type: "templates", id, attributes: { name: id } });
    });

    await expect(syncRoot("C")).rejects.toThrow("templates/t1 answered 500");

    // The reads already in flight finish; their results are discarded and nothing more is asked.
    for (const release of pending.splice(0)) release();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(JsonApiGet).toHaveBeenCalledTimes(1 + SYNC_FETCH_CONCURRENCY);
    expect((await store.getSyncState("C")).serverTime).toBeNull();
    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    for (const id of ids) expect(await store.getRecord("templates", id)).toBeUndefined();
  });

  it("a locked answer stores locked and downloads nothing", async () => {
    serve({
      "roots/C/sync": syncAnswer({ locked: true, lockedFrom: "2026-10-30T00:00:00.000Z", entries: [], links: [] }),
    });

    await syncRoot("C");

    expect(JsonApiGet).toHaveBeenCalledTimes(1);
    const state = await store.getSyncState("C");
    expect(state.locked).toBe(true);
    expect(state.lockedFrom).toEqual(new Date("2026-10-30T00:00:00.000Z"));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("syncAll", () => {
  let store: DeviceStore;

  beforeEach(async () => {
    store = await setUpSync({ listSyncRoots: async () => ["C"] });
    JsonApiGet.mockReset();
    vi.stubGlobal("caches", fakeCacheStorage().storage);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, clone: () => ({}) })),
    );
  });

  afterEach(() => {
    tearDownSync();
    vi.unstubAllGlobals();
  });

  it("removes a root record that is no longer a sync root, unless its queue has entries", async () => {
    await store.putRecord({
      type: "roots",
      id: "C",
      rootId: "C",
      resource: { type: "roots", id: "C" },
      updatedAt: null,
    });
    await store.putRecord({
      type: "roots",
      id: "D",
      rootId: "D",
      resource: { type: "roots", id: "D" },
      updatedAt: null,
    });
    await store.putRecord({ type: "npcs", id: "d1", rootId: "D", resource: npc("d1", "D1", "D"), updatedAt: null });
    await store.putRecord({
      type: "roots",
      id: "E",
      rootId: "E",
      resource: { type: "roots", id: "E" },
      updatedAt: null,
    });
    await store.putRecord({ type: "npcs", id: "e1", rootId: "E", resource: npc("e1", "E1", "E"), updatedAt: null });
    await store.enqueue({
      rootId: "E",
      method: "PATCH",
      path: "npcs/e1",
      body: { data: npc("e1", "E1", "E") },
      recordType: "npcs",
      recordId: "e1",
      base: null,
    });

    serve({
      "roots/C/sync": syncAnswer({ entries: [entry("roots", "C", "2026-01-01T00:00:00.000Z")] }),
      "roots/C": oneAnswer({ type: "roots", id: "C" }),
    });

    await syncAll();

    expect(await store.getRecord("roots", "D")).toBeUndefined();
    expect(await store.getRecord("npcs", "d1")).toBeUndefined();
    expect(await store.getRecord("roots", "E")).toBeDefined();
    expect(await store.getRecord("npcs", "e1")).toBeDefined();
    expect(await store.getRecord("roots", "C")).toBeDefined();
  });

  it("reports progress per root record and, once every root record was tried, the last sync time and the root record count", async () => {
    tearDownSync();
    localStorage.clear();
    store = await setUpSync({ listSyncRoots: async () => ["C", "X"] });
    serve({
      "roots/C/sync": syncAnswer({ entries: [] }),
      "roots/X/sync": statusAnswer(500),
    });
    const progress: ({ done: number; total: number } | null)[] = [];
    const unsubscribe = subscribeOfflineState((state) => {
      if (progress[progress.length - 1] !== state.syncProgress) progress.push(state.syncProgress);
    });
    const now = vi.spyOn(Date, "now").mockReturnValue(1761990000000);

    await syncAll();
    unsubscribe();

    expect(progress.filter((value) => value !== null)).toEqual([
      { done: 0, total: 2 },
      { done: 1, total: 2 },
      { done: 2, total: 2 },
    ]);
    expect(getOfflineState().syncProgress).toBeNull();
    expect(getOfflineState().lastSyncedAt).toBe(1761990000000);
    expect(getOfflineState().rootCount).toBe(2);
    expect(localStorage.getItem("nja-offline-last-sync:u1")).toBe("1761990000000");
    now.mockRestore();
    localStorage.clear();
  });

  describe("extra root kinds", () => {
    const bookSetUp = (
      kind: Partial<{ listSyncRoots: () => Promise<string[]>; typeEndpoints: any; syncModule: any }> = {},
      primaryRoots: () => Promise<string[]> = async () => [],
    ) =>
      setUpSync({
        listSyncRoots: primaryRoots,
        types: [...syncTestConfig().types, ...bookTypes],
        extraRootKinds: [{ module: Books, listSyncRoots: async () => ["b1"], ...kind }],
      });

    it("syncAll syncs extra-kind roots from {module}/:rootId/sync", async () => {
      tearDownSync();
      store = await bookSetUp();
      serve({
        "books/b1/sync": syncAnswer({ entries: [entry("books", "b1"), entry("pages", "p1")] }, "b1"),
        "books/b1": oneAnswer(book("b1")),
        "books/b1/pages?fetchAll=true": listAnswer([page("p1", "First")]),
      });

      await syncAll();

      expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).toEqual([
        "books/b1/sync",
        "books/b1",
        "books/b1/pages?fetchAll=true",
      ]);
      expect(await store.getRecord("pages", "p1")).toMatchObject({ rootId: "b1" });
      expect(await store.getRecord("books", "b1")).toMatchObject({ rootId: "b1" });
    });

    it("syncAll keeps an extra-kind root when a campaign root is removed", async () => {
      tearDownSync();
      let primary = ["C"];
      store = await bookSetUp({}, async () => primary);
      const at = new Date("2026-10-31T10:00:00.000Z");
      await store.putRecord({
        type: "roots",
        id: "C",
        rootId: "C",
        resource: { type: "roots", id: "C" },
        updatedAt: at,
      });
      await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "N"), updatedAt: at });
      await store.putRecord({ type: "books", id: "b1", rootId: "b1", resource: book("b1"), updatedAt: at });
      await store.putRecord({ type: "pages", id: "p1", rootId: "b1", resource: page("p1", "P"), updatedAt: at });
      await store.setSyncState("b1", {
        serverTime: new Date("2026-11-01T00:00:00.000Z"),
        locked: false,
        lockedFrom: null,
      });
      serve({
        "books/b1/sync": syncAnswer({ entries: [entry("books", "b1"), entry("pages", "p1")] }, "b1"),
      });

      primary = [];
      await syncAll();

      expect(await store.getRecord("roots", "C")).toBeUndefined();
      expect(await store.getRecord("npcs", "n1")).toBeUndefined();
      expect(await store.getRecord("books", "b1")).toBeDefined();
      expect(await store.getRecord("pages", "p1")).toBeDefined();
    });

    it("typeEndpoints replace the type's fetch under that kind and get the stored root record", async () => {
      tearDownSync();
      store = await bookSetUp({
        typeEndpoints: [
          {
            module: { name: "npcs", model: TestModel },
            endpoint: (root: { id: string; resource: any }) =>
              `roots/${root.resource.attributes.parent}/npcs/as-participant`,
          },
        ],
      });
      await store.setSyncState("b1", {
        serverTime: new Date("2026-10-30T00:00:00.000Z"),
        locked: false,
        lockedFrom: null,
      });
      serve({
        "books/b1/sync": syncAnswer({ entries: [entry("books", "b1"), entry("npcs", "n1")] }, "b1"),
        "books/b1": oneAnswer(book("b1", { parent: "R9" })),
        "roots/R9/npcs/as-participant": listAnswer([npc("n1", "Alda", "R9"), npc("other", "Other", "R9")]),
      });

      await syncAll();

      expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).toEqual([
        "books/b1/sync",
        "books/b1",
        "roots/R9/npcs/as-participant",
      ]);
      expect(await store.getRecord("npcs", "n1")).toMatchObject({ rootId: "b1" });
      expect(await store.getRecord("npcs", "other")).toBeUndefined();
    });

    it("typeEndpoints build from the stored root record when the root record did not change", async () => {
      tearDownSync();
      store = await bookSetUp({
        typeEndpoints: [
          {
            module: { name: "npcs", model: TestModel },
            endpoint: (root: { id: string; resource: any }) =>
              `roots/${root.resource.attributes.parent}/npcs/as-participant`,
          },
        ],
      });
      await store.putRecord({
        type: "books",
        id: "b1",
        rootId: "b1",
        resource: book("b1", { parent: "R7" }),
        updatedAt: new Date("2026-10-20T00:00:00.000Z"),
      });
      await store.setSyncState("b1", {
        serverTime: new Date("2026-10-30T00:00:00.000Z"),
        locked: false,
        lockedFrom: null,
      });
      serve({
        "books/b1/sync": syncAnswer(
          { entries: [entry("books", "b1", "2026-10-20T00:00:00.000Z"), entry("npcs", "n1")] },
          "b1",
        ),
        "roots/R7/npcs/as-participant": listAnswer([npc("n1", "Alda", "R7")]),
      });

      await syncAll();

      expect(JsonApiGet.mock.calls.map((call) => call[0].endpoint)).toEqual([
        "books/b1/sync",
        "roots/R7/npcs/as-participant",
      ]);
      expect(await store.getRecord("npcs", "n1")).toMatchObject({ rootId: "b1" });
    });

    it("rootCount counts primary roots only; progress total counts all", async () => {
      tearDownSync();
      store = await bookSetUp({ listSyncRoots: async () => ["b1", "b2"] }, async () => ["C"]);
      serve({
        "roots/C/sync": syncAnswer({ entries: [] }),
        "books/b1/sync": syncAnswer({ entries: [] }, "b1"),
        "books/b2/sync": syncAnswer({ entries: [] }, "b2"),
      });
      const totals = new Set<number>();
      const unsubscribe = subscribeOfflineState((state) => {
        if (state.syncProgress) totals.add(state.syncProgress.total);
      });

      await syncAll();
      unsubscribe();

      expect([...totals]).toEqual([3]);
      expect(getOfflineState().rootCount).toBe(1);
      localStorage.clear();
    });

    it("an extra kind with syncModule reads its sync answer through that module", async () => {
      tearDownSync();
      const BookSyncs = { name: "book-syncs", model: RootSync };
      store = await bookSetUp({ syncModule: BookSyncs });
      serve({ "books/b1/sync": syncAnswer({ entries: [] }, "b1") });

      await syncAll();

      expect(JsonApiGet.mock.calls[0][0]).toMatchObject({ endpoint: "books/b1/sync", classKey: BookSyncs });
      localStorage.clear();
    });
  });
});
