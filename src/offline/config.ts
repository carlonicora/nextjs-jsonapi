import { attachBrowserOnlineEvents, getOfflineState, setOfflineState } from "./state";
import type { DeviceStore } from "./store/DeviceStore";
import {
  DEFAULT_DEVICE_WORKER_URL,
  DEFAULT_SQLITE_MODULE_URL,
  NeedsConnectionError,
  type OfflineConfig,
} from "./types";

// Kept free of store, worker and React imports: `directFetch` reads `isOfflineConfigured()` on
// every request, so this module is the only offline code an app that never opts in loads.

let _config: OfflineConfig | null = null;
let _opener: ((userId: string) => Promise<DeviceStore>) | null = null;
// Registered by the `./offline` entry (configure.ts), so the store code is reachable only from it.
let _defaultOpener: ((userId: string) => Promise<DeviceStore>) | null = null;
const _stores = new Map<string, Promise<DeviceStore>>();
// Users whose device store must not be opened again (logged out) until they sign in again.
const _blockedUsers = new Set<string>();
// Per user: whether offline mode is on on this device (`requireOptIn`). Read from localStorage
// once, since `isOfflineConfigured()` runs on every request.
const _enabledCache = new Map<string, boolean>();

const ENABLED_KEY_PREFIX = "nja-offline-enabled:";
const LAST_SYNC_KEY_PREFIX = "nja-offline-last-sync:";

function readStorage(key: string): string | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked or full: the switch then lasts for this page only.
  }
}

/**
 * The signed-in user's device store cannot be used: it could not be opened (opfs-sahpool holds
 * one connection per origin, so a second tab cannot open it) or the user logged out. A request
 * answered from the device copy then needs a connection (503 "needs-connection").
 */
export class DeviceStoreUnavailableError extends NeedsConnectionError {
  constructor(message: string = "The device copy is not available in this tab") {
    super(message);
    this.name = "DeviceStoreUnavailableError";
  }
}

/**
 * This browser cannot keep the device copy at all: not a secure context (https or `localhost`),
 * no private file storage (`navigator.storage.getDirectory`), or the worker reports the OPFS
 * APIs missing. Offline mode switches off for the page (`markOfflineUnavailable`). A failure on
 * a browser that can keep the copy (the file held by another tab) is a `DeviceStoreUnavailableError`.
 */
export class OfflineUnavailableError extends DeviceStoreUnavailableError {
  constructor(reason: string) {
    super(`Offline mode isn't available in this browser: ${reason}`);
    this.name = "OfflineUnavailableError";
  }
}

/**
 * Switches offline mode off for this page, once: one console warning, `available: false` in the
 * offline state. From then on `isOfflineConfigured()` answers false, so no request, sync, drain,
 * write-through or lock check touches the device copy again.
 */
export function markOfflineUnavailable(error: OfflineUnavailableError): void {
  if (!getOfflineState().available) return;
  console.warn(`[offline] ${error.message}. Offline mode is off in this browser.`);
  setOfflineState({ available: false });
}

/** Whether this browser can keep the device copy (true until found otherwise). */
export function isOfflineAvailable(): boolean {
  return getOfflineState().available;
}

/** Logout: the user's store is never opened again in this page until `unblockOfflineStore`. */
export function blockOfflineStore(userId: string): void {
  _blockedUsers.add(userId);
  _stores.delete(userId);
}

/** A sign-in (`onUserSignedIn`): the user's store may be opened again. */
export function unblockOfflineStore(userId: string): void {
  _blockedUsers.delete(userId);
}

export function isOfflineStoreBlocked(userId: string): boolean {
  return _blockedUsers.has(userId);
}

/** Opts the app into offline mode. Without this call nothing offline runs. */
export function configureOffline(config: OfflineConfig): void {
  _config = config;
  attachBrowserOnlineEvents();
  refreshOfflineDeviceState();
}

/**
 * Configured, the browser can keep the device copy (see `markOfflineUnavailable`), and offline
 * mode is on on this device for the signed-in user (see `requireOptIn`).
 */
export function isOfflineConfigured(): boolean {
  return _config !== null && isOfflineAvailable() && isOfflineEnabledOnDevice(_config.getUserId());
}

/**
 * Whether offline mode is on on this device for `userId`. Always true without
 * `OfflineConfig.requireOptIn`; otherwise the stored switch, false with no user.
 */
