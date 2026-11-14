import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGenericRoutes, linksOfKind, listAnswer } from "../generic-answers";
import { matchRoute } from "../router";
import { setOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import type { OfflineAnswer, OfflineConfig, OfflineLocalWriteContext, OfflineMethod } from "../types";
import { bookConfig, npc, offlineConfig, page, seededStore } from "./offline-fixtures";

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

  describe("sort (JSON:API, with ranks)", () => {
    const RANKS = { importance: ["primary", "recurring", "minor"] } as const;

    const ranked = (id: string, attributes: Record<string, unknown>) => ({
      type: "npcs",
      id,
      rootId: "C",
      resource: {
        type: "npcs",
        id,
        attributes,
        relationships: { root: { data: { type: "roots", id: "C" } } },
      },
      updatedAt: null,
    });

    const records = () => [
      ranked("m1", { name: "Minor", importance: "minor", updatedAt: "2026-01-05T00:00:00.000Z" }),
      ranked("u1", { name: "Unset", updatedAt: "2026-01-09T00:00:00.000Z" }),
      ranked("r-old", { name: "Old", importance: "recurring", updatedAt: "2026-01-01T00:00:00.000Z" }),
      ranked("p1", { name: "Prime", importance: "primary", updatedAt: "2026-01-02T00:00:00.000Z" }),
      ranked("r-new", { name: "New", importance: "recurring", updatedAt: "2026-01-03T00:00:00.000Z" }),
    ];

    const sortedIds = async (query: string, options: Parameters<typeof listAnswer>[2] = { sortRanks: RANKS }) => {
      const result = await listAnswer(
        { request: { method: "GET", path: "x", query: new URLSearchParams(query) }, params: {}, store },
        records(),
        options,
      );
      return result;
    };

    it("orders a rank field by its tuple, unset last, then the next key", async () => {
      const result = await sortedIds("sort=importance,-updatedAt&fetchAll=true");

      expect(result.body.data.map((r: any) => r.id)).toEqual(["p1", "r-new", "r-old", "m1", "u1"]);
    });

    it("a descending rank puts unset first, then minor, recurring, primary", async () => {
      const result = await sortedIds("sort=-importance,-updatedAt&fetchAll=true");

      expect(result.body.data.map((r: any) => r.id)).toEqual(["u1", "m1", "r-new", "r-old", "p1"]);
    });

    it("sorts text case-insensitively A to Z, ties by id ascending", async () => {
      const list = [ranked("b", { name: "Bram" }), ranked("a2", { name: "alba" }), ranked("a1", { name: "Alba" })];
      const result = await listAnswer(
        {
          request: { method: "GET", path: "x", query: new URLSearchParams("sort=name&fetchAll=true") },
          params: {},
          store,
        },
        list,
      );

      expect(result.body.data.map((r: any) => r.id)).toEqual(["a1", "a2", "b"]);
    });

    it("a descending text sort reverses it, a record with no name first", async () => {
      const list = [ranked("b", { name: "Bram" }), ranked("n", {}), ranked("a", { name: "alba" })];
      const result = await listAnswer(
        {
          request: { method: "GET", path: "x", query: new URLSearchParams("sort=-name&fetchAll=true") },
          params: {},
          store,
        },
        list,
      );

      expect(result.body.data.map((r: any) => r.id)).toEqual(["n", "b", "a"]);
    });

    it("a sort key that is not an identifier answers 400 Invalid sort", async () => {
      const result = await sortedIds("sort=-bad%20field&fetchAll=true");

      expect(result.status).toBe(400);
      expect(result.body.errors[0].detail).toBe("Invalid sort");
    });

    it("with sortFields, a sort on any other field answers 400 Invalid sort", async () => {
      const options = { sortRanks: RANKS, sortFields: ["name", "importance"] };

      const refused = await sortedIds("sort=description&fetchAll=true", options);
      const accepted = await sortedIds("sort=-name&fetchAll=true", options);
      const anyField = await sortedIds("sort=description&fetchAll=true");

      expect(refused.status).toBe(400);
      expect(refused.body.errors[0].detail).toBe("Invalid sort");
      expect(accepted.status).toBe(200);
      expect(accepted.body.data.map((r: any) => r.id)).toEqual(["u1", "p1", "r-old", "r-new", "m1"]);
      expect(anyField.status).toBe(200);
    });

    it("an invalid orderBy with no sort still answers 400 Invalid orderBy", async () => {
      const result = await sortedIds("orderBy=-name&fetchAll=true");

      expect(result.status).toBe(400);
      expect(result.body.errors[0].detail).toBe("Invalid orderBy");
    });

    it("the generic root list honours OfflineTypeConfig.sortRanks", async () => {
      const config = offlineConfig();
      config.types = config.types.map((type) =>
        type.module.name === "npcs" ? { ...type, sortRanks: { importance: ["primary", "recurring", "minor"] } } : type,
      );
      await store.putRecord(ranked("n1", { name: "Alda", importance: "minor" }));
      await store.putRecord(ranked("n2", { name: "brom", importance: "primary" }));

      const result = await answer(store, "GET", "roots/C/npcs?sort=importance&fetchAll=true", undefined, config);

      expect(result.body.data.map((r: any) => r.id)).toEqual(["n2", "n1"]);
    });
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

  describe("extra root kinds", () => {
    it("POST of an extra-kind root type roots the record at its own id", async () => {
      const body = { data: { type: "books", id: "b9", attributes: { name: "Book" } } };

      const result = await answer(store, "POST", "books", body, bookConfig());

      expect(result.status).toBe(201);
      expect(await store.getRecord("books", "b9")).toMatchObject({ rootId: "b9", localOnly: true });
      const [entry] = await store.queue();
      expect(entry).toMatchObject({ rootId: "b9", method: "POST", path: "books" });
    });

    it("POST of a child with a relationship to an extra-kind root roots it there", async () => {
      const body = { data: page("p9", "Page", "b9") };

      const result = await answer(store, "POST", "pages", body, bookConfig());

      expect(result.status).toBe(201);
      expect(await store.getRecord("pages", "p9")).toMatchObject({ rootId: "b9" });
      const [entry] = await store.queue();
      expect(entry).toMatchObject({ rootId: "b9", method: "POST", path: "pages" });
    });

    it("GET {extraModule}/:rootId/{type} lists the root's records", async () => {
      await store.putRecord({
        type: "books",
        id: "b1",
        rootId: "b1",
        resource: { type: "books", id: "b1", attributes: { name: "Book" } },
        updatedAt: null,
      });
      await store.putRecord({
        type: "pages",
        id: "p1",
        rootId: "b1",
        resource: page("p1", "One", "b1"),
        updatedAt: null,
      });
      await store.putRecord({
        type: "pages",
        id: "p2",
        rootId: "b2",
        resource: page("p2", "Two", "b2"),
        updatedAt: null,
      });

      const result = await answer(store, "GET", "books/b1/pages?fetchAll=true", undefined, bookConfig());
      const missing = await answer(store, "GET", "books/b2/pages", undefined, bookConfig());

      expect(result.status).toBe(200);
      expect(result.body.data.map((resource: any) => resource.id)).toEqual(["p1"]);
      expect(missing.status).toBe(503);
    });
  });

  describe("afterLocalWrite", () => {
    const hookConfig = (hook: (ctx: OfflineLocalWriteContext) => Promise<void>): OfflineConfig => {
      const config = offlineConfig();
      return {
        ...config,
        types: config.types.map((typeConfig) =>
          typeConfig.module.name === "npcs" ? { ...typeConfig, afterLocalWrite: hook } : typeConfig,
        ),
      };
    };

    it("afterLocalWrite runs in the write's transaction with method, resource and previous", async () => {
      const seen: any[] = [];
      const hook = vi.fn(async (ctx: OfflineLocalWriteContext) => {
        seen.push({
          method: ctx.method,
          module: ctx.module.name,
          id: ctx.id,
          resource: ctx.resource,
          previous: ctx.previous,
          stored: (await ctx.store.getRecord("npcs", ctx.id))?.resource ?? null,
          queued: (await ctx.store.queue()).length,
        });
      });
      const config = hookConfig(hook);

      await answer(store, "POST", "npcs", { data: npc("n9", "New", "C") }, config);
      await answer(
        store,
        "PUT",
        "npcs/n1",
        { data: { type: "npcs", id: "n1", attributes: { name: "Alda II" } } },
        config,
      );
      await answer(store, "DELETE", "npcs/n2", undefined, config);

      const alda2 = { ...npc("n1", "Alda", "C"), attributes: { name: "Alda II", description: "Alda text" } };
      expect(seen).toEqual([
        {
          method: "POST",
          module: "npcs",
          id: "n9",
          resource: npc("n9", "New", "C"),
          previous: null,
          stored: npc("n9", "New", "C"),
          queued: 1,
        },
        {
          method: "PUT",
          module: "npcs",
          id: "n1",
          resource: alda2,
          previous: npc("n1", "Alda", "C"),
          stored: alda2,
          queued: 2,
        },
        {
          method: "DELETE",
          module: "npcs",
          id: "n2",
          resource: null,
          previous: npc("n2", "brom", "C"),
          stored: null,
          queued: 3,
        },
      ]);
    });

    it("a hook that throws rolls back the write and the enqueue", async () => {
      const config = hookConfig(async () => {
        throw new Error("hook failed");
      });

      await expect(answer(store, "POST", "npcs", { data: npc("n9", "New", "C") }, config)).rejects.toThrow(
        "hook failed",
      );
      await expect(
        answer(store, "PUT", "npcs/n1", { data: { type: "npcs", id: "n1", attributes: { name: "X" } } }, config),
      ).rejects.toThrow("hook failed");
      await expect(answer(store, "DELETE", "npcs/n2", undefined, config)).rejects.toThrow("hook failed");

      expect(await store.getRecord("npcs", "n9")).toBeUndefined();
      expect((await store.getRecord("npcs", "n1"))?.resource).toEqual(npc("n1", "Alda", "C"));
      expect(await store.getRecord("npcs", "n2")).toBeDefined();
      expect(await store.queue()).toEqual([]);
    });
  });
});
