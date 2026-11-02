import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildGenericRoutes, linksOfKind, listAnswer } from "../generic-answers";
import { matchRoute } from "../router";
import { setOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import type { OfflineAnswer, OfflineConfig, OfflineMethod } from "../types";
import { npc, offlineConfig, seededStore } from "./offline-fixtures";

const API = "http://api.test/";

async function answer(
  store: DeviceStore,
  method: OfflineMethod,
  relative: string,
  body?: any,
  config: OfflineConfig = offlineConfig(),
): Promise<OfflineAnswer> {
  const [path, query = ""] = relative.split("?");
  const match = matchRoute(buildGenericRoutes(config), method, path);
  if (!match) throw new Error(`no generic route for ${method} ${path}`);
  return match.route.answer({
    request: { method, path, query: new URLSearchParams(query), body, url: `${API}${relative}` },
    params: match.params,
    store,
  });
}

describe("generic answers", () => {
  let store: DeviceStore;

  beforeEach(async () => {
    store = await seededStore();
  });

  afterEach(() => {
    setOfflineState({ lockedRootIds: [] });
  });

  it("GET npcs/:id answers the resource with the linked resources as included", async () => {
    const result = await answer(store, "GET", "npcs/n1");

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual(npc("n1", "Alda", "C"));
    expect(result.body.included).toEqual([
      { type: "factions", id: "f1", attributes: { name: "Guild" } },
      { type: "roots", id: "C", attributes: { name: "Camp C" } },
    ]);
  });

  it("included also follows the relationships of the record and of its included records to stored records (the root record, then its owner)", async () => {
    await store.putRecord({
      type: "roots",
      id: "C",
      rootId: "C",
      resource: {
        type: "roots",
        id: "C",
        attributes: { name: "Camp C" },
        relationships: { owner: { data: { type: "users", id: "u1" } } },
      },
      updatedAt: null,
    });
    await store.putRecord({
      type: "users",
      id: "u1",
      rootId: "C",
      resource: { type: "users", id: "u1", attributes: { name: "The GM" } },
      updatedAt: null,
    });

    const result = await answer(store, "GET", "npcs/n1");

    expect(
      result.body.included.map((resource: { type: string; id: string }) => `${resource.type}:${resource.id}`),
    ).toEqual(["factions:f1", "roots:C", "users:u1"]);
  });

  it("GET npcs/:id of a record not on the device (or a literal endpoint with no answer) needs a connection", async () => {
    for (const relative of ["npcs/missing", "npcs/playing"]) {
      const result = await answer(store, "GET", relative);
      expect(result.status).toBe(503);
      expect(result.body.errors[0].code).toBe("needs-connection");
    }
  });

  it("a list of a root record or parent that is not on the device needs a connection", async () => {
    for (const relative of ["roots/X/npcs?fetchAll=true", "factions/missing/npcs?fetchAll=true"]) {
      const result = await answer(store, "GET", relative);
      expect(result.status).toBe(503);
      expect(result.body.errors[0].code).toBe("needs-connection");
    }
  });

  it("a stored parent with no linked records answers 200 with an empty list", async () => {
    const result = await answer(store, "GET", "npcs/n2/factions?fetchAll=true");

    expect(result.status).toBe(200);
    expect(result.body.data).toEqual([]);
  });

  it("GET roots/C/npcs lists only C's NPCs", async () => {
    const result = await answer(store, "GET", "roots/C/npcs?fetchAll=true");

    expect(result.body.data.map((r: any) => r.id).sort()).toEqual(["n1", "n2"]);
    expect(result.body.links).toEqual({ self: `${API}roots/C/npcs?fetchAll=true` });
  });

  it("honours search like the server's fulltext index: every token, case-insensitive, in any string attribute", async () => {
    const byName = await answer(store, "GET", "roots/C/npcs?fetchAll=true&search=BRO");
    const acrossFields = await answer(store, "GET", "roots/C/npcs?fetchAll=true&search=brom%20TEXT");
    const noMatch = await answer(store, "GET", "roots/C/npcs?fetchAll=true&search=brom%20guild");

    expect(byName.body.data.map((r: any) => r.id)).toEqual(["n2"]);
    expect(acrossFields.body.data.map((r: any) => r.id)).toEqual(["n2"]);
    expect(noMatch.body.data).toEqual([]);
  });

  it("honours orderBy as the server reads it: `field` or `field ASC|DESC`", async () => {
    const ascending = await answer(store, "GET", "roots/C/npcs?fetchAll=true&orderBy=name");
    const descending = await answer(store, "GET", "roots/C/npcs?fetchAll=true&orderBy=name%20DESC");
    const explicitAsc = await answer(store, "GET", "roots/C/npcs?fetchAll=true&orderBy=name%20asc");

    expect(ascending.body.data.map((r: any) => r.id)).toEqual(["n1", "n2"]);
    expect(descending.body.data.map((r: any) => r.id)).toEqual(["n2", "n1"]);
    expect(explicitAsc.body.data.map((r: any) => r.id)).toEqual(["n1", "n2"]);
  });

  it("an orderBy the server refuses (`-name`) answers 400 like the server", async () => {
    expect((await answer(store, "GET", "roots/C/npcs?fetchAll=true&orderBy=-name")).status).toBe(400);
  });

  it("with no orderBy, lists in the server's default order (updatedAt DESC)", async () => {
    const older = { ...npc("n1", "Alda", "C"), attributes: { name: "Alda", updatedAt: "2026-01-01T00:00:00.000Z" } };
    const newer = { ...npc("n2", "brom", "C"), attributes: { name: "brom", updatedAt: "2026-02-01T00:00:00.000Z" } };
    await store.putRecord({
      type: "npcs",
      id: "n1",
      rootId: "C",
      resource: older,
      updatedAt: new Date("2026-01-01"),
    });
    await store.putRecord({
      type: "npcs",
      id: "n2",
      rootId: "C",
      resource: newer,
      updatedAt: new Date("2026-02-01"),
    });

    const result = await answer(store, "GET", "roots/C/npcs?fetchAll=true");

    expect(result.body.data.map((r: any) => r.id)).toEqual(["n2", "n1"]);
  });

  it("listAnswer pages, searches and orders any set of stored records for app answers", async () => {
    const records = await store.listRecords({ type: "npcs", rootId: "C" });

    const result = await listAnswer(
      {
        request: { method: "GET", path: "x", query: new URLSearchParams("orderBy=name%20DESC&page[size]=1") },
        params: {},
        store,
      },
      records,
    );

    expect(result.body.data.map((r: any) => r.id)).toEqual(["n2"]);
    expect(result.body.meta.total).toBe(2);
  });

  it("pages with page[size]/page[offset] and links shaped like the server's", async () => {
    const first = await answer(store, "GET", "roots/C/npcs?orderBy=name&page[size]=1");

    expect(first.body.data.map((r: any) => r.id)).toEqual(["n1"]);
    expect(first.body.links.self).toBe(`${API}roots/C/npcs?orderBy=name&page[size]=1`);
    expect(first.body.links.next).toBe(`${API}roots/C/npcs?orderBy=name&page[size]=1&page[offset]=1`);
    expect(first.body.links.prev).toBeUndefined();

    const second = await answer(store, "GET", "roots/C/npcs?orderBy=name&page[size]=1&page[offset]=1");

    expect(second.body.data.map((r: any) => r.id)).toEqual(["n2"]);
    expect(second.body.links.next).toBeUndefined();
    expect(second.body.links.prev).toBe(`${API}roots/C/npcs?orderBy=name&page[size]=1&page[offset]=0`);
  });

  it("GET factions/:id/npcs and npcs/:id/factions answer records linked in either direction", async () => {
    const npcs = await answer(store, "GET", "factions/f1/npcs?fetchAll=true");
    const factions = await answer(store, "GET", "npcs/n1/factions?fetchAll=true");

    expect(npcs.body.data.map((r: any) => r.id)).toEqual(["n1"]);
    expect(factions.body.data.map((r: any) => r.id)).toEqual(["f1"]);
  });

  it("POST npcs stores a local-only record, queues the body with base null and answers 201", async () => {
    const body = { data: npc("n9", "New", "C") };

    const result = await answer(store, "POST", "npcs", body);

    expect(result.status).toBe(201);
    expect(result.body.data).toEqual(npc("n9", "New", "C"));
    expect(result.body.included).toEqual([{ type: "roots", id: "C", attributes: { name: "Camp C" } }]);
    const stored = await store.getRecord("npcs", "n9");
    expect(stored).toMatchObject({ rootId: "C", localOnly: true, base: null });
    const [entry] = await store.queue();
    expect(entry).toMatchObject({ rootId: "C", method: "POST", path: "npcs", body, base: null, status: "pending" });
  });

  it.each(["PATCH", "PUT"] as const)(
    "%s npcs/:id applies the body, sets base once and queues the body untouched",
    async (method) => {
      const body = { data: { type: "npcs", id: "n1", attributes: { name: "Alda the Bold" } } };

      const result = await answer(store, method, "npcs/n1", body);
      await answer(store, method, "npcs/n1", { data: { type: "npcs", id: "n1", attributes: { name: "Alda II" } } });

      expect(result.status).toBe(200);
      expect(result.body.data.attributes).toEqual({ name: "Alda the Bold", description: "Alda text" });
      expect(result.body.included.map((r: any) => `${r.type}:${r.id}`)).toEqual(["factions:f1", "roots:C"]);
      const stored = await store.getRecord("npcs", "n1");
      expect(stored?.resource.attributes.name).toBe("Alda II");
      expect(stored?.base).toEqual(npc("n1", "Alda", "C"));
      const entries = await store.queue();
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({
        method,
        path: "npcs/n1",
        body,
        recordType: "npcs",
        recordId: "n1",
        base: npc("n1", "Alda", "C"),
      });
      expect(entries[1].base).toEqual(npc("n1", "Alda", "C"));
    },
  );

  it("DELETE npcs/:id removes the record and its links, queues it with base and answers 204", async () => {
    const result = await answer(store, "DELETE", "npcs/n1");

    expect(result).toEqual({ status: 204, body: undefined });
    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    expect(await store.linksFrom("f1")).toEqual([]);
    const [entry] = await store.queue();
    expect(entry).toMatchObject({
      method: "DELETE",
      path: "npcs/n1",
      recordType: "npcs",
      recordId: "n1",
      base: npc("n1", "Alda", "C"),
    });
  });

  describe("link kinds", () => {
    const withKinds = (): OfflineConfig => {
      const config = offlineConfig();
      config.types = config.types.map((typeConfig) =>
        typeConfig.module.name === "npcs" ? { ...typeConfig, relationshipKinds: { faction: "MEMBER_OF" } } : typeConfig,
      );
      return config;
    };
    const withFaction = (id: string, name: string, factionIds: string[]) => ({
      ...npc(id, name, "C"),
      relationships: {
        root: { data: { type: "roots", id: "C" } },
        faction: { data: factionIds.map((factionId) => ({ type: "factions", id: factionId })) },
      },
    });

    it("a link written on the device carries the Neo4j type when the type config maps the relationship name", async () => {
      await answer(store, "PATCH", "npcs/n2", { data: withFaction("n2", "brom", ["f1"]) }, withKinds());

      expect((await store.linksFrom("n2")).map((link) => link.kind)).toEqual(["MEMBER_OF"]);
    });

    it("without a mapping the link carries the relationship name", async () => {
      await answer(store, "PATCH", "npcs/n2", { data: withFaction("n2", "brom", ["f1"]) });

      expect((await store.linksFrom("n2")).map((link) => link.kind)).toEqual(["faction"]);
    });

    it("removing a relationship target removes only links of that relationship (name or Neo4j type)", async () => {
      await store.putRecord({
        type: "npcs",
        id: "n1",
        rootId: "C",
        resource: withFaction("n1", "Alda", ["f1"]),
        updatedAt: null,
      });
      await store.putLink({
        fromType: "factions",
        fromId: "f1",
        toType: "npcs",
        toId: "n1",
        kind: "ENEMY_OF",
        props: {},
      });

      await answer(store, "PATCH", "npcs/n1", { data: withFaction("n1", "Alda", []) }, withKinds());

      expect((await store.linksTo("n1")).map((link) => link.kind)).toEqual(["ENEMY_OF"]);
    });

    it("a related list follows only the links of the relationship toward the parent, by name or by Neo4j type", async () => {
      await store.putRecord({
        type: "npcs",
        id: "n1",
        rootId: "C",
        resource: withFaction("n1", "Alda", ["f1"]),
        updatedAt: null,
      });
      await store.putLink({
        fromType: "factions",
        fromId: "f1",
        toType: "npcs",
        toId: "n2",
        kind: "ENEMY_OF",
        props: {},
      });
      await store.putLink({
        fromType: "npcs",
        fromId: "n3",
        toType: "factions",
        toId: "f1",
        kind: "faction",
        props: {},
      });
      await store.putRecord({
        type: "npcs",
        id: "n3",
        rootId: "C",
        resource: npc("n3", "Cora", "C"),
        updatedAt: null,
      });

      const result = await answer(store, "GET", "factions/f1/npcs?fetchAll=true&orderBy=name", undefined, withKinds());

      expect(result.body.data.map((r: any) => r.id)).toEqual(["n1", "n3"]);
    });

    it("linksOfKind answers the links of any of the kinds, in the direction asked", async () => {
      await store.putLink({
        fromType: "npcs",
        fromId: "n1",
        toType: "factions",
        toId: "f1",
        kind: "faction",
        props: {},
      });

      const both = await linksOfKind(store, "n1", ["MEMBER_OF", "faction"], "both");
      const out = await linksOfKind(store, "n1", ["MEMBER_OF", "faction"], "out");

      expect(both.map((link) => link.kind).sort()).toEqual(["MEMBER_OF", "faction"]);
      expect(out.map((link) => link.kind)).toEqual(["faction"]);
    });
  });

  it("a write to a readOnly type answers 503 needs-connection", async () => {
    const result = await answer(store, "PATCH", "characters/ch1", {
      data: { type: "characters", id: "ch1", attributes: { name: "X" } },
    });

    expect(result.status).toBe(503);
    expect(result.body.errors[0].code).toBe("needs-connection");
    expect(await store.queue()).toEqual([]);
  });

  it("a write to a locked root record answers 503 needs-connection", async () => {
    setOfflineState({ lockedRootIds: ["C"] });

    const patch = await answer(store, "PATCH", "npcs/n1", {
      data: { type: "npcs", id: "n1", attributes: { name: "X" } },
    });
    const post = await answer(store, "POST", "npcs", { data: npc("n9", "New", "C") });

    expect(patch.status).toBe(503);
    expect(patch.body.errors[0].code).toBe("needs-connection");
    expect(post.status).toBe(503);
    expect(await store.queue()).toEqual([]);
  });
});
