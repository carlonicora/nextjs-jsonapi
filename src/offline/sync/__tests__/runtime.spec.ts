import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOfflineState, isReconnecting, setOfflineState } from "../../state";
import { markOfflineUnavailable, OfflineUnavailableError } from "../../config";
import type { DeviceStore } from "../../store/DeviceStore";
import { setUpSync, tearDownSync } from "./sync-fixtures";

const { drainQueue, syncAll } = vi.hoisted(() => ({ drainQueue: vi.fn(), syncAll: vi.fn() }));
vi.mock("../drain-queue", () => ({ drainQueue }));
vi.mock("../sync-root", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../sync-root")>()),
  syncAll,
}));
const { directFetch } = vi.hoisted(() => ({ directFetch: vi.fn() }));
vi.mock("../../../client/request", () => ({ directFetch }));
vi.mock("../../../unified/JsonApiRequest", () => ({
  JsonApiGet: vi.fn(),
  JsonApiPost: vi.fn(),
  getApiUrl: () => "http://api.test/",
  buildUrl: (endpoint: string) => `http://api.test/${endpoint}`,
}));

import { startOfflineRuntime, stopOfflineRuntime } from "../runtime";

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await vi.advanceTimersByTimeAsync(0);
};

describe("startOfflineRuntime", () => {
  let store: DeviceStore;
  let stop: (() => void) | undefined;

  beforeEach(async () => {
    store = await setUpSync({ syncIntervalMs: 300000 });
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "setTimeout", "clearTimeout", "Date"] });
    vi.setSystemTime(new Date("2026-11-01T10:00:00.000Z"));
    drainQueue.mockReset();
    drainQueue.mockResolvedValue({ applied: 0, conflicts: 0, stoppedForLogin: false });
    syncAll.mockReset();
    syncAll.mockResolvedValue(undefined);
    directFetch.mockReset();
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    tearDownSync();
  });

  it("on reconnect runs drainQueue then syncAll", async () => {
    setOfflineState({ online: false });
    const order: string[] = [];
    drainQueue.mockImplementation(async () => {
      order.push("drain");
      return { applied: 0, conflicts: 0, stoppedForLogin: false };
    });
    syncAll.mockImplementation(async () => void order.push("sync"));

    stop = startOfflineRuntime();
    await flush();
    expect(order).toEqual([]);

    setOfflineState({ online: true });
    await flush();

    expect(order).toEqual(["drain", "sync"]);
  });

  it("runs syncAll every syncIntervalMs while online", async () => {
    stop = startOfflineRuntime();
    await flush();
    const atStart = syncAll.mock.calls.length;

    await vi.advanceTimersByTimeAsync(300000);
    expect(syncAll.mock.calls.length).toBe(atStart + 1);

    await vi.advanceTimersByTimeAsync(300000);
    expect(syncAll.mock.calls.length).toBe(atStart + 2);
  });

  it("does nothing while offline", async () => {
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: false });

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(900000);

    expect(drainQueue).not.toHaveBeenCalled();
    expect(syncAll).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("recomputes lockedRootIds from the stored sync states on start and every minute", async () => {
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: false });
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
    await store.setSyncState("C", { serverTime: null, locked: true, lockedFrom: null });
    await store.setSyncState("D", {
      serverTime: null,
      locked: false,
      lockedFrom: new Date("2026-11-01T10:00:30.000Z"),
    });

    stop = startOfflineRuntime();
    await flush();
    expect(getOfflineState().lockedRootIds).toEqual(["C"]);

    await vi.advanceTimersByTimeAsync(60000);
    await flush();
    expect([...getOfflineState().lockedRootIds].sort()).toEqual(["C", "D"]);
    vi.unstubAllGlobals();
  });

  it("while offline with the browser online, probes the API with the replay header and, when it answers, runs drainQueue then syncAll and goes online only once the sync succeeded", async () => {
    await store.putRecord({
      type: "roots",
      id: "C",
      rootId: "C",
      resource: { type: "roots", id: "C" },
      updatedAt: null,
    });
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    directFetch.mockResolvedValue({ ok: false, status: 503, statusText: "", data: undefined, networkError: true });

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(directFetch).toHaveBeenCalledTimes(1);
    const params = directFetch.mock.calls[0][0];
    expect(params.method).toBe("GET");
    expect(params.url).toBe("http://api.test/roots/C/sync");
    expect(params.additionalHeaders).toEqual({ "x-offline-replay": "1" });
    expect(getOfflineState().online).toBe(false);
    expect(drainQueue).not.toHaveBeenCalled();

    const order: string[] = [];
    drainQueue.mockImplementation(async () => {
      order.push(`drain:${getOfflineState().online ? "online" : "offline"}`);
      return { applied: 0, conflicts: 0, stoppedForLogin: false };
    });
    syncAll.mockImplementation(async () => void order.push(`sync:${getOfflineState().online ? "online" : "offline"}`));
    directFetch.mockResolvedValue({ ok: true, status: 200, statusText: "OK", data: {} });

    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(order).toEqual(["drain:offline", "sync:offline"]);
    expect(getOfflineState().online).toBe(true);
    // Going online after the sync does not run the drain and the sync a second time.
    expect(drainQueue).toHaveBeenCalledTimes(1);
    expect(syncAll).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("a change queued while the reconnect attempt ran (a resolved conflict) is sent as soon as the session goes online", async () => {
    await store.putRecord({
      type: "roots",
      id: "C",
      rootId: "C",
      resource: { type: "roots", id: "C" },
      updatedAt: null,
    });
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    directFetch.mockResolvedValue({ ok: true, status: 200, statusText: "OK", data: {} });
    // The GM resolves a conflict during the sync: the session is still offline, so it only queues.
    syncAll.mockImplementation(async () => void setOfflineState({ pending: 1 }));

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(getOfflineState().online).toBe(true);
    expect(drainQueue).toHaveBeenCalledTimes(2);
    expect(syncAll).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it("after a probe reaches the API, the session stays offline when the network fails during the drain or the sync", async () => {
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    directFetch.mockResolvedValue({ ok: true, status: 200, statusText: "OK", data: {} });
    // A request of the sync fails on the network: the request layer marks the session offline.
    syncAll.mockImplementation(async () => setOfflineState({ online: false }));

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(drainQueue).toHaveBeenCalledTimes(1);
    expect(syncAll).toHaveBeenCalledTimes(1);
    expect(getOfflineState().online).toBe(false);
    expect(isReconnecting()).toBe(false);

    drainQueue.mockImplementation(async () => {
      setOfflineState({ online: false });
      return { applied: 0, conflicts: 0, stoppedForLogin: false };
    });
    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(drainQueue).toHaveBeenCalledTimes(2);
    expect(syncAll).toHaveBeenCalledTimes(1);
    expect(getOfflineState().online).toBe(false);
    vi.unstubAllGlobals();
  });

  it("after a probe reaches the API, an expired sign-in stops the drain: no sync, the session stays offline", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, pathname: "/" });
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    document.cookie = "token=t9; path=/";
    sessionStorage.clear();
    setOfflineState({ online: false });
    directFetch.mockResolvedValue({ ok: true, status: 200, statusText: "OK", data: {} });
    drainQueue.mockResolvedValue({ applied: 0, conflicts: 0, stoppedForLogin: true });

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(30000);
    await flush();

    expect(drainQueue).toHaveBeenCalledTimes(1);
    expect(syncAll).not.toHaveBeenCalled();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(getOfflineState().online).toBe(false);

    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("the browser online event probes the API right away and goes online only when the probe reaches it", async () => {
    setOfflineState({ online: false });
    vi.stubGlobal("navigator", { ...navigator, onLine: true });
    directFetch.mockResolvedValue({ ok: false, status: 503, statusText: "", data: undefined, networkError: true });

    stop = startOfflineRuntime();
    await flush();
    window.dispatchEvent(new Event("online"));
    await flush();

    expect(directFetch).toHaveBeenCalledTimes(1);
    expect(getOfflineState().online).toBe(false);

    directFetch.mockResolvedValue({ ok: true, status: 200, statusText: "OK", data: {} });
    window.dispatchEvent(new Event("online"));
    await flush();

    expect(directFetch).toHaveBeenCalledTimes(2);
    expect(getOfflineState().online).toBe(true);
    vi.unstubAllGlobals();
  });

  it("an expired sign-in reloads for the login once per sign-in, never in a loop (a 401 while the cookie exists)", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload, pathname: "/" });
    document.cookie = "token=t1; path=/";
    sessionStorage.clear();
    drainQueue.mockResolvedValue({ applied: 0, conflicts: 0, stoppedForLogin: true });

    stop = startOfflineRuntime();
    await flush();
    expect(reload).toHaveBeenCalledTimes(1);

    // The page reloaded and the API still answers 401: the GM stays on the page, the queue stays.
    stop();
    stop = startOfflineRuntime();
    await flush();
    await vi.advanceTimersByTimeAsync(300000);
    await flush();
    expect(reload).toHaveBeenCalledTimes(1);

    // A new sign-in may reload once more.
    document.cookie = "token=t2; path=/";
    await vi.advanceTimersByTimeAsync(300000);
    await flush();
    expect(reload).toHaveBeenCalledTimes(2);

    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("stopOfflineRuntime stops every running runtime (logout)", async () => {
    stop = startOfflineRuntime();
    await flush();
    const atStart = syncAll.mock.calls.length;

    stopOfflineRuntime();
    await vi.advanceTimersByTimeAsync(900000);

    expect(syncAll.mock.calls.length).toBe(atStart);
  });

  it("a browser found unable to keep the device copy stops the runtime: no sync, no lock check, no warning per tick", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    stop = startOfflineRuntime();
    await flush();
    const atStart = syncAll.mock.calls.length;

    markOfflineUnavailable(new OfflineUnavailableError("the browser offers no private file storage"));
    await vi.advanceTimersByTimeAsync(900000);

    expect(syncAll.mock.calls.length).toBe(atStart);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("does not start in a browser that cannot keep the device copy", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    markOfflineUnavailable(new OfflineUnavailableError("the browser offers no private file storage"));

    stop = startOfflineRuntime();
    await vi.advanceTimersByTimeAsync(900000);

    expect(drainQueue).not.toHaveBeenCalled();
    expect(syncAll).not.toHaveBeenCalled();
    expect(getOfflineState().available).toBe(false);
    warn.mockRestore();
  });
});
