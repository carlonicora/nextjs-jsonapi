// Core interfaces
export * from "./env";
export * from "./interfaces";

// Abstracts
export * from "./abstracts";

// Factories
export * from "./factories";

// Registry
export * from "./registry";

// Endpoint builder
export * from "./endpoint";

// Field selectors
export * from "./fields";

// Core utilities
export * from "./utils";

// Top-level interfaces (breadcrumb, d3)
export * from "../interfaces";

// Top-level utilities (cn, date-formatter, schemas, etc.)
export * from "../utils";

// Permissions
export * from "../permissions";

// Feature data classes, interfaces, and modules
export * from "../features/auth/auth.module";
export * from "../features/auth/totp-authenticator.module";
export * from "../features/auth/totp-setup.module";
export * from "../features/auth/totp-verify.module";
export * from "../features/auth/totp-verify-login.module";
export * from "../features/auth/passkey.module";
export * from "../features/auth/passkey-registration-options.module";
export * from "../features/auth/passkey-registration-verify.module";
export * from "../features/auth/passkey-rename.module";
export * from "../features/auth/passkey-verify-login.module";
export * from "../features/auth/passkey-authentication-options.module";
export * from "../features/auth/two-factor-enable.module";
export * from "../features/auth/two-factor-challenge.module";
export * from "../features/auth/two-factor-status.module";
export * from "../features/auth/backup-code-verify.module";
export * from "../features/auth/data";
export * from "../features/auth/enums";
export * from "../features/billing/data";
export * from "../features/billing/modules";
export * from "../features/billing/stripe-customer";
export * from "../features/billing/stripe-invoice";
export * from "../features/billing/stripe-price";
export * from "../features/billing/stripe-product";
export * from "../features/billing/stripe-subscription";
export * from "../features/billing/stripe-usage";
export * from "../features/billing/stripe-promotion-code";
// AI connection administration: data + module only, NOT the feature barrel —
// that one also re-exports the feature's client components, and core must stay
// importable from the server (same rationale as the tokenusage entries below).
export * from "../features/ai-connection/data";
export * from "../features/ai-connection/ai-connection.module";
export * from "../features/company/company.module";
export * from "../features/company/data";
export * from "../features/content/content.module";
export * from "../features/content/data";
export * from "../features/how-to/HowToModule";
export * from "../features/how-to/data";
export * from "../features/assistant/AssistantModule";
export * from "../features/assistant/data";
export * from "../features/assistant-message/AssistantMessageModule";
export * from "../features/assistant-message/data";
export * from "../features/assistant-action/AssistantActionModule";
export * from "../features/assistant-action/data";
export * from "../features/chunk/ChunkModule";
export * from "../features/chunk/data";
export * from "../features/feature/data";
export * from "../features/feature/feature.module";
export * from "../features/module";
export * from "../features/notification/data";
export * from "../features/notification/notification.module";
export * from "../features/push/data";
export * from "../features/push/push.module";
export * from "../features/role/data";
export * from "../features/role/role.module";
export * from "../features/s3";
export * from "../features/search";
export * from "../features/user/author.module";
export * from "../features/user/data";
export * from "../features/user/user.module";
export * from "../features/oauth/oauth.module";
export * from "../features/oauth/data";
export * from "../features/oauth/interfaces";
export * from "../features/waitlist/data";
export * from "../features/waitlist/waitlist.module";
export * from "../features/waitlist/waitlist-stats.module";
export * from "../features/rbac/rbac.module";
export * from "../features/referral/data";
export * from "../features/referral/referral.module";
export * from "../features/referral/referral-stats.module";
// Administrative token-usage reporting modules. Exported from core (not only
// from the client-marked ./tokenusage barrel) so a consuming app can register
// them in its bootstrapper without pulling the feature's client bundle —
// same placement as waitlist-stats and referral-stats above.
export * from "../features/tokenusage/tokenusage-admin.module";
// The full six-module bundle (administrative + self-service). Same placement
// rationale as the line above: a bootstrapper needs it, and it must not drag
// the feature's recharts client bundle in.
export * from "../features/tokenusage/tokenusage.modules";
// configureTokenUsage() is called from the app's bootstrap file, which is
// evaluated on the server as well as the client. Reaching it through the
// client-marked ./tokenusage barrel makes it a client function, and calling one
// from the server throws at module evaluation — so it is exported here, exactly
// like configureJsonApi. lib/config holds no React and no charting code.
export * from "../features/tokenusage/lib/config";
export * from "../features/audit-log";
