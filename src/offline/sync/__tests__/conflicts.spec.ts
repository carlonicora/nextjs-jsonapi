import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setOfflineState } from "../../state";
import type { ConflictKind, DeviceStore } from "../../store/DeviceStore";
import { npc, setUpSync, tearDownSync } from "./sync-fixtures";

vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet: vi.fn(),
  JsonApiPost: vi.fn(),
  getApiUrl: () => "http://api.test/",
  buildUrl: (endpoint: string) => `http://api.test/${endpoint}`,
}));

import { resolveConflict } from "../conflicts";

describe("resolveConflict", () => {
  let store: DeviceStore;
  const mineBody = { data: npc("n1", "Mine") };
  const base = npc("n1", "Base");
  const theirs = npc("n1", "Theirs");

  beforeEach(async () => {
    store = await setUpSync();
    // Offline: resolving never triggers a drain in these tests.
    setOfflineState({ online: false });
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Mine"),
      updatedAt: null,
      base,
    });
  });

  afterEach(() => tearDownSync());

  async function conflictOf(kind: ConflictKind, method: "PATCH" | "DELETE" = "PATCH", theirsValue: any = theirs) {
    const seq = await store.enqueue({
      rootId: "C",
      method,
      path: "npcs/n1",
      body: method === "DELETE" ? undefined : mineBody,
      recordType: "npcs",
      recordId: "n1",
      base,
    });
    await store.setQueueStatus(seq, "conflict");
    const id = await store.addConflict({
      queueSeq: seq,
      kind,
      recordType: "npcs",
      recordId: "n1",
      mine: method === "DELETE" ? null : mineBody,
      theirs: theirsValue,
      base,
      fields: kind === "fields" ? ["name"] : [],
      reason: kind === "could-not-apply" ? "bad" : undefined,
    });
    return { seq, id };
  }

  it("keep mine re-queues the original change (original body and base) with resolution {kind:'mine'}", async () => {
    const { seq, id } = await conflictOf("fields");

    await resolveConflict(id, { kind: "mine" });

    const queue = await store.queue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      method: "PATCH",
      path: "npcs/n1",
      body: mineBody,
      recordType: "npcs",
      recordId: "n1",
      base,
      resolution: { kind: "mine" },
      status: "pending",
    });
    expect(queue[0].seq).not.toBe(seq);
    expect((await store.getRecord("npcs", "n1"))?.base).toEqual(base);
    expect(await store.conflicts()).toEqual([]);
  });

  it("per-field choices re-queue the original change with resolution {kind:'merged', choices, mergedBody}", async () => {
    const { id } = await conflictOf("fields");
    const mergedBody = { data: { type: "npcs", id: "n1", attributes: { description: "Hand merged" } } };
    const choices = { name: "theirs", description: "merged" } as const;

    await resolveConflict(id, { kind: "fields", choices, mergedBody });

    const queue = await store.queue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      method: "PATCH",
      path: "npcs/n1",
      body: mineBody,
      base,
      resolution: { kind: "merged", choices, mergedBody },
      status: "pending",
    });
    const record = await store.getRecord("npcs", "n1");
    expect(record?.resource.attributes.name).toBe("Theirs");
    expect(record?.resource.attributes.description).toBe("Hand merged");
    expect(await store.conflicts()).toEqual([]);
  });

  it("per-field choices that are all 'theirs' behave as keep theirs", async () => {
    const { id } = await conflictOf("fields");

    await resolveConflict(id, { kind: "fields", choices: { name: "theirs" } });

    expect(await store.queue()).toEqual([]);
    expect((await store.getRecord("npcs", "n1"))?.resource).toEqual(theirs);
    expect(await store.conflicts()).toEqual([]);
  });

  it("keep theirs stores theirs and drops the entry", async () => {
    const { id } = await conflictOf("fields");

    await resolveConflict(id, { kind: "theirs" });

    expect(await store.queue()).toEqual([]);
    expect(await store.conflicts()).toEqual([]);
    const record = await store.getRecord("npcs", "n1");
    expect(record?.resource).toEqual(theirs);
    expect(record?.base).toBeNull();
  });

  it("restore enqueues a POST with my body", async () => {
    const { id } = await conflictOf("deleted-on-server", "PATCH", null);

    await resolveConflict(id, { kind: "restore" });

    const [entry] = await store.queue();
    expect(entry).toMatchObject({ method: "POST", path: "npcs", body: mineBody, base: null, status: "pending" });
    expect(await store.conflicts()).toEqual([]);
  });

  it("accept-deletion removes the local record", async () => {
    const { id } = await conflictOf("deleted-on-server", "PATCH", null);

    await resolveConflict(id, { kind: "accept-deletion" });

    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    expect(await store.queue()).toEqual([]);
    expect(await store.conflicts()).toEqual([]);
  });

  it("delete-anyway re-queues the original DELETE carrying a resolution, so the server skips the changed-on-server check", async () => {
    const { seq, id } = await conflictOf("changed-on-server", "DELETE");

    await resolveConflict(id, { kind: "delete-anyway" });

    const [entry] = await store.queue();
    expect(entry).toMatchObject({
      method: "DELETE",
      path: "npcs/n1",
      base,
      resolution: { kind: "mine" },
      status: "pending",
    });
    expect(entry.seq).not.toBe(seq);
    expect(await store.conflicts()).toEqual([]);
  });

  it("discard removes the entry", async () => {
    const { id } = await conflictOf("could-not-apply");

    await resolveConflict(id, { kind: "discard" });

    expect(await store.queue()).toEqual([]);
    expect(await store.conflicts()).toEqual([]);
  });

  it("retry sets it pending", async () => {
    const { seq, id } = await conflictOf("could-not-apply");

    await resolveConflict(id, { kind: "retry" });

    const [entry] = await store.queue();
    expect(entry.seq).toBe(seq);
    expect(entry.status).toBe("pending");
    expect(await store.conflicts()).toEqual([]);
  });
});
