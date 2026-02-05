// NOTE: "./unified" is NOT exported here because it contains dynamic imports
// of server code which cannot be bundled with client components.
// Services use unified internally via relative imports.

// Core exports for convenience
export * from "./core";

// Permissions
export * from "./permissions";

// JSON:API configuration (client-safe)
export { configureJsonApi, getApiUrl, getAppUrl, getTrackablePages, getStripePublishableKey } from "./client/config";

// I18n configuration (NOT hooks - those are in /hooks with "use client")
export { configureI18n } from "./i18n";
export type { I18nConfig } from "./i18n";

// Login configuration (multi-provider auth)
export { configureLogin } from "./login";
export type { LoginConfig } from "./login";

// Roles configuration
export { configureRoles, getRoleId, isRolesConfigured } from "./roles";
export type { RoleIdConfig } from "./roles";

// Auth configuration
export { configureAuth, getTokenHandler } from "./features/auth/config";
export type { TokenHandler, TokenParams } from "./features/auth/config";

// Waitlist configuration
export { configureWaitlist, getWaitlistConfig } from "./features/waitlist/config/waitlist.config";
export type {
  WaitlistConfig,
  QuestionnaireField,
  QuestionnaireFieldType,
  QuestionnaireOption,
} from "./features/waitlist/config/waitlist.config";

// Referral configuration
export { configureReferral, getReferralConfig, isReferralEnabled } from "./features/referral/config";
export type { ReferralConfig } from "./features/referral/config";

// Toast utilities
export { showToast, showError, dismissToast, showCustomToast, type ToastOptions } from "./utils/toast";
