import { describe, it, expect, vi } from "vitest";
import { generateMigrationFile, downloadMigrationFile } from "./RbacMigrationGenerator";
import { RoleInterface } from "../../role";
import { PermissionsMap } from "../data/RbacTypes";

const mockFeatures = [
  {
    id: "feat-1",
    name: "CRM",
    isCore: false,
    modules: [
      {
        id: "mod-1",
        name: "pipelines",
        permissions: { create: true, read: true, update: true, delete: false } as PermissionsMap,
      },
    ],
  },
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
];

const mockRolePermissionsMap = new Map<string, PermissionsMap>();
mockRolePermissionsMap.set("role-1:mod-1", { create: true, read: true, update: true, delete: true });

describe("RbacMigrationGenerator", () => {
  describe("Scenario: Generate valid migration file content", () => {
    it("should produce a valid TypeScript file with MigrationInterface structure", () => {
      const content = generateMigrationFile({
        features: mockFeatures,
        roles: mockRoles,
        rolePermissionsMap: mockRolePermissionsMap,
      });

      expect(content).toContain("MigrationInterface");
      expect(content).toContain("moduleQuery");
      expect(content).toContain("pipelines");
      expect(content).toContain("permissionQuery");
    });

    it("should include default permissions for each module", () => {
      const content = generateMigrationFile({
        features: mockFeatures,
        roles: mockRoles,
        rolePermissionsMap: mockRolePermissionsMap,
      });

      expect(content).toContain("Action.Create");
      expect(content).toContain("Action.Read");
      expect(content).toContain("Action.Update");
      expect(content).toContain("Action.Delete");
    });
  });

  describe("Scenario: CompanyAdministrator always gets all-true permissions", () => {
    it("should include CompanyAdministrator role with all true permissions", () => {
      const content = generateMigrationFile({
        features: mockFeatures,
        roles: mockRoles,
        rolePermissionsMap: mockRolePermissionsMap,
      });

      expect(content).toContain("2e1eee00-6cba-4506-9059-ccd24e4ea5b0");
    });
  });

  describe("Scenario: Migration file contains role-specific overrides", () => {
    it("should include role permission overrides in generated queries", () => {
      const content = generateMigrationFile({
        features: mockFeatures,
        roles: mockRoles,
        rolePermissionsMap: mockRolePermissionsMap,
      });

      expect(content).toContain("Manager");
      expect(content).toContain("permissionQuery");
    });
  });

  describe("Scenario: Download triggers browser download", () => {
    it("should create a blob and trigger download", () => {
      const mockAnchor = {
        href: "",
        download: "",
        click: vi.fn(),
        style: {},
      };
      const mockCreateElement = vi.fn().mockReturnValue(mockAnchor);
      const mockCreateObjectURL = vi.fn().mockReturnValue("blob:url");
      const mockRevokeObjectURL = vi.fn();
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();

      vi.stubGlobal("document", {
        createElement: mockCreateElement,
        body: { appendChild: mockAppendChild, removeChild: mockRemoveChild },
      });
      vi.stubGlobal("URL", {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      });
      vi.stubGlobal("Blob", vi.fn());

      downloadMigrationFile("test content");

      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockAnchor.click).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
