"use client";

import { FeatureInterface } from "../../feature";
import { ModuleInterface } from "../../module";
import { RoleInterface } from "../../role";
import { useCallback, useMemo, useReducer } from "react";
import { ModulePathsInterface } from "../data/ModulePathsInterface";
import { PermissionMappingInterface } from "../data/PermissionMappingInterface";
import { ActionType, ACTION_TYPES, PermissionsMap, PermissionValue } from "../data/RbacTypes";

// --- State shape ---

interface OriginalData {
  features: FeatureInterface[];
  roles: RoleInterface[];
  permissionMappings: PermissionMappingInterface[];
  moduleRelationshipPaths: Map<string, string[]>;
}

interface RbacState {
  original: OriginalData | null;
  // Edited values: only store overrides from original
  featureIsCore: Map<string, boolean>;
  modulePermissions: Map<string, PermissionsMap>; // moduleId -> permissions overrides
  rolePermissions: Map<string, PermissionsMap | null>; // "roleId:moduleId" -> permissions (null = cleared/inherit)
}

// --- Actions ---

type RbacAction =
  | { type: "INIT"; payload: OriginalData }
  | { type: "SET_FEATURE_IS_CORE"; featureId: string; isCore: boolean }
  | { type: "SET_MODULE_DEFAULT_PERMISSION"; moduleId: string; actionType: ActionType; value: PermissionValue }
  | { type: "SET_ROLE_PERMISSION"; roleId: string; moduleId: string; actionType: ActionType; value: PermissionValue }
  | { type: "CLEAR_ROLE_PERMISSION"; roleId: string; moduleId: string; actionType: ActionType }
  | { type: "CLEAR_ALL_ROLE_PERMISSIONS"; roleId: string; moduleId: string }
  | { type: "RESET" };

function createInitialState(): RbacState {
  return {
    original: null,
    featureIsCore: new Map(),
    modulePermissions: new Map(),
    rolePermissions: new Map(),
  };
}

function findModule(features: FeatureInterface[], moduleId: string): ModuleInterface | undefined {
  for (const feature of features) {
    for (const mod of feature.modules) {
      if (mod.id === moduleId) return mod;
    }
  }
  return undefined;
}

function findPermissionMapping(
  mappings: PermissionMappingInterface[],
  roleId: string,
  moduleId: string,
): PermissionMappingInterface | undefined {
  return mappings.find((pm) => pm.roleId === roleId && pm.moduleId === moduleId);
}

function rbacReducer(state: RbacState, action: RbacAction): RbacState {
  switch (action.type) {
    case "INIT": {
      return {
        ...createInitialState(),
        original: action.payload,
      };
    }

    case "SET_FEATURE_IS_CORE": {
      const newMap = new Map(state.featureIsCore);
      const originalFeature = state.original?.features.find((f) => f.id === action.featureId);
      if (originalFeature && originalFeature.isCore === action.isCore) {
        newMap.delete(action.featureId);
      } else {
        newMap.set(action.featureId, action.isCore);
      }
      return { ...state, featureIsCore: newMap };
    }

    case "SET_MODULE_DEFAULT_PERMISSION": {
      const newMap = new Map(state.modulePermissions);
      const originalModule = state.original ? findModule(state.original.features, action.moduleId) : undefined;
      const current = newMap.get(action.moduleId) ?? { ...originalModule?.permissions };
      const updated = { ...current, [action.actionType]: action.value };
      newMap.set(action.moduleId, updated);
      return { ...state, modulePermissions: newMap };
    }

    case "SET_ROLE_PERMISSION": {
      const key = `${action.roleId}:${action.moduleId}`;
      const newMap = new Map(state.rolePermissions);
      const existing = newMap.get(key);

      if (existing === null) {
        // Was cleared, start fresh
        newMap.set(key, { [action.actionType]: action.value });
      } else {
        const originalMapping = state.original
          ? findPermissionMapping(state.original.permissionMappings, action.roleId, action.moduleId)
          : undefined;
        const current = existing ?? (originalMapping ? { ...originalMapping.permissions } : {});
        newMap.set(key, { ...current, [action.actionType]: action.value });
      }
      return { ...state, rolePermissions: newMap };
    }

    case "CLEAR_ROLE_PERMISSION": {
      const key = `${action.roleId}:${action.moduleId}`;
      const newMap = new Map(state.rolePermissions);
      const existing = newMap.get(key);
      if (existing === null) return state;

      const originalMapping = state.original
        ? findPermissionMapping(state.original.permissionMappings, action.roleId, action.moduleId)
        : undefined;
      const current = existing ?? (originalMapping ? { ...originalMapping.permissions } : {});
      const updated = { ...current };
      delete updated[action.actionType];

      // If all actions cleared, set to null (inherit all)
      const hasAnyPermission = ACTION_TYPES.some((at) => updated[at] !== undefined);
      newMap.set(key, hasAnyPermission ? updated : null);
      return { ...state, rolePermissions: newMap };
    }

    case "CLEAR_ALL_ROLE_PERMISSIONS": {
      const key = `${action.roleId}:${action.moduleId}`;
      const newMap = new Map(state.rolePermissions);
      newMap.set(key, null);
      return { ...state, rolePermissions: newMap };
    }

    case "RESET":
      return {
        ...createInitialState(),
        original: state.original,
      };

    default:
      return state;
  }
}

// --- Hook ---

