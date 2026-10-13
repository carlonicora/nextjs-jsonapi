"use client";

import * as React from "react";
import type { SessionSnapshot } from "../server/ServerSession";
import { mapThenable } from "../utils/map-thenable";
import { getViewportContext, measureViewport, persistViewport, subscribeViewport } from "../utils/use-mobile";

/**
 * Seeds the viewport from the server so SSR and the first client render agree,
 * removing the desktop-then-mobile chrome flash.
 *
 * `initialIsMobile` comes from the request — cookie first (a real measurement
 * from a previous visit), user agent as the first-visit fallback. See the
 * (main)/(admin) layouts.
 *
 * THIS LIVES IN `contexts/`, NOT `utils/`, AND MUST STAY HERE. The server
 * layouts render it directly, so it needs a genuine "use client" boundary in
 * the BUILT output. tsup.config.ts stamps the directive onto `dist/contexts/*`
 * via its `clientEntries` list; `dist/core/*` is deliberately excluded so that
 * instrumentation can import it server-side. Exporting this provider from
 * `core` therefore made Next execute it as a Server Component and fail with
 * "createContext only works in Client Components".
 *
 * `SocketContext` in this directory is the reference: it is likewise rendered
 * straight from `(main)/layout.tsx`, a Server Component, and works.
 */
export function ViewportProvider({
  initialIsMobile,
  session,
  children,
}: {
  initialIsMobile?: boolean;
  /**
   * Alternative to `initialIsMobile` (pass exactly one): the request's session
   * snapshot as a promise. The provider never awaits it, so its children render
   * at once; only `useIsMobile()` callers suspend until it settles. The first
   * client measurement replaces it with a boolean, as with `initialIsMobile`.
   */
  session?: Promise<SessionSnapshot>;
  children: React.ReactNode;
}) {
  const ViewportContext = getViewportContext();
  const seed = React.useMemo<boolean | Promise<boolean>>(
    () => (session ? mapThenable(session, (snapshot) => snapshot.isMobile) : (initialIsMobile ?? false)),
    // Created once: later measurements own the value.
    [],
  );
  const [isMobile, setIsMobile] = React.useState<boolean | Promise<boolean>>(seed);

  React.useEffect(
    () =>
      subscribeViewport(() => {
        const next = measureViewport();
        setIsMobile(next);
        persistViewport(next);
      }),
    [],
  );

  return <ViewportContext.Provider value={isMobile}>{children}</ViewportContext.Provider>;
}
