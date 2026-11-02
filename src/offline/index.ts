// `@carlonicora/nextjs-jsonapi/offline` — the opt-in offline layer (C4).
// Importing this entry starts nothing: no store is opened, no worker created, no listener added,
// until the app calls `configureOffline(...)`.

export * from "./types";
export { configureOffline } from "./configure";
export {
  isOfflineConfigured,
  isOfflineAvailable,
  isOfflineEnabledOnDevice,
  refreshOfflineDeviceState,
  getOfflineConfig,
  getOfflineStore,
  forgetOfflineStore,
  setDeviceStoreOpener,
  DeviceStoreUnavailableError,
  OfflineUnavailableError,
} from "./config";
export { getOfflineState, subscribeOfflineState, setOfflineState, type OfflineState } from "./state";
export { useOfflineState, useNeedsConnection } from "./state-hooks";
export { matchRoute, matchPattern, type RouteMatch } from "./router";
export { localTransport } from "./local-transport";
export { writeThrough } from "./write-through";
export {
  needsConnectionAnswer,
  notFoundAnswer,
  errorAnswer,
  singleAnswer,
  orderedListAnswer,
  resourceListAnswer,
  mergeResource,
  resourceFromDocument,
  includedFor,
  listAnswer,
  searchRecords,
  orderRecords,
  linksOfKind,
  linkKindFor,
  linkKindsOf,
  SERVER_DEFAULT_ORDER_BY,
  type ListOptions,
  type ResourceDocumentData,
} from "./generic-answers";
export type { OfflineChangeResolution } from "./sync/models/OfflineChangeSetInterface";

// Device store (Task 5)
export type * from "./store/DeviceStore";
export {
  openDeviceStore,
  openMemoryDeviceStore,
  deleteDeviceStore,
  hasUnsentChanges,
  onUserSignedIn,
  isRootLocked,
} from "./store/lifecycle";

// Sync, sending changes, conflicts, runtime (Task 6)
export * from "./sync/sync-root";
export * from "./sync/drain-queue";
export * from "./sync/conflicts";
export * from "./sync/runtime";

// Logout (Task 7)
export { prepareOfflineLogout, finishOfflineLogout } from "./logout";

// Per-device switch (`OfflineConfig.requireOptIn`)
export { turnOnOffline, turnOffOffline } from "./device-switch";
