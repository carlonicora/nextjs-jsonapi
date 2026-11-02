import { useSyncExternalStore } from "react";
import { getOfflineState, SERVER_SNAPSHOT, subscribeOfflineState, type OfflineState } from "./state";

export function useOfflineState(): OfflineState {
  return useSyncExternalStore(subscribeOfflineState, getOfflineState, () => SERVER_SNAPSHOT);
}

export function useNeedsConnection(): boolean {
  return !useOfflineState().online;
}
