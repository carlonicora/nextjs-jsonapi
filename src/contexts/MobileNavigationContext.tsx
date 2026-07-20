"use client";

import * as React from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * One slot in the mobile bottom navigation bar.
 *
 * Supply exactly one of `icon` / `render`, and exactly one of `href` / `onClick`.
 * This is a review-time contract, not a runtime-validated one — the mistake is
 * immediately visible in dev, and validation code would ship to every consumer.
 *
 * `render` content MUST NOT contain an interactive element: an `href` slot is
 * already wrapped in a <Link>, so a nested <a>/<button> is invalid HTML and
 * triggers a hydration error.
 */
export type MobileNavigationItem = {
  /** Stable unique key. Used as the React key and the `data-testid` suffix. */
  key: string;
  /** Accessible name. The bar is icons-only, so this is never rendered as text. */
  label: string;
  /** Rendered at 24px. Mutually exclusive with `render`. */
  icon?: LucideIcon;
  /** Escape hatch for slots an icon cannot express (logo mark, user avatar). */
  render?: ReactNode;
  /** Navigational slot — receives the active highlight. */
  href?: string;
  /** Action slot — never highlighted. */
  onClick?: () => void;
};

/**
 * A plain module-scope context, mirroring the sibling `HeaderChildrenContext`.
 *
 * The `globalThis`-Symbol lazy-creation dance in `utils/use-mobile.tsx` is NOT
 * needed here: that exists for the `core` entry, which is deliberately excluded
 * from tsup's `clientEntries` and is reachable from server code. Provider (the
 * `contexts` entry) and consumer (the `components` entry) share one context
 * object, exactly as `HeaderChildrenContext` already does in production.
 */
const MobileNavigationContext = React.createContext<MobileNavigationItem[]>([]);

/**
 * Supplies the items rendered by `MobileNavigationBar`.
 *
 * Unlike `useSharedContext`, the hook below does NOT throw without a provider —
 * it returns `[]` and the bar renders nothing. Apps that never install this
 * provider are completely unaffected.
 *
 * MUST be rendered inside `ViewportProvider` so the bar's `useIsMobile()` reads
 * the server-seeded viewport rather than flashing.
 */
export function MobileNavigationProvider({ children, items }: { children: ReactNode; items: MobileNavigationItem[] }) {
  // Items are rebuilt on every render of the app-side provider (it depends on
  // hooks); memoising on the array identity keeps consumers from re-rendering
  // more than the parent already does.
  const value = React.useMemo(() => items, [items]);

  return <MobileNavigationContext.Provider value={value}>{children}</MobileNavigationContext.Provider>;
}

/** Returns the application-supplied bottom-navigation items, or `[]` when none. */
export function useMobileNavigationItems(): MobileNavigationItem[] {
  return React.useContext(MobileNavigationContext);
}
