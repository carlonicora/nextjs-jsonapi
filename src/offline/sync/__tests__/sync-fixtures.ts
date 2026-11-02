import { vi } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { configureOffline, resetOfflineConfig, setDeviceStoreOpener } from "../../config";
import { resetOfflineState } from "../../state";
import type { DeviceStore } from "../../store/DeviceStore";
import { openMemoryDeviceStore } from "../../store/lifecycle";
import type { OfflineConfig } from "../../types";
import { offlineModules } from "../models/offline.modules";

export class TestModel {
  rehydrate() {
    return this;
  }
}

export const Roots = { name: "roots", model: TestModel };
export const Npcs = { name: "npcs", model: TestModel };
export const Artworks = { name: "artworks", model: TestModel };
export const Templates = { name: "templates", model: TestModel };

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

export function registerOfflineModules(): void {
  for (const [key, module] of Object.entries(offlineModules(moduleFactory))) {
    try {
      ModuleRegistry.get(key as any);
    } catch {
      ModuleRegistry.register(key, module as ApiRequestDataTypeInterface);
    }
  }
}

export const npc = (id: string, name: string, rootId = "C") => ({
  type: "npcs",
  id,
  attributes: { name },
  relationships: { root: { data: { type: "roots", id: rootId } } },
});

export const artwork = (id: string, imageUrl: string) => ({
  type: "artworks",
  id,
  attributes: { name: id, imageUrl },
});

export function syncTestConfig(overrides: Partial<OfflineConfig> = {}): OfflineConfig {
  return {
    getUserId: () => "u1",
    rootModule: Roots,
    types: [
      { module: Roots, fetch: "by-id", readOnly: false, serverOwnedFields: [] },
      { module: Npcs, fetch: "root-list", readOnly: false, serverOwnedFields: [] },
      { module: Artworks, fetch: "by-id", readOnly: false, serverOwnedFields: [] },
      { module: Templates, fetch: "by-id", readOnly: true, serverOwnedFields: [] },
    ],
    routes: [],
    listSyncRoots: async () => ["C"],
    shellPath: (locale) => (locale === "it" ? "/it/offline-shell" : "/offline-shell"),
    syncIntervalMs: 300000,
    ...overrides,
  };
}

export async function setUpSync(overrides: Partial<OfflineConfig> = {}): Promise<DeviceStore> {
  resetOfflineState();
  resetOfflineConfig();
  registerOfflineModules();
  const store = await openMemoryDeviceStore();
  configureOffline(syncTestConfig(overrides));
  setDeviceStoreOpener(async () => store);
  return store;
}

export function tearDownSync(): void {
  resetOfflineConfig();
  resetOfflineState();
}

/** A minimal Cache Storage: one map per cache name. */
export function fakeCacheStorage(initial: string[] = ["wyrdli-offline-1"]) {
  const caches = new Map<string, Map<string, unknown>>();
  for (const name of initial) caches.set(name, new Map());
  const cacheOf = (name: string) => {
    if (!caches.has(name)) caches.set(name, new Map());
    const entries = caches.get(name)!;
    return {
      match: vi.fn(async (url: string) => entries.get(url)),
      put: vi.fn(async (url: string, response: unknown) => void entries.set(url, response)),
      delete: vi.fn(async (url: string) => entries.delete(url)),
    };
  };
  return {
    caches,
    storage: {
      keys: vi.fn(async () => [...caches.keys()]),
      open: vi.fn(async (name: string) => cacheOf(name)),
      delete: vi.fn(async (name: string) => caches.delete(name)),
    },
  };
}
