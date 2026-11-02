import { getOfflineConfig, getOfflineStore, rootKinds } from "../config";
import { setOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import { isRootLocked } from "../store/lifecycle";

let _lastSyncRoots: string[] = [];
let _lastExtraSyncRoots: string[] = [];

/**
 * Remembers the root records the last online sync listed: `ids` of every kind, `extraIds` those
 * of the `extraRootKinds` among them.
 */
export function rememberSyncRoots(ids: string[], extraIds: string[] = []): void {
  _lastSyncRoots = [...ids];
  _lastExtraSyncRoots = [...extraIds];
}

/**
 * Every root record the device knows of, of every kind: its stored root records, the root records
 * with waiting changes, and the last sync roots (a locked root record is never downloaded, so it
 * may have no stored record).
 */
export async function knownRootIds(store: DeviceStore): Promise<string[]> {
  const config = getOfflineConfig();
  const ids = new Set<string>(_lastSyncRoots);
  for (const kind of rootKinds(config)) {
    for (const record of await store.listRecords({ type: kind.module.name })) ids.add(record.id);
  }
  for (const entry of await store.queue()) ids.add(entry.rootId);
  return [...ids].sort();
}

/** The known root records of the `extraRootKinds`: stored, or listed by the last sync. */
async function extraRootIds(store: DeviceStore): Promise<Set<string>> {
  const ids = new Set<string>(_lastExtraSyncRoots);
  for (const kind of getOfflineConfig().extraRootKinds ?? []) {
    for (const record of await store.listRecords({ type: kind.module.name })) ids.add(record.id);
  }
  return ids;
}

/** `knownRootIds` without the root records of the `extraRootKinds` (the primary kind only). */
export async function knownPrimaryRootIds(store: DeviceStore): Promise<string[]> {
  const extra = await extraRootIds(store);
  return (await knownRootIds(store)).filter((id) => !extra.has(id));
}

/** Recomputes `lockedRootIds` from the stored sync states, now. */
export async function refreshLockedRoots(): Promise<void> {
  const config = getOfflineConfig();
  if (!config.getUserId()) return;
  const store = await getOfflineStore();
  const now = new Date();
  const locked: string[] = [];
  for (const id of await knownRootIds(store)) {
    if (isRootLocked(await store.getSyncState(id), now)) locked.push(id);
  }
  setOfflineState({ lockedRootIds: locked });
}
