"use client";

import { RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "../../../shadcnui";
import { ModuleInterface } from "../../module";
import { RoleInterface } from "../../role";
import { ACTION_TYPES, ActionType, COMPANY_ADMINISTRATOR_ROLE_ID } from "../data/RbacTypes";
import { RbacStateApi } from "../hooks/useRbacState";
import RbacPermissionPicker from "./RbacPermissionPicker";

interface RbacModuleTableProps {
  module: ModuleInterface;
  roles: RoleInterface[];
  stateApi: RbacStateApi;
}

const ACTION_LABELS: Record<ActionType, string> = {
  read: "Read",
  create: "Create",
  update: "Update",
  delete: "Delete",
};

export default function RbacModuleTable({ module, roles, stateApi }: RbacModuleTableProps) {
  const t = useTranslations();
  const handleReset = () => {
    stateApi.resetModulePermissions(module.id, roles);
  };

  return (
    <div className="rounded-lg border border-accent bg-card">
      {/* Module header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h4 className="text-sm font-medium">{module.name}</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <RotateCcwIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Permission grid - Rows = Default + Roles, Columns = Actions */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-40">{t("rbac.role")}</th>
              {ACTION_TYPES.map((actionType) => (
                <th
                  key={actionType}
                  className="px-2 py-2 text-center text-xs font-medium text-muted-foreground min-w-28"
                >
                  {ACTION_LABELS[actionType]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Default permissions row */}
            <tr className="border-b">
              <td className="px-4 py-1 text-xs font-medium text-muted-foreground">{t("rbac.defaults")}</td>
              {ACTION_TYPES.map((actionType) => {
                const defaultValue = stateApi.getModuleDefaultPermission(module.id, actionType) ?? false;
                const originalDefaultValue = module.permissions[actionType] ?? false;

                return (
                  <td key={actionType} className="px-2 py-1">
                    <RbacPermissionPicker
                      value={defaultValue}
                      originalValue={originalDefaultValue}
                      isRoleColumn={false}
                      knownSegments={stateApi.getModuleRelationshipPaths(module.id)}
                      onSetValue={(value) => stateApi.setModuleDefaultPermission(module.id, actionType, value)}
                    />
                  </td>
                );
              })}
            </tr>

            {/* Role rows (CompanyAdministrator hidden — always all-true in migration) */}
            {roles
              .filter((role) => role.id !== COMPANY_ADMINISTRATOR_ROLE_ID)
              .map((role) => (
                <tr key={role.id} className="border-b last:border-b-0">
                  <td className="px-4 py-1 text-xs font-medium text-muted-foreground">{role.name}</td>
                  {ACTION_TYPES.map((actionType) => {
                    const roleValue = stateApi.getRolePermission(role.id, module.id, actionType);
                    const originalMapping = stateApi.original?.permissionMappings.find(
                      (pm) => pm.roleId === role.id && pm.moduleId === module.id,
                    );
                    const originalRoleValue = originalMapping
                      ? (originalMapping.permissions[actionType] ?? null)
                      : undefined;

                    return (
                      <td key={actionType} className="px-2 py-1">
                        <RbacPermissionPicker
                          value={roleValue}
                          originalValue={originalRoleValue}
                          isRoleColumn={true}
                          knownSegments={stateApi.getModuleRelationshipPaths(module.id)}
                          onSetValue={(value) => stateApi.setRolePermission(role.id, module.id, actionType, value)}
                          onClear={() => stateApi.clearRolePermission(role.id, module.id, actionType)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { RbacModuleTable };
