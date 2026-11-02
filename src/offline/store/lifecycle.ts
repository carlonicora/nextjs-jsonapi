import type { Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import {
  DeviceStoreUnavailableError,
  forgetOfflineStore,
  getDeviceWorkerUrl,
  getSqliteModuleUrl,
  isOfflineAvailable,
  isOfflineStoreBlocked,
  markOfflineUnavailable,
  OfflineUnavailableError,
  refreshOfflineDeviceState,
  unblockOfflineStore,
} from "../config";
import { deleteImagesCaches } from "../sync/artwork-cache";
import type { DeviceStore } from "./DeviceStore";
import { createSqlDeviceStore } from "./sql-device-store";
import { canShareDatabase, openSharedDatabase, withDatabaseReleased, type SharedDatabase } from "./shared-database";
import { openWorkerDatabase, type OpenedDatabase } from "./worker-client";

/** The part of an OPFS `FileSystemDirectoryHandle` the lifecycle uses (faked in tests). */
export type OfflineDirectory = {
  keys(): AsyncIterable<string>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<unknown>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
};

export type DeviceStoreBackend = {
  /** The OPFS root that holds every user's device file. */
  getDirectory: () => Promise<OfflineDirectory>;
  /** Opens `fileName` for `userId` (the worker in the browser). */
  openDatabase: (userId: string, fileName: string) => Promise<OpenedDatabase>;
  /** Asks the browser to keep the device copy (`navigator.storage.persist()`). */
  requestPersistence: () => Promise<void>;
};

const FILE_PREFIX = "nja-offline-";
const deviceFileName = (userId: string) => `${FILE_PREFIX}${userId}.sqlite3`;
/** Present while the user's file holds unsent changes; read without opening the file. */
const pendingMarkerName = (userId: string) => `${FILE_PREFIX}${userId}.pending`;
/** Names the user whose artwork the images cache holds (the images cache is not per user). */
const IMAGES_OWNER_PREFIX = "nja-offline-images-owner-";
const imagesOwnerName = (userId: string) => `${IMAGES_OWNER_PREFIX}${userId}`;
const FILE_PATTERN = /^nja-offline-(.+)\.(?:sqlite3(?:-journal|-wal|-shm)?|pending)$/;
const POOL_PATTERN = /^\.nja-offline-(.+)$/;

/**
 * Why this browser cannot keep the device copy, or null when it may: browsers expose the private
 * file storage only in a secure context (https, or `localhost`). Checked before any worker starts.
 */
const missingDeviceStorage = (): string | null => {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "the page is not served from a secure origin (https or localhost)";
  }
  if (typeof navigator === "undefined" || typeof navigator.storage?.getDirectory !== "function") {
    return "the browser offers no private file storage";
  }
  return null;
};

const assertDeviceStorage = (): void => {
  const reason = missingDeviceStorage();
  if (reason) throw new OfflineUnavailableError(reason);
};

/** What the SQLite worker answers when the browser lacks the OPFS sync-access handles. */
const OPFS_MISSING = /Missing required OPFS APIs/i;

const defaultBackend: DeviceStoreBackend = {
  getDirectory: async () => {
    assertDeviceStorage();
    try {
      return (await navigator.storage.getDirectory()) as unknown as OfflineDirectory;
    } catch (error) {
      // Storage refused outright (some private windows).
      if ((error as { name?: string })?.name === "SecurityError") {
        throw new OfflineUnavailableError("the browser refused its private file storage");
      }
      throw error;
    }
  },
  openDatabase: async (userId, fileName) => {
    assertDeviceStorage();
    const openLocal = () =>
      openWorkerDatabase(userId, fileName, {
        workerUrl: getDeviceWorkerUrl(),
        sqliteModuleUrl: getSqliteModuleUrl(),
      });
    try {
      // Shared by every page of the origin: only one page at a time can hold the files.
      if (!canShareDatabase()) return await openLocal();
      return await openSharedDatabase(userId, openLocal, () => forgetClosedStore(userId));
    } catch (error) {
      if (OPFS_MISSING.test(String((error as Error)?.message ?? error))) {
        throw new OfflineUnavailableError("the browser lacks the file access the device copy needs (OPFS)");
      }
      throw error;
    }
  },
  requestPersistence: async () => {
    if (typeof navigator !== "undefined" && navigator.storage?.persist) await navigator.storage.persist();
  },
};

