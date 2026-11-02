import { getOfflineConfig, getOfflineStore } from "../config";
import { setOfflineState } from "../state";
import type { DeviceStore } from "../store/DeviceStore";
import { isRootLocked } from "../store/lifecycle";

let _lastSyncRoots: string[] = [];

/** Remembers the root records the last online `listSyncRoots()` returned. */
export function rememberSyncRoots(ids: string[]): void {
  _lastSyncRoots = [...ids];
}

/**
 * Every root record the device knows of: its stored root records, the root records with waiting
 * changes, and the last sync roots (a locked root record is never downloaded, so it may have
 * no stored record).
 */
export async function knownRootIds(store: DeviceStore): Promise<string[]> {
  const config = getOfflineConfig();
  const ids = new Set<string>(_lastSyncRoots);
  for (const record of await store.listRecords({ type: config.rootModule.name })) ids.add(record.id);
  for (const entry of await store.queue()) ids.add(entry.rootId);
  return [...ids].sort();
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
