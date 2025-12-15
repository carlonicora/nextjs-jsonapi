// NOTE: "./unified" is NOT exported here because it contains dynamic imports
// of server code which cannot be bundled with client components.
// Services use unified internally via relative imports.

// Core exports for convenience
export * from "./core";

// Permissions
export * from "./permissions";

// JSON:API configuration (client-safe)
export { configureJsonApi, getApiUrl, getAppUrl, getTrackablePages } from "./client/config";

// I18n configuration (NOT hooks - those are in /hooks with "use client")
export { configureI18n } from "./i18n";
export type { I18nConfig } from "./i18n";

// Roles configuration
export { configureDiscord } from "./discord";
export { configureRoles, getRoleId, isRolesConfigured } from "./roles";
export type { RoleIdConfig } from "./roles";

// Auth configuration
export { configureAuth, getTokenHandler } from "./features/auth/config";
export type { TokenHandler, TokenParams } from "./features/auth/config";