let backend: DeviceStoreBackend = defaultBackend;

type OpenStore = { userId: string; store: Promise<DeviceStore>; database: Promise<OpenedDatabase> };
let current: OpenStore | undefined;

/** Replaces the OPFS directory / database opener (tests); `null` restores the browser one. */
export function setDeviceStoreBackend(next: Partial<DeviceStoreBackend> | null): void {
  backend = next ? { ...defaultBackend, ...next } : defaultBackend;
  current = undefined;
}

const entryExists = async (directory: OfflineDirectory, name: string): Promise<boolean> => {
  for await (const key of directory.keys()) if (key === name) return true;
  return false;
};

const removeIfPresent = async (directory: OfflineDirectory, name: string): Promise<void> => {
  try {
    await directory.removeEntry(name, { recursive: true });
  } catch (error) {
    if ((error as { name?: string })?.name !== "NotFoundError") throw error;
  }
};

const entriesOf = async (directory: OfflineDirectory, userId: string): Promise<string[]> => {
  const names: string[] = [];
  for await (const key of directory.keys()) if (userIdOf(key) === userId) names.push(key);
  return names;
};

/**
 * The OPFS root, or undefined when this browser cannot keep the device copy: offline mode is then
 * switched off (`markOfflineUnavailable`). Any other failure is thrown as before.
 */
const deviceDirectory = async (): Promise<OfflineDirectory | undefined> => {
  if (!isOfflineAvailable()) return undefined;
  try {
    return await backend.getDirectory();
  } catch (error) {
    if (!(error instanceof OfflineUnavailableError)) throw error;
    markOfflineUnavailable(error);
    return undefined;
  }
};

const userIdOf = (name: string): string | undefined => FILE_PATTERN.exec(name)?.[1] ?? POOL_PATTERN.exec(name)?.[1];

const closeCurrent = async (): Promise<void> => {
  const open = current;
  current = undefined;
  if (!open) return;
  try {
    await (await open.database).close();
  } catch {
    // A database that never opened has nothing to close.
  }
};

/**
 * Opens the device copy of `userId` (`nja-offline-<userId>.sqlite3` in the OPFS,
 * through the worker). Only one user's file is open at a time: opening another
 * user's file closes the previous one first.
 */
export function openDeviceStore(userId: string): Promise<DeviceStore> {
  if (!userId) return Promise.reject(new Error("openDeviceStore needs the signed-in user id."));
  if (isOfflineStoreBlocked(userId)) {
    return Promise.reject(new DeviceStoreUnavailableError("The device copy was deleted at logout"));
  }
  if (!isOfflineAvailable()) {
    return Promise.reject(new OfflineUnavailableError("it was found unable to keep the device copy"));
  }
  if (current?.userId === userId) return current.store;

  const previous = closeCurrent();
  const database = previous
    .then(() => backend.openDatabase(userId, deviceFileName(userId)))
    .catch((error) => {
      if (error instanceof OfflineUnavailableError) markOfflineUnavailable(error);
      throw error;
    });
  const store = database.then(async (opened) => {
    if (opened.created) await backend.requestPersistence();
    return createSqlDeviceStore(opened.exec, {
      exclusive: (opened as Partial<SharedDatabase>).exclusive,
      beforeEnqueue: async () => {
        const directory = await backend.getDirectory();
        await directory.getFileHandle(pendingMarkerName(userId), { create: true });
      },
      afterQueueChange: async (entries) => {
        if (entries > 0) return;
        await removeIfPresent(await backend.getDirectory(), pendingMarkerName(userId));
      },
    });
  });
  const open: OpenStore = { userId, store, database };
  current = open;
  store.catch(() => {
    if (current === open) current = undefined;
  });
  return store;
}

let sqlite3Promise: Promise<Sqlite3Static> | undefined;

