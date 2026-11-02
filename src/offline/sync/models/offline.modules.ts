import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { RootSync } from "./RootSync";
import { OfflineChangeSet } from "./OfflineChangeSet";

/**
 * The offline resources, as one object an app that opts into offline mode
 * spreads into its `allModules` (same rationale as `analyticsModules`).
 * Neither has a pageUrl: these are not navigable resources.
 */
export const offlineModules = (factory: ModuleFactory) =>
  ({
    OfflineChangeSet: factory({ name: "offline-change-sets", model: OfflineChangeSet }),
    RootSync: factory({ name: "root-syncs", model: RootSync }),
  }) satisfies Record<string, ModuleWithPermissions>;
