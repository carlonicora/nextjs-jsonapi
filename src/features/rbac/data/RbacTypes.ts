export const COMPANY_ADMINISTRATOR_ROLE_ID = "2e1eee00-6cba-4506-9059-ccd24e4ea5b0";

export type PermissionValue = boolean | string;

export type ActionType = "read" | "create" | "update" | "delete";

export const ACTION_TYPES: ActionType[] = ["read", "create", "update", "delete"];

/** The permissions object shape used by both Module and PermissionMapping entities */
export type PermissionsMap = {
  create?: PermissionValue;
  read?: PermissionValue;
  update?: PermissionValue;
  delete?: PermissionValue;
};
