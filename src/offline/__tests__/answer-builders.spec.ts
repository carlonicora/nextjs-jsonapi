import { beforeEach, describe, expect, it } from "vitest";
import * as offline from "../index";
import {
  errorAnswer,
  mergeResource,
  orderedListAnswer,
  resourceFromDocument,
  resourceListAnswer,
  singleAnswer,
} from "../generic-answers";
import type { DeviceStore } from "../store/DeviceStore";
import { configureOffline, resetOfflineConfig } from "../config";
import { offlineConfig, seededStore } from "./offline-fixtures";

describe("answer builders", () => {
  let store: DeviceStore;

  beforeEach(async () => {
    store = await seededStore();
  });

  it("the ./offline entry exports the builders an app's custom answers use", () => {
    for (const builder of [
      singleAnswer,
      errorAnswer,
      orderedListAnswer,
      resourceListAnswer,
      mergeResource,
      resourceFromDocument,
    ]) {
      expect(typeof builder).toBe("function");
    }
    expect(offline.singleAnswer).toBe(singleAnswer);
    expect(offline.errorAnswer).toBe(errorAnswer);
    expect(offline.orderedListAnswer).toBe(orderedListAnswer);
    expect(offline.resourceListAnswer).toBe(resourceListAnswer);
    expect(offline.mergeResource).toBe(mergeResource);
    expect(offline.resourceFromDocument).toBe(resourceFromDocument);
  });

  it("errorAnswer answers a JSON:API errors document with that status", () => {
    expect(errorAnswer(409, "Conflict", "Already taken")).toEqual({
      status: 409,
      body: { errors: [{ status: "409", title: "Conflict", detail: "Already taken" }] },
    });
  });

  it("singleAnswer answers the stored resource with its included records", async () => {
    const record = (await store.getRecord("npcs", "n1"))!;
    const result = await singleAnswer(store, record, 201);
    expect(result.status).toBe(201);
    expect(result.body.data).toEqual(record.resource);
    expect(Array.isArray(result.body.included)).toBe(true);
  });

  it("included records keep their relationships whole: a root record keeps its owner even when the owner is also linked to the record", async () => {
    const put = (type: string, id: string, relationships: Record<string, any>) =>
      store.putRecord({
        type,
        id,
        rootId: "C",
        resource: { type, id, attributes: {}, relationships },
        updatedAt: null,
      });
    // The npc points at its root record and at the user; the root record points back at the npc and at the user.
    await put("npcs", "cy-npc", {
      root: { data: { type: "roots", id: "cy-camp" } },
      author: { data: { type: "users", id: "cy-user" } },
    });
    await put("roots", "cy-camp", {
      owner: { data: { type: "users", id: "cy-user" } },
      npcs: { data: [{ type: "npcs", id: "cy-npc" }] },
    });
    await put("users", "cy-user", { company: { data: { type: "companies", id: "cy-co" } } });
    await put("companies", "cy-co", { owner: { data: { type: "users", id: "cy-user" } } });

    const record = (await store.getRecord("npcs", "cy-npc"))!;
    const included = (await singleAnswer(store, record)).body.included as any[];
    const byKey = new Map(included.map((resource) => [`${resource.type}:${resource.id}`, resource]));

    expect(byKey.get("roots:cy-camp").relationships.owner.data).toEqual({ type: "users", id: "cy-user" });
    expect(byKey.get("roots:cy-camp").relationships.npcs.data).toEqual([{ type: "npcs", id: "cy-npc" }]);
    expect(byKey.get("companies:cy-co").relationships.owner.data).toEqual({ type: "users", id: "cy-user" });
  });

  it("a relationship to the signed-in user (a root record's owner) resolves from the stored sign-in, though users are not on the device", async () => {
    configureOffline(offlineConfig());
    localStorage.setItem(
      "user",
      JSON.stringify({
        jsonApi: {
          type: "users",
          id: "u1",
          attributes: { name: "Carlo" },
          relationships: { company: { data: { type: "companies", id: "co" } } },
        },
      }),
    );
    try {
      await store.putRecord({
        type: "roots",
        id: "own-camp",
        rootId: "own-camp",
        resource: {
          type: "roots",
          id: "own-camp",
          attributes: {},
          relationships: { owner: { data: { type: "users", id: "u1" } } },
        },
        updatedAt: null,
      });
      await store.putRecord({
        type: "npcs",
        id: "own-npc",
        rootId: "own-camp",
        resource: {
          type: "npcs",
          id: "own-npc",
          attributes: {},
          relationships: { root: { data: { type: "roots", id: "own-camp" } } },
        },
        updatedAt: null,
      });

      const included = (await singleAnswer(store, (await store.getRecord("npcs", "own-npc"))!)).body.included as any[];
      const owner = included.find((resource) => resource.type === "users");
      // Only the signed-in user, with no relationships of its own.
      expect(owner).toEqual({ type: "users", id: "u1", attributes: { name: "Carlo" }, meta: undefined });
    } finally {
      localStorage.removeItem("user");
      resetOfflineConfig();
    }
  });

  it("orderedListAnswer answers the records in the given order, in one page", async () => {
    const records = await store.listRecords({ type: "npcs" });
    const reversed = [...records].reverse();
    const result = await orderedListAnswer(store, reversed);
    expect(result.status).toBe(200);
    expect(result.body.data.map((resource: { id: string }) => resource.id)).toEqual(
      reversed.map((record) => record.id),
    );
    expect(result.body.meta).toEqual({ total: reversed.length });
  });

  it("resourceListAnswer answers resources the device computed, as they are, with nothing included", () => {
    const resources = [{ type: "searches", id: "a", attributes: { name: "A" } }];
    expect(resourceListAnswer(resources)).toEqual({ status: 200, body: { data: resources, included: [] } });
  });

  it("mergeResource writes a document's attributes, relationships and meta over the resource", () => {
    const before = {
      type: "npcs",
      id: "n1",
      attributes: { name: "Old", age: 3 },
      relationships: { faction: { data: { type: "factions", id: "f1" } } },
      meta: { a: 1 },
    };
    expect(mergeResource(before, { type: "npcs", id: "n1" }, { attributes: { name: "New" }, meta: { b: 2 } })).toEqual({
      type: "npcs",
      id: "n1",
      attributes: { name: "New", age: 3 },
      relationships: { faction: { data: { type: "factions", id: "f1" } } },
      meta: { a: 1, b: 2 },
    });
  });

  it("resourceFromDocument keeps the document's attributes, relationships and meta under the given identity", () => {
    expect(
      resourceFromDocument(
        { data: { type: "npcs", id: "x", attributes: { name: "A" }, meta: { m: 1 } } },
        { type: "npcs", id: "n9" },
      ),
    ).toEqual({ type: "npcs", id: "n9", attributes: { name: "A" }, meta: { m: 1 } });
  });
});
