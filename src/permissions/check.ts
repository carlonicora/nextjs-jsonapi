import { Action, ModuleWithPermissions, PermissionModule, PermissionUser } from "./types";

/**
 * Check if a user has permission to perform an action on a module.
 *
 * @param module - The module to check permissions for
 * @param action - The action to check (read, create, update, delete)
 * @param user - The user with their modules and permissions
 * @param data - Optional data object for path-based permission checks
 */
export function checkPermissions<T extends PermissionUser>(params: {
  module: ModuleWithPermissions;
  action: Action;
  user: T;
  data?: any;
}): boolean {
  const selectedModule = params.user.modules.find((module: PermissionModule) => module.id === params.module.moduleId);

  if (!selectedModule) return false;
  const permissionConfig = selectedModule.permissions[params.action];

  if (!permissionConfig) return false;
  if (typeof permissionConfig === "boolean") return permissionConfig as boolean;

  if (!params.data) return true;

  try {
    const singlePermissionConfig = permissionConfig.split("|").map((p) => p.trim());

    for (const path of singlePermissionConfig) {
      if (getValueFromPath(params.data, path, params.user.id)) return true;
    }
    return false;
  } catch {
    if (typeof permissionConfig === "string") {
      return getValueFromPath(params.data, permissionConfig, params.user.id);
    }
  }

  return false;
}

/**
 * Check permissions from server context where user object is not fully available.
 *
 * @param module - The module to check permissions for
 * @param action - The action to check
 * @param userId - The user's ID
 * @param selectedModule - The selected module with its permissions
 * @param data - Optional data object for path-based permission checks
 */
export function checkPermissionsFromServer(params: {
  module: ModuleWithPermissions;
  action: Action;
  userId: string;
  selectedModule?: PermissionModule;
  data?: any;
}): boolean {
  if (!params.selectedModule) return false;
  const permissionConfig = params.selectedModule.permissions[params.action];

  if (!permissionConfig) return false;
  if (typeof permissionConfig === "boolean") return permissionConfig as boolean;

  if (!params.data) return true;

  try {
    const singlePermissionConfig = permissionConfig.split("|").map((p) => p.trim());

    for (const path of singlePermissionConfig) {
      if (getValueFromPath(params.data, path, params.userId)) return true;
    }
    return false;
  } catch {
    if (typeof permissionConfig === "string") {
      return getValueFromPath(params.data, permissionConfig, params.userId);
    }
  }

  return false;
}

/**
 * Traverse an object path and check if the value matches the user ID.
 * Handles nested objects, arrays, and various data structures.
 */
export function getValueFromPath(obj: any, path: string, userId: string): any {
  const parts = path.split(".");
  let current = obj;

  for (const part of parts) {
    if (!current) return false;

    if (Array.isArray(current)) {
      let found = false;
      for (const item of current) {
        const result = getValueFromPath(item, parts.slice(parts.indexOf(part)).join("."), userId);
        if (result === userId || result === true) {
          found = true;
          break;
        }
      }
      return found;
    } else if (current[part] !== undefined) {
      current = current[part];
    } else {
      return false;
    }
  }

  if (Array.isArray(current)) {
    // If final value is an array, check if any element has id matching userId
    return current.some((item: any) => {
      if (typeof item === "object" && item.id !== undefined) {
        return item.id.toString() === userId;
      }
      return item.toString() === userId;
    });
  }

  // Direct comparison for primitive values or objects with id
  if (typeof current === "object" && current.id !== undefined) {
    return current.id.toString() === userId;
  }

  return current.toString() === userId;
}
