/**
 * Centralized help-content store accessible from client and server contexts.
 * Uses a globalThis Symbol key to persist across HMR/Turbopack reloads and to
 * bridge between the client-side `configureJsonApi` (in `client/config.ts`)
 * and the HelpProvider context. Holds the brand-only HelpContentConfig.
 *
 * NO external dependencies to avoid circular imports.
 *
 * Pattern mirrors `bootstrapStore.ts`.
 */

const HELP_CONTENT_KEY = Symbol.for("nextjs-jsonapi:helpContent");

const globalStore = globalThis as unknown as {
  [HELP_CONTENT_KEY]?: unknown | null;
};

if (globalStore[HELP_CONTENT_KEY] === undefined) {
  globalStore[HELP_CONTENT_KEY] = null;
}

export function _setStaticHelpContent(cfg: unknown | null): void {
  globalStore[HELP_CONTENT_KEY] = cfg;
}

export function _getStaticHelpContent<T = unknown>(): T | null {
  return (globalStore[HELP_CONTENT_KEY] as T | null) ?? null;
}
