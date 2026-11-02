import { configureOffline as configureOfflineLayer, setDefaultDeviceStoreOpener } from "./config";
import type { OfflineConfig } from "./types";

/**
 * Opts the app into offline mode (the `./offline` entry's `configureOffline`). It also registers
 * the browser device-store opener, so the store, the worker and SQLite are reachable only from
 * this entry, never from the request path every other entry shares.
 */
export function configureOffline(config: OfflineConfig): void {
  setDefaultDeviceStoreOpener((userId) =>
    import("./store/lifecycle").then((lifecycle) => lifecycle.openDeviceStore(userId)),
  );
  configureOfflineLayer(config);
}
