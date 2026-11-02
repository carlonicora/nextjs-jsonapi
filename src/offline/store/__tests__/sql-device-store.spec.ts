import { beforeEach, describe, expect, it } from "vitest";
import type { DeviceStore } from "../DeviceStore";
import { isRootLocked, openMemoryDatabase, openMemoryDeviceStore } from "../lifecycle";
import { DEVICE_STORE_SCHEMA_VERSION } from "../schema";
import { createSqlDeviceStore } from "../sql-device-store";

const npc = (id: string, name = "Mara") => ({
  type: "npcs",
  id,
  attributes: { name, description: [{ id: "b1", type: "paragraph", content: [] }] },
  relationships: { root: { data: { type: "roots", id: "C" } } },
});

describe("sql device store", () => {
  let store: DeviceStore;

  beforeEach(async () => {
    store = await openMemoryDeviceStore();
  });

  it("putRecord then getRecord round-trips the resource JSON", async () => {
    const updatedAt = new Date("2026-10-30T10:00:00.000Z");
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt });

    const record = await store.getRecord("npcs", "n1");

    expect(record).toEqual({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1"),
      updatedAt,
      base: null,
      localOnly: false,
    });
    expect(record?.updatedAt).toBeInstanceOf(Date);
    expect(await store.getRecord("npcs", "missing")).toBeUndefined();

    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: npc("n1", "Mara II"),
      updatedAt: null,
      base: npc("n1"),
      localOnly: true,
    });
    const replaced = await store.getRecord("npcs", "n1");
    expect(replaced?.resource.attributes.name).toBe("Mara II");
    expect(replaced?.base).toEqual(npc("n1"));
    expect(replaced?.localOnly).toBe(true);
    expect(replaced?.updatedAt).toBeNull();
  });

  it("listRecords filters by type and rootId", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt: null });
    await store.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: npc("n2"), updatedAt: null });
    await store.putRecord({ type: "npcs", id: "n3", rootId: "D", resource: npc("n3"), updatedAt: null });
    await store.putRecord({
      type: "locations",
      id: "l1",
      rootId: "C",
      resource: { type: "locations", id: "l1" },
      updatedAt: null,
    });

    expect((await store.listRecords({ type: "npcs" })).map((r) => r.id).sort()).toEqual(["n1", "n2", "n3"]);
    expect((await store.listRecords({ type: "npcs", rootId: "C" })).map((r) => r.id).sort()).toEqual(["n1", "n2"]);
    expect((await store.listRecords({ type: "npcs", ids: ["n1", "n3", "l1"] })).map((r) => r.id).sort()).toEqual([
      "n1",
      "n3",
    ]);
    expect(await store.listRecords({ type: "npcs", ids: [] })).toEqual([]);
  });

  it("deleteRecord removes the record and every link from or to it", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt: null });
    await store.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: npc("n2"), updatedAt: null });
    await store.putLink({
      fromType: "npcs",
      fromId: "n1",
      toType: "factions",
      toId: "f1",
      kind: "MEMBER_OF",
      props: {},
    });
    await store.putLink({
      fromType: "scenes",
      fromId: "s1",
      toType: "npcs",
      toId: "n1",
      kind: "FEATURES",
      props: { x: 3 },
    });
    await store.putLink({
      fromType: "npcs",
      fromId: "n2",
      toType: "factions",
      toId: "f1",
      kind: "MEMBER_OF",
      props: {},
    });

    await store.deleteRecord("npcs", "n1");

    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    expect(await store.linksFrom("n1")).toEqual([]);
    expect(await store.linksTo("n1")).toEqual([]);
    expect(await store.linksTo("f1")).toEqual([
      { fromType: "npcs", fromId: "n2", toType: "factions", toId: "f1", kind: "MEMBER_OF", props: {} },
    ]);
  });

  it("replaceRootLinks replaces only that root record's links", async () => {
    await store.replaceRootLinks("C", [
      { fromType: "npcs", fromId: "n1", toType: "factions", toId: "f1", kind: "MEMBER_OF", props: {} },
      { fromType: "scenes", fromId: "s1", toType: "npcs", toId: "n1", kind: "FEATURES", props: { x: 1, y: 2 } },
    ]);
    await store.replaceRootLinks("D", [
      { fromType: "npcs", fromId: "n9", toType: "factions", toId: "f9", kind: "MEMBER_OF", props: {} },
    ]);

    await store.replaceRootLinks("C", [
      { fromType: "npcs", fromId: "n1", toType: "locations", toId: "l1", kind: "LIVES_IN", props: {} },
    ]);

    expect(await store.linksFrom("n1")).toEqual([
      { fromType: "npcs", fromId: "n1", toType: "locations", toId: "l1", kind: "LIVES_IN", props: {} },
    ]);
    expect(await store.linksTo("n1")).toEqual([]);
    expect(await store.linksFrom("n9", "MEMBER_OF")).toHaveLength(1);
    expect(await store.linksFrom("n9", "OTHER")).toHaveLength(0);

    await store.deleteLink({ fromId: "n9", toId: "f9", kind: "MEMBER_OF" });
    expect(await store.linksFrom("n9")).toEqual([]);
  });

  it("enqueue assigns increasing seq; queue() returns seq order; base round-trips", async () => {
    const first = await store.enqueue({
      rootId: "C",
      method: "POST",
      path: "npcs",
      body: { data: npc("n1") },
      recordType: "npcs",
      recordId: "n1",
      base: null,
    });
    const second = await store.enqueue({
      rootId: "C",
      method: "PATCH",
      path: "npcs/n2",
      body: { data: npc("n2", "Edited") },
      recordType: "npcs",
      recordId: "n2",
      base: npc("n2"),
      resolution: { kind: "merged" },
    });

    expect(second).toBeGreaterThan(first);

    await store.setQueueStatus(first, "sending");
    const entries = await store.queue();
    expect(entries.map((e) => e.seq)).toEqual([first, second]);
    expect(entries[0]).toMatchObject({ seq: first, method: "POST", path: "npcs", base: null, status: "sending" });
    expect(entries[0].resolution).toBeUndefined();
    expect(entries[1]).toMatchObject({
      seq: second,
      rootId: "C",
      body: { data: npc("n2", "Edited") },
      base: npc("n2"),
      resolution: { kind: "merged" },
      status: "pending",
    });
    expect(entries[1].createdAt).toBeInstanceOf(Date);
    expect((await store.queue({ status: "pending" })).map((e) => e.seq)).toEqual([second]);

    await store.removeQueueEntry(first);
    expect((await store.queue()).map((e) => e.seq)).toEqual([second]);
    const third = await store.enqueue({ rootId: "C", method: "DELETE", path: "npcs/n3", base: npc("n3") });
    expect(third).toBeGreaterThan(second);
  });

  it("conflicts round-trip and sync state round-trips dates", async () => {
    const seq = await store.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: npc("n1") });
    const id = await store.addConflict({
      queueSeq: seq,
      kind: "fields",
      recordType: "npcs",
      recordId: "n1",
      mine: npc("n1", "Mine"),
      theirs: npc("n1", "Theirs"),
      base: npc("n1"),
      fields: ["name"],
      blocks: { description: ["b1"] },
    });
    expect(await store.conflicts()).toEqual([
      {
        id,
        queueSeq: seq,
        kind: "fields",
        recordType: "npcs",
        recordId: "n1",
        mine: npc("n1", "Mine"),
        theirs: npc("n1", "Theirs"),
        base: npc("n1"),
        fields: ["name"],
        blocks: { description: ["b1"] },
      },
    ]);
    await store.removeConflict(id);
    expect(await store.conflicts()).toEqual([]);

    expect(await store.getSyncState("C")).toEqual({ serverTime: null, locked: false, lockedFrom: null });
    const serverTime = new Date("2026-11-01T08:00:00.000Z");
    const lockedFrom = new Date("2026-11-20T00:00:00.000Z");
    await store.setSyncState("C", { serverTime, locked: false, lockedFrom });
    const state = await store.getSyncState("C");
    expect(state).toEqual({ serverTime, locked: false, lockedFrom });
    expect(state.serverTime).toBeInstanceOf(Date);
  });

  it("skipped records round-trip per root record, are replaced as a whole, and go with removeRoot", async () => {
    const updatedAt = new Date("2026-10-31T10:00:00.000Z");
    expect(await store.skippedRecords("C")).toEqual([]);

    await store.setSkippedRecords("C", [{ type: "templates", id: "t1", updatedAt }]);
    await store.setSkippedRecords("D", [{ type: "npcs", id: "n1", updatedAt }]);
    expect(await store.skippedRecords("C")).toEqual([{ type: "templates", id: "t1", updatedAt }]);

    await store.setSkippedRecords("C", [{ type: "npcs", id: "n2", updatedAt }]);
    expect(await store.skippedRecords("C")).toEqual([{ type: "npcs", id: "n2", updatedAt }]);

    await store.removeRoot("C");
    expect(await store.skippedRecords("C")).toEqual([]);
    expect(await store.skippedRecords("D")).toHaveLength(1);
  });

  it("removeRoot removes everything of that root record only", async () => {
    for (const rootId of ["C", "D"]) {
      const id = `n-${rootId}`;
      await store.putRecord({ type: "npcs", id, rootId, resource: npc(id), updatedAt: null });
      await store.replaceRootLinks(rootId, [
        { fromType: "npcs", fromId: id, toType: "factions", toId: `f-${rootId}`, kind: "MEMBER_OF", props: {} },
      ]);
      await store.setSyncState(rootId, { serverTime: new Date(), locked: false, lockedFrom: null });
    }
    const seq = await store.enqueue({ rootId: "D", method: "PATCH", path: "npcs/n-D", base: npc("n-D") });
    await store.addConflict({ queueSeq: seq, kind: "fields", mine: {}, theirs: {}, base: {}, fields: [] });

    await store.removeRoot("C");

    expect(await store.listRecords({ type: "npcs" })).toHaveLength(1);
    expect(await store.getRecord("npcs", "n-D")).toBeDefined();
    expect(await store.linksFrom("n-C")).toEqual([]);
    expect(await store.linksFrom("n-D")).toHaveLength(1);
    expect((await store.getSyncState("C")).serverTime).toBeNull();
    expect((await store.getSyncState("D")).serverTime).not.toBeNull();
    expect(await store.queue()).toHaveLength(1);
    expect(await store.conflicts()).toHaveLength(1);

    // A root record with waiting changes is kept whole.
    await store.removeRoot("D");
    expect(await store.getRecord("npcs", "n-D")).toBeDefined();
    expect(await store.queue()).toHaveLength(1);

    await store.removeQueueEntry(seq);
    await store.removeRoot("D");
    expect(await store.listRecords({ type: "npcs" })).toEqual([]);
    expect(await store.linksFrom("n-D")).toEqual([]);
    expect(await store.conflicts()).toEqual([]);
    expect((await store.getSyncState("D")).serverTime).toBeNull();
  });

  it("a shared record (an artwork) used by two root records is listed for both and survives removing one of them", async () => {
    const art = { type: "artworks", id: "a1", attributes: { name: "Map" } };
    await store.putRecord({ type: "artworks", id: "a1", rootId: "C", resource: art, updatedAt: null });
    await store.putRecord({ type: "artworks", id: "a1", rootId: "D", resource: art, updatedAt: null });
    await store.putRecord({ type: "npcs", id: "n-C", rootId: "C", resource: npc("n-C"), updatedAt: null });
    await store.putLink({ fromType: "npcs", fromId: "n-C", toType: "artworks", toId: "a1", kind: "HAS", props: {} });

    expect((await store.listRecords({ type: "artworks", rootId: "C" })).map((r) => r.id)).toEqual(["a1"]);
    expect((await store.listRecords({ type: "artworks", rootId: "D" })).map((r) => r.id)).toEqual(["a1"]);
    expect((await store.getRecord("artworks", "a1"))?.rootId).toBe("C");

    await store.removeRoot("C");

    const kept = await store.getRecord("artworks", "a1");
    expect(kept?.rootId).toBe("D");
    expect((await store.listRecords({ type: "artworks", rootId: "D" })).map((r) => r.id)).toEqual(["a1"]);
    expect(await store.listRecords({ type: "artworks", rootId: "C" })).toEqual([]);
    expect(await store.getRecord("npcs", "n-C")).toBeUndefined();

    await store.removeRoot("D");
    expect(await store.getRecord("artworks", "a1")).toBeUndefined();
  });

  it("removeRecordFromRoot deletes the record only when no root record keeps it", async () => {
    const art = { type: "artworks", id: "a1", attributes: { name: "Map" } };
    await store.putRecord({ type: "artworks", id: "a1", rootId: "C", resource: art, updatedAt: null });
    await store.putRecord({ type: "artworks", id: "a1", rootId: "D", resource: art, updatedAt: null });

    await store.removeRecordFromRoot("artworks", "a1", "C");
    expect((await store.getRecord("artworks", "a1"))?.rootId).toBe("D");
    expect(await store.listRecords({ type: "artworks", rootId: "C" })).toEqual([]);

    await store.removeRecordFromRoot("artworks", "a1", "D");
    expect(await store.getRecord("artworks", "a1")).toBeUndefined();
  });

  it("setQueuePackage stores and clears the package id of queue entries", async () => {
    const first = await store.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: null });
    const second = await store.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n2", base: null });

    await store.setQueuePackage([first, second], "pkg-1");
    expect((await store.queue()).map((e) => e.packageId)).toEqual(["pkg-1", "pkg-1"]);

    await store.setQueuePackage([first], null);
    expect((await store.queue()).map((e) => e.packageId)).toEqual([undefined, "pkg-1"]);
  });

  it("a queue entry's resolution (kind, choices, mergedBody) round-trips", async () => {
    const resolution = {
      kind: "merged" as const,
      choices: { name: "mine" as const, description: "merged" as const, title: "theirs" as const },
      mergedBody: { data: { type: "npcs", id: "n1", attributes: { description: [{ id: "b1" }] } } },
    };
    await store.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: null, resolution });

    expect((await store.queue())[0].resolution).toEqual(resolution);
  });

  it("recreates a device file of an older schema version", async () => {
    const database = await openMemoryDatabase();
    await database.exec(`CREATE TABLE records (type TEXT, id TEXT, campaign_id TEXT, resource TEXT)`);
    await database.exec(`INSERT INTO records VALUES ('npcs', 'old', 'C', '{}')`);
    await database.exec(`PRAGMA user_version = 1`);

    const upgraded = await createSqlDeviceStore(database.exec);

    expect(await upgraded.getRecord("npcs", "old")).toBeUndefined();
    await upgraded.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt: null });
    expect((await upgraded.listRecords({ type: "npcs", rootId: "C" })).map((r) => r.id)).toEqual(["n1"]);
    expect((await database.exec(`PRAGMA user_version`))[0].user_version).toBe(DEVICE_STORE_SCHEMA_VERSION);
  });

  it("recreates a layout-2 device file (campaign_id columns, record_campaigns) with the root layout", async () => {
    const database = await openMemoryDatabase();
    await database.exec(
      `CREATE TABLE records (type TEXT, id TEXT, campaign_id TEXT NOT NULL, resource TEXT, PRIMARY KEY (type, id))`,
    );
    await database.exec(`CREATE TABLE record_campaigns (type TEXT, id TEXT, campaign_id TEXT)`);
    await database.exec(`CREATE TABLE sync_state (campaign_id TEXT PRIMARY KEY, server_time TEXT)`);
    await database.exec(`INSERT INTO records VALUES ('npcs', 'old', 'C', '{}')`);
    await database.exec(`PRAGMA user_version = 2`);

    const upgraded = await createSqlDeviceStore(database.exec);

    expect(await upgraded.getRecord("npcs", "old")).toBeUndefined();
    const tables = (await database.exec(`SELECT name FROM sqlite_master WHERE type = 'table'`)).map((r) => r.name);
    expect(tables).not.toContain("record_campaigns");
    expect(tables).toContain("record_roots");
    await upgraded.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt: null });
    await upgraded.setSyncState("C", { serverTime: null, locked: false, lockedFrom: null });
    expect((await upgraded.listRecords({ type: "npcs", rootId: "C" })).map((r) => r.id)).toEqual(["n1"]);
    expect((await database.exec(`PRAGMA user_version`))[0].user_version).toBe(DEVICE_STORE_SCHEMA_VERSION);
  });

  it("transaction rolls back on throw", async () => {
    await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1"), updatedAt: null });

    await expect(
      store.transaction(async (tx) => {
        await tx.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: npc("n2"), updatedAt: null });
        await tx.deleteRecord("npcs", "n1");
        await tx.enqueue({ rootId: "C", method: "DELETE", path: "npcs/n1", base: npc("n1") });
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(await store.getRecord("npcs", "n1")).toBeDefined();
    expect(await store.getRecord("npcs", "n2")).toBeUndefined();
    expect(await store.queue()).toEqual([]);

    const result = await store.transaction(async (tx) => {
      await tx.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: npc("n2"), updatedAt: null });
      return "done";
    });
    expect(result).toBe("done");
    expect(await store.getRecord("npcs", "n2")).toBeDefined();
  });

  it("isRootLocked is true when locked, or when lockedFrom is before now", () => {
    const now = new Date("2026-11-01T12:00:00.000Z");
    expect(isRootLocked({ locked: true, lockedFrom: null }, now)).toBe(true);
    expect(isRootLocked({ locked: false, lockedFrom: null }, now)).toBe(false);
    expect(isRootLocked({ locked: false, lockedFrom: new Date("2026-11-01T11:59:59.000Z") }, now)).toBe(true);
    expect(isRootLocked({ locked: false, lockedFrom: new Date("2026-11-02T00:00:00.000Z") }, now)).toBe(false);
  });
});
