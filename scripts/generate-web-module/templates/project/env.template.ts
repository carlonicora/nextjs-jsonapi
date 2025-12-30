/**
 * Environment Configuration Template
 *
 * Generates env.ts with JSON:API and Stripe configuration
 */

import * as fs from "fs";
import * as path from "path";

export function generateEnvTemplate(webBasePath: string): string | null {
  const outputPath = path.join(webBasePath, "apps/web/src/config/env.ts");

  if (fs.existsSync(outputPath)) {
    return null; // Skip if exists
  }

  return `import { bootstrap } from "@/config/Bootstrapper";
import { ENV } from "@/config/middleware-env";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useDateFnsLocale } from "@/i18n/useDateFnsLocale";
import { removeToken, updateToken } from "@/server-actions/auth-cookies";
import {
  configureAuth,
  configureI18n,
  configureJsonApi,
  configureRoles,
} from "@carlonicora/nextjs-jsonapi";
import { Modules } from "@carlonicora/nextjs-jsonapi/core";
import { RoleId } from "@only35/shared";
import { useLocale, useTranslations } from "next-intl";

// Re-export ENV for use by non-middleware code
export { ENV };

// Bootstrap modules immediately when this file is imported
bootstrap();

// Validate required env vars
if (!ENV.API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is required but not set");
}

if (!ENV.APP_URL) {
  throw new Error("NEXT_PUBLIC_ADDRESS is required but not set");
}

// Configure JSON:API client
configureJsonApi({
  apiUrl: ENV.API_URL,
  appUrl: ENV.APP_URL,
  trackablePages: [Modules.Notification, Modules.Company, Modules.User],
  bootstrapper: bootstrap,
  stripePublishableKey: ENV.STRIPE_PUBLISHABLE_KEY,
});

// Configure auth token handling
configureAuth({
  updateToken,
  removeToken,
});

// Configure i18n
configureI18n({
  useRouter,
  useTranslations,
  useLocale,
  useDateFnsLocale,
  Link,
  usePathname,
});

// Configure role IDs
configureRoles(RoleId);

// Configure Discord if needed: configureDiscord({ useDiscord: true, useInternalAuth: false });
`;
}
