import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import {
  blockOfflineStore,
  configureOffline,
  DeviceStoreUnavailableError,
  getOfflineStore,
  isOfflineConfigured,
  OfflineUnavailableError,
  resetOfflineConfig,
  setDeviceStoreOpener,
} from "../../config";
import { getOfflineState, resetOfflineState } from "../../state";
import { NeedsConnectionError, type OfflineConfig } from "../../types";
import {
  deleteDeviceStore,
  hasUnsentChanges,
  onUserSignedIn,
  openDeviceStore,
  openMemoryDatabase,
  setDeviceStoreBackend,
  type OfflineDirectory,
} from "../lifecycle";
import { fakeCacheStorage } from "../../sync/__tests__/sync-fixtures";

/** An in-memory stand-in for the OPFS root directory. */
const fakeDirectory = () => {
  const entries = new Set<string>();
  const directory: OfflineDirectory = {
    async *keys() {
      for (const name of [...entries]) yield name;
    },
    async getFileHandle(name, options) {
      if (!entries.has(name)) {
        if (!options?.create) throw Object.assign(new Error(name), { name: "NotFoundError" });
        entries.add(name);
      }
      return {};
    },
    async removeEntry(name) {
      if (!entries.delete(name)) throw Object.assign(new Error(name), { name: "NotFoundError" });
    },
  };
  return { entries, directory };
};

