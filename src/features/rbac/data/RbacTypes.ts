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

/**
 * Declarative-RBAC matrix types.
 *
 * Mirror of the library types defined in
 * `packages/nestjs-neo4jsonapi/src/foundations/rbac/dsl/types.ts`.
 * Frontend does not import from backend, so the shape is redefined here.
 *
 * A `PermToken` represents a single permission entry:
 *  - `scope: true`  → unconditional (e.g. full read of the module)
 *  - `scope: false` → nothing (rarely used, mostly a placeholder)
 *  - `scope: "path"` → scoped by relationship path (e.g. "orders.account")
 */
export type PermToken = { action: string; scope: boolean | string };

/**
 * A per-module block of the matrix. Always has a `default` row (permissions
 * granted to every role). Additional keys are role IDs → role-specific
 * permission tokens that are unioned with `default` to produce the effective
 * permissions for that role in that module.
 */
export type RbacModuleBlock = { default: PermToken[] } & Record<string, PermToken[]>;

/**
 * The full RBAC matrix as served by the dev endpoint `GET /_dev/rbac/matrix`.
 * Keys are module IDs; values are module blocks.
 */
export type RbacMatrix = Record<string, RbacModuleBlock>;