export function useRbacState() {
  const [state, dispatch] = useReducer(rbacReducer, undefined, createInitialState);

  const init = useCallback(
    (
      features: FeatureInterface[],
      roles: RoleInterface[],
      permissionMappings: PermissionMappingInterface[],
      modulePaths: ModulePathsInterface[],
    ) => {
      const moduleRelationshipPaths = new Map<string, string[]>();
      for (const mp of modulePaths) {
        moduleRelationshipPaths.set(mp.moduleId, mp.paths);
      }
      dispatch({ type: "INIT", payload: { features, roles, permissionMappings, moduleRelationshipPaths } });
    },
    [],
  );

  const setFeatureIsCore = useCallback((featureId: string, isCore: boolean) => {
    dispatch({ type: "SET_FEATURE_IS_CORE", featureId, isCore });
  }, []);

  const setModuleDefaultPermission = useCallback((moduleId: string, actionType: ActionType, value: PermissionValue) => {
    dispatch({ type: "SET_MODULE_DEFAULT_PERMISSION", moduleId, actionType, value });
  }, []);

  const setRolePermission = useCallback(
    (roleId: string, moduleId: string, actionType: ActionType, value: PermissionValue) => {
      dispatch({ type: "SET_ROLE_PERMISSION", roleId, moduleId, actionType, value });
    },
    [],
  );

  const clearRolePermission = useCallback((roleId: string, moduleId: string, actionType: ActionType) => {
    dispatch({ type: "CLEAR_ROLE_PERMISSION", roleId, moduleId, actionType });
  }, []);

  const clearAllRolePermissions = useCallback((roleId: string, moduleId: string) => {
    dispatch({ type: "CLEAR_ALL_ROLE_PERMISSIONS", roleId, moduleId });
  }, []);

  const resetModulePermissions = useCallback((moduleId: string, roles: { id: string }[]) => {
    // Set all default permissions to true
    for (const actionType of ACTION_TYPES) {
      dispatch({ type: "SET_MODULE_DEFAULT_PERMISSION", moduleId, actionType, value: true });
    }
    // Clear all role permissions for this module (set to inherit / "-")
    for (const role of roles) {
      dispatch({ type: "CLEAR_ALL_ROLE_PERMISSIONS", roleId: role.id, moduleId });
    }
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  // --- Getters ---

  const getFeatureIsCore = useCallback(
    (featureId: string): boolean => {
      if (state.featureIsCore.has(featureId)) return state.featureIsCore.get(featureId)!;
      const feature = state.original?.features.find((f) => f.id === featureId);
      return feature?.isCore ?? false;
    },
    [state.featureIsCore, state.original],
  );

  const getModuleDefaultPermission = useCallback(
    (moduleId: string, actionType: ActionType): PermissionValue | undefined => {
      const edited = state.modulePermissions.get(moduleId);
      if (edited && edited[actionType] !== undefined) return edited[actionType];
      if (!state.original) return undefined;
      const mod = findModule(state.original.features, moduleId);
      return mod?.permissions[actionType];
    },
    [state.modulePermissions, state.original],
  );

  const getRolePermission = useCallback(
    (roleId: string, moduleId: string, actionType: ActionType): PermissionValue | undefined | null => {
      const key = `${roleId}:${moduleId}`;
      if (state.rolePermissions.has(key)) {
        const perms = state.rolePermissions.get(key);
        if (perms === null || perms === undefined) return null; // explicitly cleared = inherit
        return perms[actionType] ?? null; // has role mapping but no entry for this action = inherit
      }
      // Fall back to original
      if (!state.original) return undefined;
      const mapping = findPermissionMapping(state.original.permissionMappings, roleId, moduleId);
      if (!mapping) return undefined; // no mapping exists
      return mapping.permissions[actionType] ?? null;
    },
    [state.rolePermissions, state.original],
  );

  const isDirty = useMemo(() => {
    return state.featureIsCore.size > 0 || state.modulePermissions.size > 0 || state.rolePermissions.size > 0;
  }, [state.featureIsCore, state.modulePermissions, state.rolePermissions]);

  // Build the full effective configuration for migration generation
  const getEffectiveConfiguration = useCallback(() => {
    if (!state.original) return null;

    const features = state.original.features.map((f) => ({
      id: f.id,
      name: f.name,
      isCore: state.featureIsCore.has(f.id) ? state.featureIsCore.get(f.id)! : f.isCore,
      modules: f.modules.map((m) => {
        const editedPerms = state.modulePermissions.get(m.id);
        return {
          id: m.id,
          name: m.name,
          permissions: editedPerms ?? m.permissions,
        };
      }),
    }));

    // Build role permissions map
    const rolePermissionsMap = new Map<string, PermissionsMap>();

    // Start with originals
    for (const pm of state.original.permissionMappings) {
      rolePermissionsMap.set(`${pm.roleId}:${pm.moduleId}`, { ...pm.permissions });
    }

    // Apply edits
    for (const [key, perms] of state.rolePermissions) {
      if (perms === null) {
        rolePermissionsMap.delete(key);
      } else {
        rolePermissionsMap.set(key, perms);
      }
    }

    return {
      features,
      roles: state.original.roles,
      rolePermissionsMap,
    };
  }, [state]);

  const getModuleRelationshipPaths = useCallback(
    (moduleId: string): string[] => {
      return state.original?.moduleRelationshipPaths.get(moduleId) ?? [];
    },
    [state.original],
  );

  return {
    original: state.original,
    isDirty,
    init,
    setFeatureIsCore,
    setModuleDefaultPermission,
    setRolePermission,
    clearRolePermission,
    clearAllRolePermissions,
    resetModulePermissions,
    reset,
    getFeatureIsCore,
    getModuleDefaultPermission,
    getRolePermission,
    getEffectiveConfiguration,
    getModuleRelationshipPaths,
  };
}

export type RbacStateApi = ReturnType<typeof useRbacState>;
