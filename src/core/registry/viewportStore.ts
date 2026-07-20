"use client";

/**
 * Centralized viewport context object.
 *
 * Uses a globalThis Symbol key so that tsup's multi-entry `splitting: true`
 * build cannot produce two distinct React context objects. If it did, a
 * ViewportProvider from one bundle graph and a useIsMobile from another would
 * silently miss each other: the hook would read `undefined`, fall back to the
 * legacy path, and the flash would return with nothing failing loudly.
 *
 * CREATION IS LAZY, AND MUST STAY THAT WAY. Do not hoist the `createContext`
 * call to module scope. `apps/web/src/instrumentation.ts` imports
 * `jsonapi.config.ts` -> `Bootstrapper.ts` -> `@carlonicora/nextjs-jsonapi/core`,
 * whose barrel re-exports `../utils` and therefore pulls this module into the
 * Node/RSC server graph at server startup. In that graph Next resolves `react`
 * to the vendored RSC build, which deliberately omits `createContext` because
 * it is a client-only API. A module-scope call there crashes the dev server on
 * boot with "createContext is not a function" — the `"use client"` directive
 * does not help, because instrumentation is not a React render.
 *
 * Calling the accessor only from inside the provider/hook guarantees it runs in
 * a rendering context, where `createContext` exists.
 *
 * NO external dependencies beyond React, to avoid circular imports.
 *
 * Pattern mirrors `helpStore.ts` / `bootstrapStore.ts`.
 */

import { createContext, type Context } from "react";

const VIEWPORT_CONTEXT_KEY = Symbol.for("nextjs-jsonapi:viewportContext");

const globalStore = globalThis as unknown as {
  [VIEWPORT_CONTEXT_KEY]?: Context<boolean | undefined>;
};

/**
 * Returns the process-wide viewport context, creating it on first use.
 * Never call this at module scope — see the note above.
 */
export function getViewportContext(): Context<boolean | undefined> {
  if (globalStore[VIEWPORT_CONTEXT_KEY] === undefined) {
    globalStore[VIEWPORT_CONTEXT_KEY] = createContext<boolean | undefined>(undefined);
  }
  return globalStore[VIEWPORT_CONTEXT_KEY]!;
}
