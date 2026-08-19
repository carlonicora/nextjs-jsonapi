/**
 * The single place in this package that reads `process.env`.
 *
 * Everything else imports {@link ENV}. Centralising the reads keeps every
 * default in one place — the same contract `base.config.ts` provides on the
 * NestJS side — instead of scattering `process.env.X || "…"` across hooks,
 * clients and components where the fallbacks silently drift apart.
 *
 * WHY THE READS MUST STAY LITERAL: Next.js inlines `NEXT_PUBLIC_*` by textual
 * substitution at build time, replacing the exact expression
 * `process.env.NEXT_PUBLIC_FOO` with a string literal. A computed lookup
 * (`process.env[key]`) is NOT substituted and reads as `undefined` in the
 * browser bundle. Every entry below therefore spells its variable out in full,
 * and new entries must do the same.
 *
 * WHY GETTERS AND NOT PLAIN PROPERTIES: every call site this replaced read
 * `process.env` at CALL time, not at import time. A plain property would freeze
 * the value when the module is first imported, which breaks any consumer that
 * assigns the variable after boot — the package's own tests do exactly that.
 * Getters keep the read lazy while leaving the expression literal, so the build
 * time substitution still applies.
 *
 * Because that substitution happens before the code runs, no reference to
 * `process` survives into the client bundle — so this module is safe to import
 * from client components, server components, route handlers and middleware
 * alike. It deliberately carries no `"use client"` directive for that reason.
 *
 * Values are normalised (empty string rather than `undefined`, booleans rather
 * than string comparisons) so callers never repeat the parsing. Callers that
 * must distinguish "unset" from "set to empty" — the URL getters, which throw a
 * configuration error — check for an empty string.
 */
export const ENV = {
  /** Public API base URL (NEXT_PUBLIC_API_URL). Empty when unset. */
  get API_URL(): string {
    return process.env.NEXT_PUBLIC_API_URL ?? "";
  },
  /** Public app base URL (NEXT_PUBLIC_ADDRESS). Empty when unset. */
  get APP_URL(): string {
    return process.env.NEXT_PUBLIC_ADDRESS ?? "";
  },
  /**
   * Alternative app base URL (NEXT_PUBLIC_APP_URL), used only by
   * `client/config.ts`'s `getAppUrl()` before it falls back to
   * `window.location.origin`. Empty when unset.
   */
  get APP_URL_ALTERNATE(): string {
    return process.env.NEXT_PUBLIC_APP_URL ?? "";
  },
  /** Web-push VAPID public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY). Empty when unset. */
  get VAPID_PUBLIC_KEY(): string {
    return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  },
  /** Google Maps JS key (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY). Empty disables autocomplete. */
  get GOOGLE_MAPS_API_KEY(): string {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  },
  /**
   * NEXT_PUBLIC_PRIVATE_INSTALLATION === "true", case-insensitively
   * (default false). A private installation is a single-tenant deployment.
   */
  get PRIVATE_INSTALLATION(): boolean {
    return process.env.NEXT_PUBLIC_PRIVATE_INSTALLATION?.toLowerCase() === "true";
  },
  /** NODE_ENV === "production" — set by the Next build, not by `.env`. */
  get IS_PRODUCTION(): boolean {
    return process.env.NODE_ENV === "production";
  },
  /** NODE_ENV === "development" — gates verbose client-side diagnostics. */
  get IS_DEVELOPMENT(): boolean {
    return process.env.NODE_ENV === "development";
  },
};