export function isOfflineEnabledOnDevice(userId?: string | null): boolean {
  if (!_config?.requireOptIn) return true;
  if (!userId) return false;
  let enabled = _enabledCache.get(userId);
  if (enabled === undefined) {
    enabled = readStorage(ENABLED_KEY_PREFIX + userId) === "1";
    _enabledCache.set(userId, enabled);
  }
  return enabled;
}

/** Stores the device switch for `userId` (`turnOnOffline` / `turnOffOffline`). */
export function setOfflineEnabledOnDevice(userId: string, enabled: boolean): void {
  writeStorage(ENABLED_KEY_PREFIX + userId, enabled ? "1" : null);
  _enabledCache.set(userId, enabled);
}

/** When `userId`'s last full sync on this device finished (epoch ms), or null. */
export function readOfflineLastSync(userId: string): number | null {
  const value = Number(readStorage(LAST_SYNC_KEY_PREFIX + userId));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** Stores, or with null removes, when `userId`'s last full sync finished. */
export function writeOfflineLastSync(userId: string, at: number | null): void {
  writeStorage(LAST_SYNC_KEY_PREFIX + userId, at === null ? null : String(at));
}

/**
 * Reads the device switch and the last sync time of the signed-in user into the offline state
 * (`enabled`, `lastSyncedAt`). Does nothing before `configureOffline`.
 */
export function refreshOfflineDeviceState(): void {
  if (!_config) return;
  const userId = _config.getUserId();
  if (userId) _enabledCache.delete(userId);
  setOfflineState({
    enabled: isOfflineEnabledOnDevice(userId),
    lastSyncedAt: userId ? readOfflineLastSync(userId) : null,
  });
}

export function getOfflineConfig(): OfflineConfig {
  if (!_config) throw new Error("Offline mode is not configured. Call configureOffline() first.");
  return _config;
}

/** The browser opener, set by the `./offline` entry's `configureOffline`. */
export function setDefaultDeviceStoreOpener(opener: (userId: string) => Promise<DeviceStore>): void {
  _defaultOpener = opener;
}

/** The URL the device worker loads SQLite from (`OfflineConfig.sqliteModuleUrl`). */
export function getSqliteModuleUrl(): string {
  return _config?.sqliteModuleUrl ?? DEFAULT_SQLITE_MODULE_URL;
}

/** The URL the device worker is started from (`OfflineConfig.deviceWorkerUrl`). */
export function getDeviceWorkerUrl(): string {
  return _config?.deviceWorkerUrl ?? DEFAULT_DEVICE_WORKER_URL;
}

/** Replaces how a user's device store is opened (tests pass `openMemoryDeviceStore`). */
export function setDeviceStoreOpener(opener: ((userId: string) => Promise<DeviceStore>) | null): void {
  _opener = opener;
  _stores.clear();
}

/**
 * The signed-in user's device store, opened once per user id. Only the signed-in user's file is
 * ever opened; with no signed-in user the request needs a connection.
 */
export async function getOfflineStore(): Promise<DeviceStore> {
  const userId = getOfflineConfig().getUserId();
  if (!userId) throw new NeedsConnectionError("No signed-in user");
  if (!isOfflineEnabledOnDevice(userId)) throw new DeviceStoreUnavailableError("Offline mode is off on this device");
  if (_blockedUsers.has(userId)) throw new DeviceStoreUnavailableError("The device copy was deleted at logout");
  if (!isOfflineAvailable()) throw new OfflineUnavailableError("it was found unable to keep the device copy");

  let store = _stores.get(userId);
  if (!store) {
    const opener = _opener ?? _defaultOpener;
    if (!opener) throw new Error("No device store opener: configure offline mode through the ./offline entry.");
    store = opener(userId).catch((error) => {
      if (error instanceof OfflineUnavailableError) markOfflineUnavailable(error);
      if (error instanceof NeedsConnectionError) throw error;
      console.warn("[offline] the device copy could not be opened", error);
      throw new DeviceStoreUnavailableError(
        `The device copy could not be opened: ${String((error as Error)?.message ?? error)}`,
      );
    });
    _stores.set(userId, store);
    store.catch(() => _stores.delete(userId));
  }
  return store;
}

/** Forgets the opened store of a user (logout, deleted file). */
export function forgetOfflineStore(userId: string): void {
  _stores.delete(userId);
}

/** Test helper: back to "not configured". */
export function resetOfflineConfig(): void {
  _config = null;
  _opener = null;
  _stores.clear();
  _blockedUsers.clear();
  _enabledCache.clear();
}
