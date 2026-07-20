"use client";

import * as React from "react";

export const MOBILE_BREAKPOINT = 768;
export const VIEWPORT_COOKIE_NAME = "viewport_mobile";

/**
 * The viewport context is keyed on a globalThis Symbol so that tsup's
 * multi-entry `splitting: true` build cannot produce two distinct context
 * objects. If it did, the ViewportProvider (built into the `contexts` entry)
 * and this hook (built into the `core` entry) would silently miss each other:
 * the hook would read `undefined`, fall back to the legacy path, and the
 * mobile-layout flash would return with nothing failing loudly.
 *
 * THIS MODULE IS SERVER-REACHABLE. `core` is deliberately absent from
 * tsup.config.ts's `clientEntries` list, so `dist/core/*` gets NO "use client"
 * banner — that is what lets `apps/web/src/instrumentation.ts` import
 * jsonapi.config -> Bootstrapper -> `@carlonicora/nextjs-jsonapi/core` at
 * server startup. Two rules follow, both load-bearing:
 *
 * 1. React is imported as a NAMESPACE. A named
 *    `import { createContext } from "react"` makes Turbopack statically refuse
 *    the module: "You're importing a module that depends on `createContext`
 *    into a React Server Component module."
 * 2. Creation is LAZY, never at module scope. On the server React resolves to
 *    the vendored RSC build, which omits `createContext` entirely
 *    ("createContext is not a function" — crashes the dev server at boot).
 *
 * `useIsMobile` only ever runs inside a Client Component render, so calling the
 * accessor from there is safe. The PROVIDER must not live here — it is rendered
 * by the server layouts, so it needs a real "use client" boundary and therefore
 * lives in `contexts/ViewportContext.tsx`.
 */
const VIEWPORT_CONTEXT_KEY = Symbol.for("nextjs-jsonapi:viewportContext");

const globalStore = globalThis as unknown as {
  [VIEWPORT_CONTEXT_KEY]?: React.Context<boolean | undefined>;
};

/** Returns the process-wide viewport context, creating it on first use. */
export function getViewportContext(): React.Context<boolean | undefined> {
  if (globalStore[VIEWPORT_CONTEXT_KEY] === undefined) {
    globalStore[VIEWPORT_CONTEXT_KEY] = React.createContext<boolean | undefined>(undefined);
  }
  return globalStore[VIEWPORT_CONTEXT_KEY]!;
}

/** @internal — consumed by contexts/ViewportContext.tsx */
export function measureViewport(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

/** @internal — consumed by contexts/ViewportContext.tsx */
export function persistViewport(isMobile: boolean): void {
  document.cookie = `${VIEWPORT_COOKIE_NAME}=${isMobile ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
}

/** @internal — consumed by contexts/ViewportContext.tsx */
export function subscribeViewport(onChange: () => void): () => void {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  onChange();
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function useIsMobile(): boolean {
  const seeded = React.useContext(getViewportContext());
  const [legacy, setLegacy] = React.useState<boolean>(false);

  React.useEffect(() => {
    // A provider owns the value; never run the legacy measurement alongside it.
    if (seeded !== undefined) return;
    return subscribeViewport(() => setLegacy(measureViewport()));
  }, [seeded]);

  return seeded ?? legacy;
}