describe("device store lifecycle", () => {
  let entries: Set<string>;
  let opened: string[];
  let persisted: number;

  beforeEach(() => {
    const fake = fakeDirectory();
    entries = fake.entries;
    opened = [];
    persisted = 0;
    setDeviceStoreBackend({
      getDirectory: async () => fake.directory,
      openDatabase: async (_userId, fileName) => {
        opened.push(fileName);
        const created = !entries.has(fileName);
        entries.add(fileName);
        const database = await openMemoryDatabase();
        return { ...database, created };
      },
      requestPersistence: vi.fn(async () => {
        persisted += 1;
      }),
    });
  });

  afterEach(() => {
    setDeviceStoreBackend(null);
  });

  it("keeps another user's database that has unsent changes", async () => {
    const storeA = await openDeviceStore("user-a");
    await storeA.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: { type: "npcs", id: "n1" } });
    // User A's sign-in expired without a logout; user B signs in on the same browser.

    await onUserSignedIn("user-b");
    await openDeviceStore("user-b");

    expect(entries.has("nja-offline-user-a.sqlite3")).toBe(true);
    expect(await hasUnsentChanges("user-a")).toBe(true);
    expect(opened).toEqual(["nja-offline-user-a.sqlite3", "nja-offline-user-b.sqlite3"]);
  });

  it("deletes another user's database with an empty queue", async () => {
    const storeA = await openDeviceStore("user-a");
    const seq = await storeA.enqueue({ rootId: "C", method: "DELETE", path: "npcs/n1", base: null });
    await storeA.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: {}, updatedAt: null });
    await storeA.removeQueueEntry(seq);
    expect(await hasUnsentChanges("user-a")).toBe(false);

    await onUserSignedIn("user-b");

    expect([...entries].filter((name) => name.includes("user-a"))).toEqual([]);
  });

  describe("the artwork images cache", () => {
    afterEach(() => vi.unstubAllGlobals());

    it("is deleted when a different user signs in, and kept when the same user signs in again", async () => {
      const cache = fakeCacheStorage(["wyrdli-offline-1", "wyrdli-images"]);
      vi.stubGlobal("caches", cache.storage);

      await onUserSignedIn("user-a");
      // user-a's sync downloads their artwork.
      await (await cache.storage.open("wyrdli-images")).put("http://api.test/artworks/a1/image", {});
      await onUserSignedIn("user-a");
      expect(cache.caches.get("wyrdli-images")?.has("http://api.test/artworks/a1/image")).toBe(true);

      await onUserSignedIn("user-b");
      expect(cache.caches.has("wyrdli-images")).toBe(false);
      expect(cache.caches.has("wyrdli-offline-1")).toBe(true);
    });

    it("is deleted when a different user signs in while the first user's database has unsent changes", async () => {
      const cache = fakeCacheStorage(["wyrdli-offline-1", "wyrdli-images"]);
      vi.stubGlobal("caches", cache.storage);
      await onUserSignedIn("user-a");
      const storeA = await openDeviceStore("user-a");
      await storeA.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: null });

      await onUserSignedIn("user-b");

      expect(cache.caches.has("wyrdli-images")).toBe(false);
      expect(entries.has("nja-offline-user-a.sqlite3")).toBe(true);
    });
  });

  it("never opens a file for a user other than the one asked", async () => {
    entries.add("nja-offline-user-a.sqlite3");
    entries.add("nja-offline-user-a.pending");
    entries.add(".nja-offline-user-c");

    const store = await openDeviceStore("user-b");
    expect(await openDeviceStore("user-b")).toBe(store);
    expect(await hasUnsentChanges("user-a")).toBe(true);
    await onUserSignedIn("user-b");

    expect(opened).toEqual(["nja-offline-user-b.sqlite3"]);
    expect(entries.has("nja-offline-user-a.sqlite3")).toBe(true);
    expect(entries.has(".nja-offline-user-c")).toBe(false);
  });

  it("requests persistent storage only when the file is first created", async () => {
    await openDeviceStore("user-a");
    await deleteDeviceStore("user-a");
    expect(persisted).toBe(1);
    expect(entries.size).toBe(0);

    entries.add("nja-offline-user-a.sqlite3");
    await openDeviceStore("user-a");
    expect(persisted).toBe(1);
  });

  it("keeps the unsent-changes mark when a transaction that emptied the queue rolls back", async () => {
    const store = await openDeviceStore("user-a");
    const seq = await store.enqueue({ rootId: "C", method: "PATCH", path: "npcs/n1", base: null });

    await expect(
      store.transaction(async (tx) => {
        await tx.removeQueueEntry(seq);
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");

    expect(entries.has("nja-offline-user-a.pending")).toBe(true);
    expect(await hasUnsentChanges("user-a")).toBe(true);
  });

  describe("getOfflineStore", () => {
    const config = (userId: string): OfflineConfig => ({
      getUserId: () => userId,
      rootModule: { name: "roots" } as any,
      types: [],
      routes: [],
      listSyncRoots: async () => [],
      shellPath: () => "/offline-shell",
      syncIntervalMs: 300000,
    });

    afterEach(() => resetOfflineConfig());

    it("a store that cannot be opened (a second tab holds the SQLite file) is a needs-connection error", async () => {
      configureOffline(config("user-a"));
      setDeviceStoreOpener(async () => {
        throw new Error("NoModificationAllowedError: Access Handles cannot be created");
      });

      const error = await getOfflineStore().catch((caught) => caught);

      expect(error).toBeInstanceOf(DeviceStoreUnavailableError);
      expect(error).toBeInstanceOf(NeedsConnectionError);
      expect(error.status).toBe(503);
      // A real failure on a browser that can keep the copy never switches offline mode off.
      expect(error).not.toBeInstanceOf(OfflineUnavailableError);
      expect(getOfflineState().available).toBe(true);
      expect(isOfflineConfigured()).toBe(true);
    });

    it("a blocked user's store (logged out) is never opened again until that user signs in", async () => {
      configureOffline(config("user-a"));
      const opener = vi.fn(async () => openDeviceStore("user-a"));
      setDeviceStoreOpener(opener);

      blockOfflineStore("user-a");
      await expect(getOfflineStore()).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
      await expect(openDeviceStore("user-a")).rejects.toBeInstanceOf(DeviceStoreUnavailableError);
      expect(opener).not.toHaveBeenCalled();
      expect(opened).toEqual([]);

      await onUserSignedIn("user-a");
      await getOfflineStore();
      expect(opener).toHaveBeenCalledTimes(1);
      expect(opened).toEqual(["nja-offline-user-a.sqlite3"]);
    });
  });

  describe("a browser that cannot keep the device copy", () => {
    const config: OfflineConfig = {
      getUserId: () => "user-a",
      rootModule: { name: "roots", model: class {} },
      types: [],
      routes: [],
      listSyncRoots: async () => [],
      shellPath: () => "/offline-shell",
      syncIntervalMs: 300000,
    };

    /** A device worker whose "open" fails the way SQLite does without the OPFS sync-access handles. */
    const workers: string[] = [];
    class OpfsMissingWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      constructor(url: string) {
        workers.push(url);
      }
      postMessage(message: { id: number }) {
        queueMicrotask(() =>
          this.onmessage?.({ data: { id: message.id, ok: false, error: "Missing required OPFS APIs." } }),
        );
      }
      terminate() {}
    }

    let warn: MockInstance<typeof console.warn>;

    beforeEach(() => {
      workers.length = 0;
      resetOfflineState();
      configureOffline(config);
      setDeviceStoreOpener((userId) => openDeviceStore(userId));
      warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.stubGlobal("Worker", OpfsMissingWorker);
    });

    afterEach(() => {
      warn.mockRestore();
      vi.unstubAllGlobals();
      resetOfflineConfig();
      resetOfflineState();
    });

    it("not a secure context (a custom http dev host): the sign-in switches offline mode off, once, without starting a worker", async () => {
      setDeviceStoreBackend(null);
      vi.stubGlobal("isSecureContext", false);

      await expect(onUserSignedIn("user-a")).resolves.toBeUndefined();

      expect(getOfflineState().available).toBe(false);
      expect(isOfflineConfigured()).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);

      // Later uses never try again and never warn again.
      await expect(getOfflineStore()).rejects.toBeInstanceOf(OfflineUnavailableError);
      await expect(openDeviceStore("user-a")).rejects.toBeInstanceOf(OfflineUnavailableError);
      await expect(hasUnsentChanges("user-a")).resolves.toBe(false);
      await expect(deleteDeviceStore("user-a")).resolves.toBeUndefined();
      await onUserSignedIn("user-a");
      expect(workers).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("no private file storage (navigator.storage.getDirectory missing): offline mode is off", async () => {
      setDeviceStoreBackend(null);
      vi.stubGlobal("isSecureContext", true);
      vi.stubGlobal("navigator", { onLine: true });

      await onUserSignedIn("user-a");

      expect(getOfflineState().available).toBe(false);
      expect(workers).toEqual([]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("the worker reports the OPFS APIs missing: the open is an unavailable browser, warned once, and no worker starts again", async () => {
      const fake = fakeDirectory();
      vi.stubGlobal("isSecureContext", true);
      vi.stubGlobal("navigator", { onLine: true, storage: { getDirectory: async () => fake.directory } });
      // The browser's database opener (the worker), over a fake directory.
      setDeviceStoreBackend({ getDirectory: async () => fake.directory });

      await onUserSignedIn("user-a");
      expect(getOfflineState().available).toBe(true);

      const [first, second] = await Promise.all([
        getOfflineStore().catch((caught) => caught),
        getOfflineStore().catch((caught) => caught),
      ]);

      expect(first).toBeInstanceOf(OfflineUnavailableError);
      expect(second).toBe(first);
      expect(workers).toHaveLength(1);
      expect(getOfflineState().available).toBe(false);
      expect(isOfflineConfigured()).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);

      await expect(getOfflineStore()).rejects.toBeInstanceOf(OfflineUnavailableError);
      expect(workers).toHaveLength(1);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("a storage SecurityError (some private windows) is an unavailable browser", async () => {
      setDeviceStoreBackend(null);
      vi.stubGlobal("isSecureContext", true);
      vi.stubGlobal("navigator", {
        onLine: true,
        storage: {
          getDirectory: async () => {
            throw Object.assign(new Error("Security error when calling GetDirectory"), { name: "SecurityError" });
          },
        },
      });

      await onUserSignedIn("user-a");

      expect(getOfflineState().available).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
    });
  });
});
