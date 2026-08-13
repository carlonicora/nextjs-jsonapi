"use client";

import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { RecentPage, recentPagesAtom } from "../atoms";
import { getTrackablePages } from "../client/config";

// Routes to exclude from tracking
const EXCLUDED_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/activate"];

/**
 * Detail pages title themselves `[Entity type] Entity name | App name`. Returns
 * the entity name, or null when the document title is not (yet) a detail-page
 * title — the normal state for the first tick after a client-side navigation,
 * before the route's streamed metadata replaces the <title>.
 */
function readEntityTitle(): string | null {
  if (typeof document === "undefined") return null;

  const afterEntityType = document.title.split("]")[1];
  if (!afterEntityType) return null;

  return afterEntityType.split("|")[0]?.trim() || null;
}

export function usePageTracker() {
  const pathname = usePathname();
  const [_recentPages, setRecentPages] = useAtom(recentPagesAtom);
  const previousPathname = useRef<string | null>(null);
  const previousTitle = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    const arrivedByClientNavigation = previousPathname.current !== null && previousPathname.current !== pathname;
    previousPathname.current = pathname;

    // Exclude certain routes
    if (EXCLUDED_ROUTES.some((route) => pathname === route || pathname.endsWith(route))) {
      return;
    }

    // Extract page information from pathname (already locale-free from next-intl)
    const pathParts = pathname.split("/").filter(Boolean);

    if (pathParts.length === 0) return;

    // Try to find the module based on the route
    const moduleName = pathParts[0];
    const entityId = pathParts.length > 1 ? pathParts[1] : null;

    // Only track pages with entity IDs (detail pages)
    if (!entityId) return;

    // Find the module from configured trackable pages
    const trackablePages = getTrackablePages();
    const foundModule = trackablePages.find((mod) => mod.pageUrl === `/${moduleName}`);

    if (!foundModule) return;

    // Only use base path (module/id), ignoring any sub-paths
    const baseUrl = `/${moduleName}/${entityId}`;

    // A parsed title is only trustworthy on the entity's OWN page. Deeper paths
    // collapse onto the same entry but title themselves after the section —
    // "[Campaign] NPCs Venezia Obscura" — so they refresh the entry's recency
    // without renaming it. An entity first seen through a sub-page keeps the
    // module name until its own page is opened.
    if (pathParts.length > 2) {
      setRecentPages((prev) => {
        const existing = prev.find((page) => page.url === baseUrl);
        const refreshed: RecentPage = {
          url: baseUrl,
          title: existing?.title ?? foundModule.name,
          moduleType: foundModule.name,
          timestamp: Date.now(),
        };
        return [refreshed, ...prev.filter((page) => page.url !== baseUrl)].slice(0, 10);
      });
      // This branch never seeds from document.title, but it must still track it:
      // the next navigation's "has the title already changed" comparison (below)
      // is meaningful only when compared against the title we last actually
      // observed. Leaving previousTitle at whatever it was BEFORE this sub-page
      // (e.g. still the entity's own page, several navigations back) would
      // compare the next route's title against the wrong baseline — the
      // comparison could go either way depending on incidental string overlap,
      // rather than reflecting whether the next route's title has truly arrived.
      previousTitle.current = document.title;
      return;
    }

    let lastRecordedTitle: string | null = null;

    const record = (pageTitle: string) => {
      if (pageTitle === lastRecordedTitle) return;
      lastRecordedTitle = pageTitle;

      const newPage: RecentPage = {
        url: baseUrl,
        title: pageTitle,
        moduleType: foundModule.name,
        timestamp: Date.now(),
      };

      setRecentPages((prev) => {
        // Remove if already exists (to move to top)
        const filtered = prev.filter((page) => page.url !== newPage.url);

        // Add to beginning and limit to 10
        return [newPage, ...filtered].slice(0, 10);
      });
    };

    // A route commits BEFORE its streamed metadata lands, so on a client-side
    // navigation document.title normally still belongs to the page we left.
    // Seeding from it would stamp this entity with the previous entity's name,
    // so the default is to seed with the module name and let the observer below
    // correct it once the real title lands. On a hard load the title was
    // server-rendered into the initial HTML and is already ours.
    //
    // But when the route's payload was already prefetched, the new title can
    // land in the SAME commit as the navigation — there is no later mutation
    // for the observer to catch, so the module-name fallback would stick
    // forever. Comparing document.title against the title we last consumed
    // (previousTitle) distinguishes the two cases: unchanged means it's still
    // the page we left (ignore it, as above); changed means this route's own
    // title has already arrived (trust it immediately).
    const titleAlreadyChanged = document.title !== previousTitle.current;
    const seededTitle = !arrivedByClientNavigation || titleAlreadyChanged ? readEntityTitle() : null;

    record(seededTitle ?? foundModule.name);
    previousTitle.current = document.title;

    if (typeof document === "undefined") return;

    const observer = new MutationObserver(() => {
      // This effect's cleanup (which disconnects this observer) runs as a
      // passive-effect flush, which React defers to AFTER the current
      // microtask checkpoint. A MutationObserver callback fires as a
      // microtask, immediately once its target mutates — including a mutation
      // that belongs to the NEXT route, if we are still connected when it
      // lands. Bail if the browser has already moved off this entry's page, so
      // a stale observer never stamps the next route's title onto this one.
      // window.location.pathname may carry a locale prefix, hence `includes`.
      if (!window.location.pathname.includes(baseUrl)) return;

      const title = readEntityTitle();
      if (title) {
        record(title);
        previousTitle.current = document.title;
      }
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => observer.disconnect();
  }, [pathname, setRecentPages]);
}
