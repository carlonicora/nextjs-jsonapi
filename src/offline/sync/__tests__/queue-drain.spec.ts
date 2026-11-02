import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOfflineState, setOfflineState } from "../../state";
import type { DeviceStore } from "../../store/DeviceStore";
import { OfflineChangeSet } from "../models/OfflineChangeSet";
import { npc, setUpSync, tearDownSync } from "./sync-fixtures";

const { JsonApiPost } = vi.hoisted(() => ({ JsonApiPost: vi.fn() }));
vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet: vi.fn(),
  JsonApiPost,
  getApiUrl: () => "http://api.test/",
  buildUrl: (endpoint: string) => `http://api.test/${endpoint}`,
}));

import { drainQueue } from "../drain-queue";

const answer = (results: any[]) => ({
  ok: true,
  response: 200,
  data: new OfflineChangeSet().rehydrate({
    jsonApi: { type: "offline-change-sets", id: "pkg", attributes: { results } },
    included: [],
  } as any),
});

function clearCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}

describe("drainQueue", () => {
  let store: DeviceStore;
  const fetchMock = vi.fn();

  beforeEach(async () => {
    store = await setUpSync();
    JsonApiPost.mockReset();
    fetchMock.mockReset();
    fetchMock.mockImplementation(async () => {
      document.cookie = "token=fresh; path=/";
      return { ok: true, status: 200 };
    });
    vi.stubGlobal("fetch", fetchMock);
    clearCookies();
  });

  afterEach(() => {
    tearDownSync();
    vi.unstubAllGlobals();
    clearCookies();
  });

  async function seedTwoEdits() {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Mine"),
      updatedAt: null,
      base: npc("n1", "Base"),
    });
    const first = await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "Mine") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });
    const second = await store.enqueue({
      rootId: "C",
      method: "POST",
      path: "npcs",
      body: { data: npc("n2", "New") },
      recordType: "npcs",
      recordId: "n2",
      base: null,
    });
    return { first, second };
  }

  it("refreshes the session first", async () => {
    const order: string[] = [];
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      order.push(`fetch ${url} ${init?.cache}`);
      document.cookie = "token=fresh; path=/";
      return { ok: true, status: 200 };
    });
    JsonApiPost.mockImplementation(async () => {
      order.push("post");
      return answer([]);
    });
    await seedTwoEdits();

    await drainQueue();

    expect(order).toEqual(["fetch /offline-shell no-store", "post"]);
  });

  it("sends every pending entry of unlocked root records in ONE request, in seq order, through JsonApiPost with the offline-change-sets module", async () => {
    const { first, second } = await seedTwoEdits();
    // 30 more entries: still one request, never split.
    for (let i = 0; i < 30; i++) {
      await store.enqueue({
        rootId: "C",
        method: "PATCH",
        path: `npcs/x${i}`,
        body: { data: npc(`x${i}`, "X") },
        recordType: "npcs",
        recordId: `x${i}`,
        base: null,
      });
    }
    await store.enqueue({
      rootId: "L",
      method: "PATCH",
      path: "npcs/l1",
      body: { data: npc("l1", "L", "L") },
      recordType: "npcs",
      recordId: "l1",
      base: null,
    });
    await store.setSyncState("L", { serverTime: null, locked: true, lockedFrom: null });
    JsonApiPost.mockResolvedValue(answer([]));

    await drainQueue();

    expect(JsonApiPost).toHaveBeenCalledTimes(1);
    const params = JsonApiPost.mock.calls[0][0];
    expect(params.classKey.name).toBe("offline-change-sets");
    expect(params.endpoint).toBe("offline-change-sets");
    expect(typeof params.body.id).toBe("string");
    const changes = params.body.changes;
    expect(changes).toHaveLength(32);
    expect(changes.map((c: any) => c.seq)).toEqual(
      [...changes.map((c: any) => c.seq)].sort((a: number, b: number) => a - b),
    );
    expect(changes[0]).toEqual({
      seq: first,
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "Mine") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });
    expect(changes[1].seq).toBe(second);
    expect(changes.some((c: any) => c.path === "npcs/l1")).toBe(false);
  });

  it("applied → entry removed and response written through to the store", async () => {
    const { first } = await seedTwoEdits();
    const saved = { ...npc("n1", "Merged"), attributes: { name: "Merged", updatedAt: "2026-11-01T10:00:00.000Z" } };
    JsonApiPost.mockResolvedValue(answer([{ seq: first, status: "applied", response: { data: saved } }]));

    const result = await drainQueue();

    expect(result.applied).toBe(1);
    const remaining = await store.queue();
    expect(remaining.map((e) => e.seq)).not.toContain(first);
    const record = await store.getRecord("npcs", "n1");
    expect(record?.resource.attributes.name).toBe("Merged");
    expect(record?.base).toBeNull();
  });

  it("conflict → a Conflict row with mine/theirs/base/merged/fields/blocks, entry status conflict", async () => {
    const { first } = await seedTwoEdits();
    const current = npc("n1", "Theirs");
    JsonApiPost.mockResolvedValue(
      answer([
        {
          seq: first,
          status: "conflict",
          conflict: "fields",
          current,
          merged: { name: "?" },
          conflictFields: ["name"],
          conflictBlocks: { description: ["b1"] },
        },
      ]),
    );

    const result = await drainQueue();

    expect(result.conflicts).toBe(1);
    const [conflict] = await store.conflicts();
    expect(conflict).toMatchObject({
      queueSeq: first,
      kind: "fields",
      recordType: "npcs",
      recordId: "n1",
      mine: { data: npc("n1", "Mine") },
      theirs: current,
      base: npc("n1", "Base"),
      // The server's current resource with the merged attributes laid over it.
      merged: { ...current, attributes: { ...current.attributes, name: "?" } },
      fields: ["name"],
      blocks: { description: ["b1"] },
    });
    expect((await store.queue()).find((e) => e.seq === first)?.status).toBe("conflict");
    expect(getOfflineState().conflicts).toBe(1);
  });

  it("could-not-apply → a could-not-apply conflict with the detail", async () => {
    const { first } = await seedTwoEdits();
    JsonApiPost.mockResolvedValue(
      answer([{ seq: first, status: "could-not-apply", detail: "name must not be empty" }]),
    );

    await drainQueue();

    const [conflict] = await store.conflicts();
    expect(conflict.kind).toBe("could-not-apply");
    expect(conflict.reason).toBe("name must not be empty");
    expect((await store.queue()).find((e) => e.seq === first)?.status).toBe("conflict");
  });

  it("waiting → entry stays pending", async () => {
    const { first, second } = await seedTwoEdits();
    JsonApiPost.mockResolvedValue(
      answer([
        { seq: first, status: "applied" },
        { seq: second, status: "waiting" },
      ]),
    );

    await drainQueue();

    const remaining = await store.queue();
    expect(remaining.map((e) => [e.seq, e.status])).toEqual([[second, "pending"]]);
  });

  it("a network error stops the drain and leaves every entry pending", async () => {
    await seedTwoEdits();
    JsonApiPost.mockImplementation(async () => {
      // directFetch marks the session offline and answers locally (needs a connection).
      setOfflineState({ online: false });
      return { ok: false, response: 503, data: [], error: "Needs a connection" };
    });

    const result = await drainQueue();

    expect(result.applied).toBe(0);
    expect((await store.queue()).map((e) => e.status)).toEqual(["pending", "pending"]);
    expect(await store.conflicts()).toEqual([]);
  });

  it("a package that got no answer is sent again with the same id; a new package after an answer gets a fresh id", async () => {
    const { first, second } = await seedTwoEdits();
    JsonApiPost.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    await drainQueue();
    error.mockRestore();
    const firstId = JsonApiPost.mock.calls[0][0].body.id;
    expect((await store.queue()).map((e) => [e.status, e.packageId])).toEqual([
      ["pending", firstId],
      ["pending", firstId],
    ]);

    JsonApiPost.mockResolvedValueOnce(
      answer([
        { seq: first, status: "applied" },
        { seq: second, status: "waiting" },
      ]),
    );
    await drainQueue();
    expect(JsonApiPost.mock.calls[1][0].body.id).toBe(firstId);
    expect((await store.queue()).map((e) => [e.seq, e.status, e.packageId])).toEqual([[second, "pending", undefined]]);

    JsonApiPost.mockResolvedValueOnce(answer([]));
    await drainQueue();
    expect(JsonApiPost).toHaveBeenCalledTimes(3);
    expect(JsonApiPost.mock.calls[2][0].body.id).not.toBe(firstId);
  });

  it("strips each type's serverOwnedFields from the queued body before sending, never from the stored record", async () => {
    tearDownSync();
    store = await setUpSync({
      types: [
        {
          module: { name: "npcs", model: class {} } as any,
          fetch: "root-list",
          readOnly: false,
          serverOwnedFields: ["tldr", "aiStatus"],
        },
      ],
    });
    const body = { data: { ...npc("n1", "Mine"), attributes: { name: "Mine", tldr: "AI", aiStatus: "done" } } };
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: body.data, updatedAt: null });
    await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body,
      recordType: "npcs",
      recordId: "n1",
      base: null,
    });
    JsonApiPost.mockResolvedValue(answer([]));

    await drainQueue();

    const [change] = JsonApiPost.mock.calls[0][0].body.changes;
    expect(change.body.data.attributes).toEqual({ name: "Mine" });
    expect((await store.queue())[0].body.data.attributes.tldr).toBe("AI");
    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.tldr).toBe("AI");
  });

  it("an applied entry never overwrites the record while another change of it still waits", async () => {
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Latest"),
      updatedAt: null,
      base: npc("n1", "Base"),
    });
    const first = await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "First") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });
    const second = await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n1",
      body: { data: npc("n1", "Latest") },
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Base"),
    });
    JsonApiPost.mockResolvedValue(
      answer([
        { seq: first, status: "applied", response: { data: npc("n1", "First") } },
        { seq: second, status: "waiting" },
      ]),
    );

    await drainQueue();

    const record = await store.getRecord("npcs", "n1");
    expect(record?.resource.attributes.name).toBe("Latest");
    expect(record?.base).toEqual(npc("n1", "Base"));
  });

  it("a sign-in that expired stops the drain and keeps every entry", async () => {
    await seedTwoEdits();
    fetchMock.mockImplementation(async () => ({ ok: true, status: 200 }));

    const result = await drainQueue();

    expect(result.stoppedForLogin).toBe(true);
    expect(JsonApiPost).not.toHaveBeenCalled();
    expect((await store.queue()).map((e) => e.status)).toEqual(["pending", "pending"]);
  });
});
