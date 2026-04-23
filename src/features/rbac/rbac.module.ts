import { ModuleFactory } from "../../permissions";
import { PermissionMapping } from "./data/PermissionMapping";
import { ModulePaths } from "./data/ModulePaths";
import { RbacMatrixModel } from "./data/RbacMatrixModel";

export const PermissionMappingModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/rbac/permission-mappings",
    name: "rbac/permission-mappings",
    model: PermissionMapping,
    moduleId: "f3aef019-c75f-4ca8-a9b5-a7495d901fc8",
  });

export const ModulePathsModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/rbac/module-paths",
    name: "rbac/module-paths",
    model: ModulePaths,
    moduleId: "f4fb3f01-a947-4c2e-89c8-354a518cdb13",
  });

/**
 * Dev-only matrix module. The `name` is the URL path of the dev singleton
 * endpoint (`GET|PUT _dev/rbac/matrix`), NOT a plural resource collection.
 * This module is only useful when the backend is running with `devMode: true`
 * on `RbacModule.register`.
 */
export const RbacMatrixModule = (factory: ModuleFactory) =>
  factory({
    name: "_dev/rbac/matrix",
    model: RbacMatrixModel,
  });
