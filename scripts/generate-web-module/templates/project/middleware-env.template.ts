/**
 * Middleware Environment Template
 *
 * Generates middleware-safe environment configuration
 */

import * as fs from "fs";
import * as path from "path";

export function generateMiddlewareEnvTemplate(webBasePath: string): string | null {
  const outputPath = path.join(webBasePath, "apps/web/src/config/middleware-env.ts");

  if (fs.existsSync(outputPath)) {
    return null; // Skip if exists
  }

  return `/**
 * Middleware-safe environment configuration
 * This file ONLY exports ENV constants without any library imports
 * It's safe to use in Next.js middleware which has restricted module support
 */

export const ENV = {
  API_URL:
    (typeof window === "undefined" ? process.env.API_INTERNAL_URL : undefined) || process.env.NEXT_PUBLIC_API_URL!,
  APP_URL: process.env.NEXT_PUBLIC_ADDRESS
    ? process.env.NEXT_PUBLIC_ADDRESS.trim().replace(/\\/+$/, "") // Trim whitespace & remove trailing slashes
    : "",
  VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
} as const;
`;
}
