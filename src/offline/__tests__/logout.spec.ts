import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  configureOffline,
  DeviceStoreUnavailableError,
  getOfflineStore,
  resetOfflineConfig,
  setDeviceStoreOpener,
} from "../config";
import { finishOfflineLogout, prepareOfflineLogout } from "../logout";
import { getOfflineState, resetOfflineState, setOfflineState } from "../state";
import type { DeviceStore, QueueEntry } from "../store/DeviceStore";
import type { OfflineConfig } from "../types";

const lifecycle = vi.hoisted(() => ({ deleteDeviceStore: vi.fn() }));
vi.mock("../store/lifecycle", () => lifecycle);
const runtime = vi.hoisted(() => ({ stopOfflineRuntime: vi.fn() }));
vi.mock("../sync/runtime", () => runtime);

function config(userId: string | undefined, requireOptIn?: boolean): OfflineConfig {
  return {
    getUserId: () => userId,
    requireOptIn,
    rootModule: { name: "roots" } as any,
    types: [],
    routes: [],
    listSyncRoots: async () => [],
    shellPath: () => "/offline-shell",
    syncIntervalMs: 300000,
  };
}

function storeWithQueue(entries: Partial<QueueEntry>[]): DeviceStore {
  return { queue: vi.fn(async () => entries as QueueEntry[]) } as unknown as DeviceStore;
}

describe("offline logout", () => {
  beforeEach(() => {
    lifecycle.deleteDeviceStore.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    resetOfflineConfig();
  });

  it("prepareOfflineLogout counts every unsent queue entry of the signed-in user", async () => {
    configureOffline(config("u1"));
    const opener = vi.fn(async () =>
      storeWithQueue([{ status: "pending" }, { status: "conflict" }, { status: "failed" }]),
    );
    setDeviceStoreOpener(opener);

    expect(await prepareOfflineLogout()).toEqual({ pending: 3 });
    expect(opener).toHaveBeenCalledWith("u1");
  });

  it("prepareOfflineLogout answers 0 when offline mode is not configured or nobody is signed in", async () => {
    expect(await prepareOfflineLogout()).toEqual({ pending: 0 });

    configureOffline(config(undefined));
    const opener = vi.fn();
    setDeviceStoreOpener(opener);
    expect(await prepareOfflineLogout()).toEqual({ pending: 0 });
    expect(opener).not.toHaveBeenCalled();
  });

  it("finishOfflineLogout deletes the user's database and the images cache", async () => {
    const caches = {
      keys: vi.fn(async () => ["wyrdli-offline-abc", "wyrdli-shell-b1", "wyrdli-images"]),
      delete: vi.fn(async () => true),
    };
    vi.stubGlobal("caches", caches);

    await finishOfflineLogout("u1");

    expect(lifecycle.deleteDeviceStore).toHaveBeenCalledWith("u1");
    expect(caches.delete).toHaveBeenCalledTimes(1);
    expect(caches.delete).toHaveBeenCalledWith("wyrdli-images");
    vi.unstubAllGlobals();
  });

  it("finishOfflineLogout stops the runtime first and blocks any reopen of the store, so a sync still running cannot recreate the deleted file", async () => {
    vi.stubGlobal("caches", { keys: vi.fn(async () => []), delete: vi.fn() });
    configureOffline(config("u1"));
    const opener = vi.fn(async () => storeWithQueue([]));
    setDeviceStoreOpener(opener);
    runtime.stopOfflineRuntime.mockReset();
    const order: string[] = [];
    runtime.stopOfflineRuntime.mockImplementation(() => void order.push("stop"));
    lifecycle.deleteDeviceStore.mockImplementation(async () => {
      order.push("delete");
      // A sync that was still running asks for the store while the file is deleted.
      await expect(getOfflineStore()).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
    });

    await finishOfflineLogout("u1");

    expect(order).toEqual(["stop", "delete"]);
    await expect(getOfflineStore()).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
    expect(opener).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("finishOfflineLogout turns the device switch off and clears the sync state and the last sync time", async () => {
    vi.stubGlobal("caches", { keys: vi.fn(async () => []), delete: vi.fn() });
    localStorage.setItem("nja-offline-enabled:u1", "1");
    localStorage.setItem("nja-offline-last-sync:u1", "1761990000000");
    configureOffline(config("u1", true));
    setOfflineState({ rootCount: 2, syncProgress: { done: 1, total: 2 } });
    expect(getOfflineState().lastSyncedAt).toBe(1761990000000);

    await finishOfflineLogout("u1");

    expect(localStorage.getItem("nja-offline-enabled:u1")).toBeNull();
    expect(localStorage.getItem("nja-offline-last-sync:u1")).toBeNull();
    expect(getOfflineState()).toEqual(
      expect.objectContaining({ enabled: false, syncProgress: null, lastSyncedAt: null, rootCount: null }),
    );
    localStorage.clear();
    resetOfflineState();
    vi.unstubAllGlobals();
  });
});
