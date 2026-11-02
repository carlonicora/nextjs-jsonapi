import { useSyncExternalStore } from "react";
import { getOfflineConfig, getOfflineStore, isOfflineConfigured } from "../config";
import { setOfflineState } from "../state";
import type { Conflict, DeviceStore } from "../store/DeviceStore";

const EMPTY: Conflict[] = [];
let _conflicts: Conflict[] = EMPTY;
const _listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

/** Re-reads the queue and the conflicts: updates `pending`/`conflicts` and the `useConflicts` list. */
export async function refreshOfflineCounts(store?: DeviceStore): Promise<void> {
  if (!store) {
    if (!isOfflineConfigured() || !getOfflineConfig().getUserId()) return;
    store = await getOfflineStore();
  }
  const entries = await store.queue();
  _conflicts = await store.conflicts();
  for (const listener of [..._listeners]) listener();
  setOfflineState({
    pending: entries.filter((entry) => entry.status !== "conflict").length,
    conflicts: _conflicts.length,
  });
}

/** The unresolved conflicts of the signed-in user's device. */
export function useConflicts(): Conflict[] {
  return useSyncExternalStore(
    subscribe,
    () => _conflicts,
    () => EMPTY,
  );
}
