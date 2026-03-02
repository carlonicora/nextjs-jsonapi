import { RoleInterface } from "../../role";
import { ActionType, ACTION_TYPES, COMPANY_ADMINISTRATOR_ROLE_ID, PermissionsMap } from "../data/RbacTypes";

const ACTION_ENUM_MAP: Record<ActionType, string> = {
  read: "Action.Read",
  create: "Action.Create",
  update: "Action.Update",
  delete: "Action.Delete",
};

function formatPermissionValue(value: boolean | string): string {
  if (value === true) return "true";
  if (value === false) return "false";
  return `"${value}"`;
}

function formatPermissionsFromMap(perms: PermissionsMap): string {
  const entries: string[] = [];
  for (const actionType of ACTION_TYPES) {
    const value = perms[actionType];
    if (value !== undefined) {
      entries.push(`{ type: ${ACTION_ENUM_MAP[actionType]}, value: ${formatPermissionValue(value)} }`);
    }
  }

  if (entries.length === 0) return "[]";
  if (entries.length === 1) return `[${entries[0]}]`;
  return `[\n        ${entries.join(",\n        ")},\n      ]`;
}

interface EffectiveFeature {
  id: string;
  name: string;
  isCore: boolean;
  modules: Array<{
    id: string;
    name: string;
    permissions: PermissionsMap;
  }>;
}

export function generateMigrationFile(params: {
  features: EffectiveFeature[];
  roles: RoleInterface[];
  rolePermissionsMap: Map<string, PermissionsMap>;
}): string {
  const { features, roles, rolePermissionsMap } = params;
  const lines: string[] = [];

  // Header
  lines.push(`/**`);
  lines.push(` * RBAC Migration - Generated on ${new Date().toISOString().split("T")[0]}`);
  lines.push(` * Contains features, modules, roles, and permission mappings.`);
  lines.push(` */`);
  lines.push(``);
  lines.push(`import { Action } from "src/common/enums/action";`);
  lines.push(`import { MigrationInterface } from "src/core/migrator/interfaces/migration.interface";`);
  lines.push(
    `import { featureQuery, moduleQuery, roleQuery, permissionQuery } from "src/neo4j.migrations/queries/migration.queries";`,
  );
  lines.push(``);
  lines.push(`export const migration: MigrationInterface[] = [`);

  // Features
  lines.push(`  /* ************************************ */`);
  lines.push(`  /* FEATURES                             */`);
  lines.push(`  /* ************************************ */`);
  for (const feature of features) {
    lines.push(`  {`);
    lines.push(`    query: featureQuery,`);
    lines.push(`    queryParams: {`);
    lines.push(`      featureId: "${feature.id}",`);
    lines.push(`      featureName: "${feature.name}",`);
    lines.push(`      isCore: ${feature.isCore},`);
    lines.push(`    },`);
    lines.push(`  },`);
  }

  // Modules grouped by feature
  for (const feature of features) {
    if (feature.modules.length === 0) continue;

    lines.push(`  /* ************************************ */`);
    lines.push(`  /* ${feature.name.toUpperCase().padEnd(37)} */`);
    lines.push(`  /* ************************************ */`);

    for (const mod of feature.modules) {
      lines.push(`  {`);
      lines.push(`    query: moduleQuery,`);
      lines.push(`    queryParams: {`);
      lines.push(`      moduleName: "${mod.name}",`);
      lines.push(`      moduleId: "${mod.id}",`);
      lines.push(`      featureId: "${feature.id}",`);
      lines.push(`      permissions: JSON.stringify(${formatPermissionsFromMap(mod.permissions)}),`);
      lines.push(`    },`);
      lines.push(`  },`);
    }
  }

  // Roles
  lines.push(`  /* ************************************ */`);
  lines.push(`  /* ROLES                                */`);
  lines.push(`  /* ************************************ */`);
  for (const role of roles) {
    lines.push(`  {`);
    lines.push(`    query: roleQuery,`);
    lines.push(`    queryParams: {`);
    lines.push(`      roleId: "${role.id}",`);
    lines.push(`      roleName: "${role.name}",`);
    lines.push(`      isSelectable: ${role.isSelectable},`);
    lines.push(`    },`);
    lines.push(`  },`);
  }

  // Permission mappings
  lines.push(`  /* ************************************ */`);
  lines.push(`  /* PERMISSIONS                          */`);
  lines.push(`  /* ************************************ */`);

  // Collect all module IDs for CompanyAdministrator (always all-true)
  const allModuleIds: string[] = [];
  for (const feature of features) {
    for (const mod of feature.modules) {
      allModuleIds.push(mod.id);
    }
  }

  const allTruePermissions: PermissionsMap = { read: true, create: true, update: true, delete: true };

  // Group by role for readability
  const permsByRole = new Map<string, Array<{ moduleId: string; permissions: PermissionsMap }>>();

  // CompanyAdministrator always gets all-true for every module
  permsByRole.set(
    COMPANY_ADMINISTRATOR_ROLE_ID,
    allModuleIds.map((moduleId) => ({ moduleId, permissions: allTruePermissions })),
  );

  for (const [key, perms] of rolePermissionsMap) {
    const [roleId, moduleId] = key.split(":");
    if (roleId === COMPANY_ADMINISTRATOR_ROLE_ID) continue; // already handled
    if (!permsByRole.has(roleId)) permsByRole.set(roleId, []);
    permsByRole.get(roleId)!.push({ moduleId, permissions: perms });
  }

  for (const [roleId, moduleMappings] of permsByRole) {
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      lines.push(`  // ${role.name}`);
    }

    for (const mapping of moduleMappings) {
      lines.push(`  {`);
      lines.push(`    query: permissionQuery,`);
      lines.push(`    queryParams: {`);
      lines.push(`      roleId: "${roleId}",`);
      lines.push(`      moduleId: "${mapping.moduleId}",`);
      lines.push(`      permissions: JSON.stringify(${formatPermissionsFromMap(mapping.permissions)}),`);
      lines.push(`    },`);
      lines.push(`  },`);
    }
  }

  lines.push(`];`);
  lines.push(``);

  return lines.join("\n");
}

export function downloadMigrationFile(content: string): void {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filename = `${dateStr}_001.ts`;

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
