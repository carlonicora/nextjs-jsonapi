import {
  forgetOfflineStore,
  getOfflineConfig,
  getOfflineStore,
  isOfflineAvailable,
  setOfflineEnabledOnDevice,
  writeOfflineLastSync,
} from "./config";
import { setOfflineState } from "./state";
import { deleteImagesCaches } from "./sync/artwork-cache";
import { stopOfflineRuntime } from "./sync/runtime";

function signedInUserId(): string {
  const userId = getOfflineConfig().getUserId();
  if (!userId) throw new Error("No signed-in user");
  return userId;
}

/**
 * Turns offline mode on on this device for the signed-in user (`OfflineConfig.requireOptIn`).
 * It does not start the runtime: the app starts it once `enabled` is true in the offline state.
 */
export async function turnOnOffline(): Promise<void> {
  const userId = signedInUserId();
  setOfflineEnabledOnDevice(userId, true);
  setOfflineState({ enabled: true });
  try {
    // Asks the browser not to evict the device copy. Best effort only.
    await navigator.storage?.persist?.();
  } catch {
    // Ignored: the copy works without it.
  }
}

/**
 * Turns offline mode off on this device for the signed-in user and deletes this device's copy
 * (database and cached images). Refuses, changing nothing, while the copy has changes still to
 * send: the answer then carries how many.
 */
export async function turnOffOffline(): Promise<{ turnedOff: true } | { turnedOff: false; pending: number }> {
  const userId = signedInUserId();

  if (isOfflineAvailable()) {
    let pending = 0;
    try {
      const store = await getOfflineStore();
      pending = (await store.queue()).length;
    } catch {
      // The copy cannot be opened here (held by another tab): the marker file written while
      // changes wait still says whether deleting it would lose any. The count is then unknown: 1.
      const { hasUnsentChanges } = await import("./store/lifecycle");
      if (await hasUnsentChanges(userId).catch(() => false)) pending = 1;
    }
    if (pending > 0) return { turnedOff: false, pending };
  }

  // Off first, so a sync still running cannot open, and so recreate, the deleted file.
  setOfflineEnabledOnDevice(userId, false);

  if (isOfflineAvailable()) {
    stopOfflineRuntime();
    try {
      const { deleteDeviceStore } = await import("./store/lifecycle");
      await deleteDeviceStore(userId);
      await deleteImagesCaches();
    } catch (error) {
      console.warn("[offline] the device copy could not be deleted", error);
    }
    forgetOfflineStore(userId);
  }

  writeOfflineLastSync(userId, null);
  setOfflineState({ enabled: false, syncProgress: null, lastSyncedAt: null, rootCount: null });
  return { turnedOff: true };
}
