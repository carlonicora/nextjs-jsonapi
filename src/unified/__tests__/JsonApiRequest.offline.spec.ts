import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClientJsonApiGet, configureClientJsonApi } from "../../client/JsonApiClient";
import { ClientAbstractService } from "../../core/abstracts/ClientAbstractService";
import { DataClassRegistry } from "../../core/registry/DataClassRegistry";
import { resetOfflineConfig, setDeviceStoreOpener } from "../../offline/config";
import {
  allowWhileReconnecting,
  getOfflineState,
  isReconnecting,
  resetOfflineState,
  setOfflineState,
  setReconnecting,
} from "../../offline/state";
import type { DeviceStore } from "../../offline/store/DeviceStore";
import { OFFLINE_REPLAY_HEADER } from "../../offline/types";
import {
  Factions,
  Npcs,
  TestModel,
  npc,
  setUpOffline,
  tearDownOffline,
} from "../../offline/__tests__/offline-fixtures";
import { configureJsonApi, JsonApiDelete, JsonApiGet, JsonApiPatch } from "../JsonApiRequest";

const API = "http://api.test/";

function jsonResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, statusText: "", json: async () => body };
}

class TestService extends ClientAbstractService {}

describe("the offline layer in the request path", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let store: DeviceStore;

  beforeEach(() => {
    DataClassRegistry.registerObjectClass(Npcs, TestModel as any);
    DataClassRegistry.registerObjectClass(Factions, TestModel as any);
    configureJsonApi({ apiUrl: API });
    configureClientJsonApi({ apiUrl: API });
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    tearDownOffline();
    vi.unstubAllGlobals();
  });

  it("not configured → directFetch exactly as today, no store opened", async () => {
    resetOfflineConfig();
    resetOfflineState();
    const opener = vi.fn();
    setDeviceStoreOpener(opener);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: npc("n1", "Server", "C") }));
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: npc("n1", "Server", "C") }));

    const read = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });
    const unreachable = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });
    await JsonApiPatch({
      classKey: Npcs,
      endpoint: "npcs/n1",
      body: { data: {} },
      overridesJsonApiCreation: true,
      language: "en",
    });

    expect((read.data as any).name).toBe("Server");
    expect(unreachable.response).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(opener).not.toHaveBeenCalled();
    expect(getOfflineState().online).toBe(true);
  });

  it("configured and online, GET → server answer, nothing stored", async () => {
    store = await setUpOffline();
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: npc("n1", "Server", "C") }));

    const response = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });

    expect((response.data as any).name).toBe("Server");
    expect((await store.getRecord("npcs", "n1"))?.resource.attributes.name).toBe("Alda");
  });

  it("configured and online, a successful PATCH writes the response resource and included to the store", async () => {
    store = await setUpOffline();
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        data: {
          ...npc("n1", "Alda online", "C"),
          attributes: { name: "Alda online", updatedAt: "2026-11-01T10:00:00.000Z" },
        },
        included: [
          {
            type: "factions",
            id: "f2",
            attributes: { name: "New guild" },
            relationships: { root: { data: { type: "roots", id: "C" } } },
          },
        ],
      }),
    );

    await JsonApiPatch({
      classKey: Npcs,
      endpoint: "npcs/n1",
      body: { data: {} },
      overridesJsonApiCreation: true,
      language: "en",
    });

    const stored = await store.getRecord("npcs", "n1");
    expect(stored?.resource.attributes).toEqual({
      name: "Alda online",
      description: "Alda text",
      updatedAt: "2026-11-01T10:00:00.000Z",
    });
    expect(stored?.updatedAt).toEqual(new Date("2026-11-01T10:00:00.000Z"));
    expect((await store.getRecord("factions", "f2"))?.rootId).toBe("C");
    expect(await store.queue()).toEqual([]);
  });

  it("configured and online, a successful POST stores the new record; a DELETE removes it", async () => {
    store = await setUpOffline();
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { data: npc("n7", "Created", "C") }));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
      statusText: "",
      json: async () => {
        throw new Error("empty");
      },
    });

    await TestService["callApi"]({
      type: Npcs,
      method: "POST" as any,
      endpoint: "npcs",
      input: { data: {} },
      overridesJsonApiCreation: true,
    });
    expect((await store.getRecord("npcs", "n7"))?.rootId).toBe("C");

    await JsonApiDelete({ classKey: Npcs, endpoint: "npcs/n7", language: "en" });
    expect(await store.getRecord("npcs", "n7")).toBeUndefined();
  });

  it("configured, network error → state.online becomes false and the same request is answered locally", async () => {
    store = await setUpOffline();
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const response = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });

    expect(getOfflineState().online).toBe(false);
    expect(response.ok).toBe(true);
    expect((response.data as any).name).toBe("Alda");

    const next = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n2", language: "en" });
    expect((next.data as any).name).toBe("brom");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("during a reconnect attempt (offline), GETs and the let-through write go to the network, any other write stays local; a network error ends the attempt", async () => {
    store = await setUpOffline();
    setOfflineState({ online: false });
    setReconnecting(true);
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: npc("n1", "Server", "C") }));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { data: npc("n1", "Sent", "C") }));

    const read = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });
    expect((read.data as any).name).toBe("Server");

    const release = allowWhileReconnecting(`${API}npcs/n1`);
    await JsonApiPatch({
      classKey: Npcs,
      endpoint: "npcs/n1",
      body: { data: npc("n1", "Sent", "C") },
      overridesJsonApiCreation: true,
      language: "en",
    });
    release();
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await JsonApiPatch({
      classKey: Npcs,
      endpoint: "npcs/n2",
      body: { data: npc("n2", "Local", "C") },
      overridesJsonApiCreation: true,
      language: "en",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getOfflineState().online).toBe(false);

    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const failed = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });
    expect(failed.ok).toBe(true);
    expect(isReconnecting()).toBe(false);
  });

  it("a request carrying x-offline-replay is never answered locally", async () => {
    store = await setUpOffline();
    setOfflineState({ online: false });
    configureJsonApi({ apiUrl: API, additionalHeaders: { [OFFLINE_REPLAY_HEADER]: "1" } });
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const response = await JsonApiGet({ classKey: Npcs, endpoint: "npcs/n1", language: "en" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(response.response).toBe(503);
    expect(response.ok).toBe(false);
  });

  it("ClientAbstractService.next/previous and ClientJsonApiGet are answered locally when offline", async () => {
    store = await setUpOffline();
    setOfflineState({ online: false });

    const first = await ClientJsonApiGet({
      classKey: Npcs,
      endpoint: "roots/C/npcs?orderBy=name&page[size]=1",
      language: "en",
    });
    expect((first.data as any[]).map((item) => item.name)).toEqual(["Alda"]);
    expect(first.next).toBe(`${API}roots/C/npcs?orderBy=name&page[size]=1&page[offset]=1`);

    const nextRef: { next?: string } = {};
    const previousRef: { previous?: string } = {};
    const page2 = await TestService.next<any[]>({
      type: Npcs,
      endpoint: first.next!,
      next: nextRef,
      previous: previousRef,
    });
    expect(page2.map((item) => item.name)).toEqual(["brom"]);
    expect(previousRef.previous).toBe(`${API}roots/C/npcs?orderBy=name&page[size]=1&page[offset]=0`);

    const page1 = await TestService.previous<any[]>({ type: Npcs, endpoint: previousRef.previous! });
    expect(page1.map((item) => item.name)).toEqual(["Alda"]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