/**
 * An in-memory SQLite database (no worker, no OPFS), for tests in Node. The package is imported
 * here at run time and hidden from app bundlers (see `OfflineConfig.sqliteModuleUrl`).
 */
export async function openMemoryDatabase(): Promise<OpenedDatabase> {
  sqlite3Promise ??= import(/* webpackIgnore: true */ /* turbopackIgnore: true */ "@sqlite.org/sqlite-wasm").then(
    (module) => module.default(),
  );
  const sqlite3 = await sqlite3Promise;
  const db = new sqlite3.oo1.DB(":memory:", "c");
  return {
    created: true,
    exec: async (sql, bind) =>
      db.exec({
        sql,
        bind: bind && bind.length ? (bind as any) : undefined,
        rowMode: "object",
        returnValue: "resultRows",
      }) as Record<string, unknown>[],
    close: async () => {
      db.close();
    },
  };
}

/** The same store and schema over an in-memory database, for tests. */
export async function openMemoryDeviceStore(): Promise<DeviceStore> {
  const database = await openMemoryDatabase();
  return createSqlDeviceStore(database.exec);
}

/**
 * Another page closed every page's copy of `userId` (logout, offline mode off): this page forgets
 * its store, and reads the device switch again before anything opens the copy.
 */
function forgetClosedStore(userId: string): void {
  if (current?.userId === userId) current = undefined;
  forgetOfflineStore(userId);
  refreshOfflineDeviceState();
}

/**
 * Closes `userId`'s device copy in every page and removes every OPFS entry of it. The files can
 * only be removed once no page holds them, so the removal waits for every page to let go.
 */
export async function deleteDeviceStore(userId: string): Promise<void> {
  if (current?.userId === userId) await closeCurrent();
  const directory = await deviceDirectory();
  if (!directory) return;
  const remove = async () => {
    const names = await entriesOf(directory, userId);
    const marker = pendingMarkerName(userId);
    for (const name of names) if (name !== marker) await removeIfPresent(directory, name);
    await removeIfPresent(directory, marker);
  };
  if (backend === defaultBackend) await withDatabaseReleased(userId, remove);
  else await remove();
}

/** Whether `userId`'s device copy holds unsent changes. Never opens another user's file. */
export async function hasUnsentChanges(userId: string): Promise<boolean> {
  if (current?.userId === userId) {
    const store = await current.store;
    if ((await store.queue()).length > 0) return true;
  }
  const directory = await deviceDirectory();
  if (!directory) return false;
  return entryExists(directory, pendingMarkerName(userId));
}

/**
 * A user signed in on this browser: their device copy may be opened again (it is blocked after
 * a logout), and every other user's device copy is deleted when it has nothing unsent, and kept
 * untouched (never opened) when it has. When the images cache was not this user's (another user
 * signed in before, or no owner is known), it is deleted: the user's sync downloads their artwork.
 */
export async function onUserSignedIn(userId: string): Promise<void> {
  unblockOfflineStore(userId);
  if (current && current.userId !== userId) await closeCurrent();
  // A browser that cannot keep the device copy: offline mode switches off here, before the runtime starts.
  const directory = await deviceDirectory();
  if (!directory) return;
  const others = new Set<string>();
  const imageOwners: string[] = [];
  for await (const key of directory.keys()) {
    if (key.startsWith(IMAGES_OWNER_PREFIX)) {
      imageOwners.push(key);
      continue;
    }
    const owner = userIdOf(key);
    if (owner && owner !== userId) others.add(owner);
  }
  if (!imageOwners.includes(imagesOwnerName(userId))) {
    await deleteImagesCaches();
    for (const name of imageOwners) await removeIfPresent(directory, name);
    await directory.getFileHandle(imagesOwnerName(userId), { create: true });
  }
  for (const other of others) {
    if (await entryExists(directory, pendingMarkerName(other))) continue;
    await deleteDeviceStore(other);
  }
}

/** Locked now: the server said so, or the lock date it gave has passed. */
export function isRootLocked(s: { locked: boolean; lockedFrom: Date | null }, now: Date): boolean {
  if (s.locked) return true;
  return s.lockedFrom !== null && s.lockedFrom.getTime() <= now.getTime();
}
