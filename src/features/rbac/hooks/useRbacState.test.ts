import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRbacState } from "./useRbacState";
import { FeatureInterface } from "../../feature";
import { RoleInterface } from "../../role";
import { PermissionMappingInterface } from "../data/PermissionMappingInterface";
import { ModulePathsInterface } from "../data/ModulePathsInterface";
import { ModuleInterface } from "../../module";

const mockModule: ModuleInterface = {
  id: "mod-1",
  type: "modules",
  included: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  name: "pipelines",
  permissions: { create: true, read: true, update: true, delete: false },
} as ModuleInterface;

const mockFeatures: FeatureInterface[] = [
  {
    id: "feat-1",
    type: "features",
    included: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "CRM",
    isCore: false,
    modules: [mockModule],
  } as FeatureInterface,
];

const mockRoles: RoleInterface[] = [
  {
    id: "role-1",
    type: "roles",
    included: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "Manager",
    description: "",
    isSelectable: true,
    requiredFeature: undefined,
  } as unknown as RoleInterface,
  {
    id: "role-2",
    type: "roles",
    included: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    name: "Viewer",
    description: "",
    isSelectable: true,
    requiredFeature: undefined,
  } as unknown as RoleInterface,
];

const mockPermissionMappings: PermissionMappingInterface[] = [];

const mockModulePaths: ModulePathsInterface[] = [
  {
    id: "mod-1",
    type: "module-paths",
    included: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    moduleId: "mod-1",
    paths: ["owner", "company.user"],
  } as unknown as ModulePathsInterface,
];

function initHook() {
  const { result } = renderHook(() => useRbacState());
  act(() => {
    result.current.init(mockFeatures, mockRoles, mockPermissionMappings, mockModulePaths);
  });
  return result;
}

describe("useRbacState", () => {
  describe("Scenario: Initialize state from fetched data", () => {
    it("should initialize with features and roles", () => {
      const result = initHook();

      expect(result.current.original).not.toBeNull();
      expect(result.current.original!.features).toHaveLength(1);
      expect(result.current.original!.features[0].name).toBe("CRM");
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe("Scenario: Set module default permission", () => {
    it("should update default permission and mark as dirty", () => {
      const result = initHook();

      act(() => {
        result.current.setModuleDefaultPermission("mod-1", "delete", true);
      });

      expect(result.current.getModuleDefaultPermission("mod-1", "delete")).toBe(true);
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe("Scenario: Set role-specific permission override", () => {
    it("should set role permission for a specific module and action", () => {
      const result = initHook();

      act(() => {
        result.current.setRolePermission("role-1", "mod-1", "create", false);
      });

      expect(result.current.getRolePermission("role-1", "mod-1", "create")).toBe(false);
      expect(result.current.isDirty).toBe(true);
    });

    it("should support string path values for role permissions", () => {
      const result = initHook();

      act(() => {
        result.current.setRolePermission("role-2", "mod-1", "update", "owner");
      });

      expect(result.current.getRolePermission("role-2", "mod-1", "update")).toBe("owner");
    });
  });

  describe("Scenario: Clear role permission (inherit from default)", () => {
    it("should clear a role permission so it inherits from default", () => {
      const result = initHook();

      act(() => {
        result.current.setRolePermission("role-1", "mod-1", "create", false);
      });

      act(() => {
        result.current.clearRolePermission("role-1", "mod-1", "create");
      });

      expect(result.current.getRolePermission("role-1", "mod-1", "create")).toBeNull();
    });
  });

  describe("Scenario: Reset to initial state", () => {
    it("should reset all changes and clear dirty flag", () => {
      const result = initHook();

      act(() => {
        result.current.setModuleDefaultPermission("mod-1", "delete", true);
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDirty).toBe(false);
      expect(result.current.getModuleDefaultPermission("mod-1", "delete")).toBe(false);
    });
  });

  describe("Scenario: Get effective configuration for migration", () => {
    it("should return complete configuration with all changes applied", () => {
      const result = initHook();

      act(() => {
        result.current.setRolePermission("role-1", "mod-1", "delete", true);
      });

      const config = result.current.getEffectiveConfiguration();
      expect(config).not.toBeNull();
      expect(config!.features).toHaveLength(1);
      expect(config!.roles).toHaveLength(2);
      expect(config!.rolePermissionsMap).toBeInstanceOf(Map);
    });
  });
});
