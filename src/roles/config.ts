/**
 * Role ID configuration interface
 * Apps provide their role IDs via configureRoles()
 */
export interface RoleIdConfig {
  Administrator: string;
  CompanyAdministrator: string;
  [key: string]: string; // Allow additional roles
}

// Private storage for the injected role IDs
let _roleId: RoleIdConfig | null = null;
let _useDiscord: boolean = false;
let _useInternalAuth: boolean = true;

/**
 * Configure role IDs for the library
 * Call this at app startup to provide role ID constants
 *
 * @example
 * ```typescript
 * import { configureRoles } from "@carlonicora/nextjs-jsonapi";
 * import { RoleId } from "@phlow/shared";
 *
 * configureRoles(RoleId);
 * ```
 */
export function configureRoles(roleId: RoleIdConfig): void {
  _roleId = roleId;
}

export function configureDiscord(params: { useDiscord: boolean; useInternalAuth: boolean }): void {
  _useDiscord = params.useDiscord;
  _useInternalAuth = params.useInternalAuth;
}

/**
 * Get configured role IDs
 * @throws Error if roles not configured
 */
export function getRoleId(): RoleIdConfig {
  if (!_roleId) {
    throw new Error("Roles not configured. Call configureRoles() at app startup.");
  }
  return _roleId;
}

/**
 * Check if roles have been configured
 */
export function isRolesConfigured(): boolean {
  return _roleId !== null;
}

export function isDiscordConfigured(): boolean {
  return _useDiscord;
}

export function isInternalAuthConfigured(): boolean {
  return _useInternalAuth;
}
