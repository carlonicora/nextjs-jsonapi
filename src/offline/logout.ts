import {
  blockOfflineStore,
  getOfflineConfig,
  getOfflineStore,
  isOfflineConfigured,
  setOfflineEnabledOnDevice,
  writeOfflineLastSync,
} from "./config";
import { setOfflineState } from "./state";
import { deleteImagesCaches } from "./sync/artwork-cache";
import { stopOfflineRuntime } from "./sync/runtime";

/**
 * How many changes the signed-in user's device still has to send (every queue entry: pending,
 * sending, in conflict or failed). The app warns before logging out when this is above 0.
 */
export async function prepareOfflineLogout(): Promise<{ pending: number }> {
  if (!isOfflineConfigured()) return { pending: 0 };
  if (!getOfflineConfig().getUserId()) return { pending: 0 };
  const store = await getOfflineStore();
  const entries = await store.queue();
  return { pending: entries.length };
}

/**
 * Deletes the user's device database and the cached artwork images. Call it right before logging
 * out. The runtime is stopped first and the store blocked until the next sign-in
 * (`onUserSignedIn`), so a sync still running cannot open, and so recreate, the deleted file.
 * The device switch (`requireOptIn`) is turned off too: after a logout nothing is downloaded again
 * until the user turns offline mode back on.
 */
export async function finishOfflineLogout(userId: string): Promise<void> {
  stopOfflineRuntime();
  blockOfflineStore(userId);
  const { deleteDeviceStore } = await import("./store/lifecycle");
  await deleteDeviceStore(userId);
  await deleteImagesCaches();
  setOfflineEnabledOnDevice(userId, false);
  writeOfflineLastSync(userId, null);
  setOfflineState({ enabled: false, syncProgress: null, lastSyncedAt: null, rootCount: null });
}
