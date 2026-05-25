/**
 * Centralized help-content store accessible from client and server contexts.
 * Uses globalThis Symbol keys to persist across HMR/Turbopack reloads and to
 * bridge between the client-side `configureJsonApi` (in `client/config.ts`)
 * and server-side consumers (HelpProvider, getHelpContent, serializeHelpArticle).
 *
 * NO external dependencies to avoid circular imports.
 *
 * Pattern mirrors `bootstrapStore.ts`.
 */

// Help content config shape is duplicated here as `unknown` to avoid pulling
// the help feature into this core file. Callers cast on read.
type HelpReader = (article: { path: string }) => Promise<string>;

const HELP_CONTENT_KEY = Symbol.for("nextjs-jsonapi:helpContent");
const HELP_READER_KEY = Symbol.for("nextjs-jsonapi:helpReader");

const globalStore = globalThis as unknown as {
  [HELP_CONTENT_KEY]?: unknown | null;
  [HELP_READER_KEY]?: HelpReader | null;
};

if (globalStore[HELP_CONTENT_KEY] === undefined) {
  globalStore[HELP_CONTENT_KEY] = null;
}
if (globalStore[HELP_READER_KEY] === undefined) {
  globalStore[HELP_READER_KEY] = null;
}

export function _setStaticHelpContent(cfg: unknown | null): void {
  globalStore[HELP_CONTENT_KEY] = cfg;
}

export function _getStaticHelpContent<T = unknown>(): T | null {
  return (globalStore[HELP_CONTENT_KEY] as T | null) ?? null;
}

export function setHelpReader(reader: HelpReader): void {
  globalStore[HELP_READER_KEY] = reader;
}

export function _getStaticHelpReader(): HelpReader | null {
  return globalStore[HELP_READER_KEY] ?? null;
}
