import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureOffline,
  DeviceStoreUnavailableError,
  getOfflineStore,
  isOfflineConfigured,
  isOfflineEnabledOnDevice,
  resetOfflineConfig,
  setDeviceStoreOpener,
} from "../config";
import { turnOffOffline, turnOnOffline } from "../device-switch";
import { getOfflineState, resetOfflineState, setOfflineState } from "../state";
import type { DeviceStore, QueueEntry } from "../store/DeviceStore";
import type { OfflineConfig } from "../types";

const lifecycle = vi.hoisted(() => ({ deleteDeviceStore: vi.fn(), hasUnsentChanges: vi.fn() }));
vi.mock("../store/lifecycle", () => lifecycle);
const runtime = vi.hoisted(() => ({ stopOfflineRuntime: vi.fn() }));
vi.mock("../sync/runtime", () => runtime);

const ENABLED_KEY = "nja-offline-enabled:u1";
const LAST_SYNC_KEY = "nja-offline-last-sync:u1";

function config(overrides: Partial<OfflineConfig> = {}): OfflineConfig {
  return {
    getUserId: () => "u1",
    rootModule: { name: "roots" } as any,
    types: [],
    routes: [],
    listSyncRoots: async () => [],
    shellPath: () => "/offline-shell",
    syncIntervalMs: 300000,
    ...overrides,
  };
}

function storeWithQueue(entries: Partial<QueueEntry>[]): DeviceStore {
  return { queue: vi.fn(async () => entries as QueueEntry[]) } as unknown as DeviceStore;
}

describe("offline device switch", () => {
  beforeEach(() => {
    localStorage.clear();
    resetOfflineConfig();
    resetOfflineState();
    lifecycle.deleteDeviceStore.mockReset().mockResolvedValue(undefined);
    lifecycle.hasUnsentChanges.mockReset().mockResolvedValue(false);
    runtime.stopOfflineRuntime.mockReset();
    vi.stubGlobal("caches", { keys: vi.fn(async () => ["app-images"]), delete: vi.fn(async () => true) });
  });

  afterEach(() => {
    resetOfflineConfig();
    resetOfflineState();
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("without requireOptIn offline mode is on, as before", async () => {
    configureOffline(config());
    setDeviceStoreOpener(async () => storeWithQueue([]));

    expect(isOfflineEnabledOnDevice("u1")).toBe(true);
    expect(isOfflineConfigured()).toBe(true);
    expect(getOfflineState().enabled).toBe(true);
    await expect(getOfflineStore()).resolves.toBeDefined();
  });

  it("with requireOptIn and no stored switch, offline mode is off and the store is refused", async () => {
    configureOffline(config({ requireOptIn: true }));
    const opener = vi.fn(async () => storeWithQueue([]));
    setDeviceStoreOpener(opener);

    expect(isOfflineConfigured()).toBe(false);
    expect(getOfflineState().enabled).toBe(false);
    await expect(getOfflineStore()).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
    expect(opener).not.toHaveBeenCalled();
  });

  it("with requireOptIn and no signed-in user, offline mode is off", () => {
    configureOffline(config({ requireOptIn: true, getUserId: () => undefined }));
    expect(isOfflineEnabledOnDevice(undefined)).toBe(false);
    expect(isOfflineConfigured()).toBe(false);
  });

  it("reads the stored switch and the last sync time at configure", () => {
    localStorage.setItem(ENABLED_KEY, "1");
    localStorage.setItem(LAST_SYNC_KEY, "1761990000000");
    configureOffline(config({ requireOptIn: true }));

    expect(isOfflineConfigured()).toBe(true);
    expect(getOfflineState()).toEqual(expect.objectContaining({ enabled: true, lastSyncedAt: 1761990000000 }));
  });

  it("turnOnOffline stores the switch and sets enabled", async () => {
    const persist = vi.fn(async () => true);
    vi.stubGlobal("navigator", { ...navigator, storage: { persist } });
    configureOffline(config({ requireOptIn: true }));

    await turnOnOffline();

    expect(localStorage.getItem(ENABLED_KEY)).toBe("1");
    expect(getOfflineState().enabled).toBe(true);
    expect(isOfflineConfigured()).toBe(true);
    expect(persist).toHaveBeenCalled();
  });

  it("turnOnOffline ignores a failing persist request", async () => {
    const persist = vi.fn(async () => Promise.reject(new Error("no")));
    vi.stubGlobal("navigator", { ...navigator, storage: { persist } });
    configureOffline(config({ requireOptIn: true }));

    await expect(turnOnOffline()).resolves.toBeUndefined();
    expect(getOfflineState().enabled).toBe(true);
  });

  it("turnOffOffline refuses, changing nothing, while changes wait to be sent", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    configureOffline(config({ requireOptIn: true }));
    setDeviceStoreOpener(async () => storeWithQueue([{ status: "pending" }, { status: "failed" }]));

    expect(await turnOffOffline()).toEqual({ turnedOff: false, pending: 2 });

    expect(localStorage.getItem(ENABLED_KEY)).toBe("1");
    expect(getOfflineState().enabled).toBe(true);
    expect(runtime.stopOfflineRuntime).not.toHaveBeenCalled();
    expect(lifecycle.deleteDeviceStore).not.toHaveBeenCalled();
  });

  it("turnOffOffline refuses when the copy is held by another tab and its marker says changes wait", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    configureOffline(config({ requireOptIn: true }));
    setDeviceStoreOpener(async () => {
      throw new Error("held by another tab");
    });
    lifecycle.hasUnsentChanges.mockResolvedValue(true);

    expect(await turnOffOffline()).toEqual({ turnedOff: false, pending: 1 });

    expect(lifecycle.hasUnsentChanges).toHaveBeenCalledWith("u1");
    expect(localStorage.getItem(ENABLED_KEY)).toBe("1");
    expect(lifecycle.deleteDeviceStore).not.toHaveBeenCalled();
  });

  it("turnOffOffline deletes the device copy and clears the switch and the state", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    localStorage.setItem(LAST_SYNC_KEY, "1761990000000");
    configureOffline(config({ requireOptIn: true }));
    const opener = vi.fn(async () => storeWithQueue([]));
    setDeviceStoreOpener(opener);
    setOfflineState({ rootCount: 3, syncProgress: { done: 1, total: 3 } });

    expect(await turnOffOffline()).toEqual({ turnedOff: true });

    expect(runtime.stopOfflineRuntime).toHaveBeenCalled();
    expect(lifecycle.deleteDeviceStore).toHaveBeenCalledWith("u1");
    expect(caches.delete).toHaveBeenCalledWith("app-images");
    expect(localStorage.getItem(ENABLED_KEY)).toBeNull();
    expect(localStorage.getItem(LAST_SYNC_KEY)).toBeNull();
    expect(getOfflineState()).toEqual(
      expect.objectContaining({ enabled: false, syncProgress: null, lastSyncedAt: null, rootCount: null }),
    );
    expect(isOfflineConfigured()).toBe(false);
    await expect(getOfflineStore()).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
    expect(opener).toHaveBeenCalledTimes(1);
  });

  it("turnOffOffline on a browser that cannot keep the copy only clears the switch and the state", async () => {
    localStorage.setItem(ENABLED_KEY, "1");
    configureOffline(config({ requireOptIn: true }));
    setOfflineState({ available: false });

    expect(await turnOffOffline()).toEqual({ turnedOff: true });

    expect(lifecycle.deleteDeviceStore).not.toHaveBeenCalled();
    expect(localStorage.getItem(ENABLED_KEY)).toBeNull();
    expect(getOfflineState().enabled).toBe(false);
  });
});
