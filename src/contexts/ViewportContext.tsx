"use client";

import * as React from "react";
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
  children,
}: {
  initialIsMobile: boolean;
  children: React.ReactNode;
}) {
  const ViewportContext = getViewportContext();
  const [isMobile, setIsMobile] = React.useState<boolean>(initialIsMobile);

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
