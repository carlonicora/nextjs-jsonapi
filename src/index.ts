// Unified API (auto-detects environment)
export * from "./unified";

// Core exports for convenience
export * from "./core";

// Permissions
export * from "./permissions";

// I18n configuration (NOT hooks - those are in /hooks with "use client")
export { configureI18n } from "./i18n";
export type { I18nConfig } from "./i18n";

// Roles configuration
export { configureRoles, getRoleId, isRolesConfigured } from "./roles";
export type { RoleIdConfig } from "./roles";

// Auth configuration
export { configureAuth, getTokenHandler } from "./features/auth/config";
export type { TokenHandler, TokenParams } from "./features/auth/config";
