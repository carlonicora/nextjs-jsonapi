import { configureOffline, resetOfflineConfig, setDeviceStoreOpener } from "../config";
import { resetOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import { openMemoryDeviceStore } from "../store/lifecycle";
import type { OfflineConfig, OfflineRoute } from "../types";

export class TestModel {
  id = "";
  name = "";
  rehydrate(data: { jsonApi: any }) {
    this.id = data.jsonApi.id;
    this.name = data.jsonApi.attributes?.name ?? "";
    return this;
  }
}

export const Roots = { name: "roots", model: TestModel };
export const Npcs = { name: "npcs", model: TestModel };
export const Factions = { name: "factions", model: TestModel };
export const Characters = { name: "characters", model: TestModel };
/** A second kind of root record (`extraRootKinds`) and its child type. */
export const Books = { name: "books", model: TestModel };
export const Pages = { name: "pages", model: TestModel };

export const page = (id: string, name: string, bookId: string) => ({
  type: "pages",
  id,
  attributes: { name },
  relationships: { book: { data: { type: "books", id: bookId } } },
});

export const npc = (id: string, name: string, rootId: string) => ({
  type: "npcs",
  id,
  attributes: { name, description: `${name} text` },
  relationships: { root: { data: { type: "roots", id: rootId } } },
});

export function offlineConfig(routes: OfflineRoute[] = []): OfflineConfig {
  return {
    getUserId: () => "u1",
    rootModule: Roots,
    types: [
      { module: Roots, fetch: "by-id", readOnly: false, serverOwnedFields: [] },
      { module: Npcs, fetch: "root-list", readOnly: false, serverOwnedFields: ["tldr"] },
      { module: Factions, fetch: "root-list", readOnly: false, serverOwnedFields: [] },
      { module: Characters, fetch: "root-list", readOnly: true, serverOwnedFields: [] },
    ],
    routes,
    listSyncRoots: async () => ["C", "D"],
    shellPath: () => "/offline-shell",
    syncIntervalMs: 300000,
  };
}

/** `offlineConfig` with the books root kind and its types. */
export function bookConfig(routes: OfflineRoute[] = []): OfflineConfig {
  const config = offlineConfig(routes);
  return {
    ...config,
    types: [
      ...config.types,
      { module: Books, fetch: "by-id", readOnly: false, serverOwnedFields: [] },
      { module: Pages, fetch: "root-list", readOnly: false, serverOwnedFields: [] },
    ],
    extraRootKinds: [{ module: Books, listSyncRoots: async () => ["b1"] }],
  };
}

/** Two NPCs and a faction in root record C, one NPC in D; the faction is linked to n1. */
export async function seededStore(): Promise<DeviceStore> {
  const store = await openMemoryDeviceStore();
  await store.putRecord({
    type: "roots",
    id: "C",
    rootId: "C",
    resource: { type: "roots", id: "C", attributes: { name: "Camp C" } },
    updatedAt: null,
  });
  await store.putRecord({ type: "npcs", id: "n1", rootId: "C", resource: npc("n1", "Alda", "C"), updatedAt: null });
  await store.putRecord({ type: "npcs", id: "n2", rootId: "C", resource: npc("n2", "brom", "C"), updatedAt: null });
  await store.putRecord({ type: "npcs", id: "n3", rootId: "D", resource: npc("n3", "Cora", "D"), updatedAt: null });
  await store.putRecord({
    type: "factions",
    id: "f1",
    rootId: "C",
    resource: { type: "factions", id: "f1", attributes: { name: "Guild" } },
    updatedAt: null,
  });
  await store.putRecord({
    type: "characters",
    id: "ch1",
    rootId: "C",
    resource: { type: "characters", id: "ch1", attributes: { name: "Hero" } },
    updatedAt: null,
  });
  await store.putLink({ fromType: "factions", fromId: "f1", toType: "npcs", toId: "n1", kind: "MEMBER_OF", props: {} });
  return store;
}

export async function setUpOffline(
  routes: OfflineRoute[] = [],
  buildConfig: (routes: OfflineRoute[]) => OfflineConfig = offlineConfig,
): Promise<DeviceStore> {
  resetOfflineState();
  resetOfflineConfig();
  const store = await seededStore();
  configureOffline(buildConfig(routes));
  setDeviceStoreOpener(async () => store);
  return store;
}

export function tearDownOffline(): void {
  resetOfflineConfig();
  resetOfflineState();
}
