import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureJsonApi } from "../../unified/JsonApiRequest";
import { localTransport } from "../local-transport";
import { getOfflineState, setOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import { NeedsConnectionError, type OfflineRoute } from "../types";
import { setDeviceStoreOpener } from "../config";
import { bookConfig, Books, Roots, Npcs, setUpOffline, tearDownOffline } from "./offline-fixtures";

const API = "http://api.test/";

const mergeRoute = (answer = vi.fn()): OfflineRoute => ({
  method: "POST",
  pattern: [Npcs, ":id", "merge"],
  answer: answer.mockImplementation(async ({ store, params }) => {
    await store.deleteRecord("npcs", params.id);
    return { status: 200, body: { data: { type: "npcs", id: "n2", attributes: { name: "merged" } } } };
  }),
  queue: true,
});

describe("localTransport", () => {
  let store: DeviceStore;

  beforeEach(() => {
    configureJsonApi({ apiUrl: API });
  });

  afterEach(() => {
    tearDownOffline();
  });

  it("answers a generic GET from the device in the ApiData shape", async () => {
    store = await setUpOffline();

    const response = await localTransport({ method: "GET", url: `${API}npcs/n1` });

    expect(response).toMatchObject({ ok: true, status: 200 });
    expect(response.data.data.id).toBe("n1");
  });

  it("an unknown path answers 503 with errors[0].code needs-connection", async () => {
    store = await setUpOffline();

    const response = await localTransport({ method: "POST", url: `${API}sessions/s1/recap` });

    expect(response).toMatchObject({ ok: false, status: 503 });
    expect(response.data.errors[0].code).toBe("needs-connection");
  });

  it("a device copy that cannot be opened (another tab holds it) answers 503 needs-connection, never 500", async () => {
    store = await setUpOffline();
    setDeviceStoreOpener(async () => {
      throw new Error("Access Handles cannot be created if there is another open Access Handle");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await localTransport({ method: "GET", url: `${API}npcs/n1` });

    expect(response).toMatchObject({ ok: false, status: 503 });
    expect(response.data.errors[0].code).toBe("needs-connection");
    warn.mockRestore();
  });

  it("custom routes win over the generic ones", async () => {
    const custom: OfflineRoute = {
      method: "GET",
      pattern: [Npcs, ":id"],
      answer: async () => ({ status: 200, body: { data: { type: "npcs", id: "custom" } } }),
      queue: false,
    };
    store = await setUpOffline([custom]);

    const response = await localTransport({ method: "GET", url: `${API}npcs/n1` });

    expect(response.data.data.id).toBe("custom");
  });

  it("a queue:true custom route is enqueued after its answer updated the store, with the original method, path and body", async () => {
    const answer = vi.fn();
    store = await setUpOffline([mergeRoute(answer)]);
    const body = { data: { type: "npcs", id: "n2" } };

    const response = await localTransport({ method: "POST", url: `${API}npcs/n1/merge?keep=true`, body });

    expect(response.status).toBe(200);
    expect(answer).toHaveBeenCalledTimes(1);
    expect(await store.getRecord("npcs", "n1")).toBeUndefined();
    const [entry] = await store.queue();
    expect(entry).toMatchObject({ rootId: "C", method: "POST", path: "npcs/n1/merge?keep=true", body });
    expect(getOfflineState().pending).toBe(1);
  });

  it("a queue:true custom route on a locked root record answers needs-connection and runs nothing", async () => {
    const answer = vi.fn();
    store = await setUpOffline([mergeRoute(answer)]);
    setOfflineState({ lockedRootIds: ["C"] });

    const response = await localTransport({ method: "POST", url: `${API}npcs/n1/merge`, body: {} });

    expect(response.status).toBe(503);
    expect(answer).not.toHaveBeenCalled();
    expect(await store.queue()).toEqual([]);
  });

  it("a custom write that is not queued is refused on a locked root record; its GET answers stay allowed", async () => {
    const write = vi.fn(async () => ({ status: 200, body: { data: { type: "npcs", id: "n1" } } }));
    const read = vi.fn(async () => ({ status: 200, body: { data: { type: "npcs", id: "n1" } } }));
    store = await setUpOffline([
      { method: "POST", pattern: [Npcs, ":id", "pin"], answer: write, queue: false },
      { method: "GET", pattern: [Npcs, ":id", "pin"], answer: read, queue: false },
    ]);
    setOfflineState({ lockedRootIds: ["C"] });

    const refused = await localTransport({ method: "POST", url: `${API}npcs/n1/pin`, body: {} });
    const allowed = await localTransport({ method: "GET", url: `${API}npcs/n1/pin` });

    expect(refused.status).toBe(503);
    expect(refused.data.errors[0].code).toBe("needs-connection");
    expect(write).not.toHaveBeenCalled();
    expect(allowed.status).toBe(200);
    expect(read).toHaveBeenCalledTimes(1);
  });

  it("a custom answer that throws NeedsConnectionError answers 503 needs-connection", async () => {
    store = await setUpOffline([
      {
        method: "POST",
        pattern: [Roots, ":id", "sessions", "end"],
        answer: async () => {
          throw new NeedsConnectionError();
        },
        queue: false,
      },
    ]);

    const response = await localTransport({ method: "POST", url: `${API}roots/C/sessions/end` });

    expect(response.status).toBe(503);
    expect(response.data.errors[0].code).toBe("needs-connection");
  });

  it("a file upload needs a connection", async () => {
    store = await setUpOffline();

    const response = await localTransport({ method: "POST", url: `${API}npcs`, body: {}, files: new Blob(["x"]) });

    expect(response.data.errors[0].code).toBe("needs-connection");
  });

  it("a queued custom write under an extra-kind module segment takes that root", async () => {
    const answer = vi.fn(async () => ({ status: 200, body: { data: { type: "books", id: "b7" } } }));
    store = await setUpOffline(
      [{ method: "POST", pattern: [Books, ":bookId", "reorder"], answer, queue: true }],
      bookConfig,
    );

    const response = await localTransport({ method: "POST", url: `${API}books/b7/reorder`, body: {} });

    expect(response.status).toBe(200);
    const [entry] = await store.queue();
    expect(entry).toMatchObject({ rootId: "b7", method: "POST", path: "books/b7/reorder" });
  });
});
