"use client";

import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { RecentPage, recentPagesAtom } from "../atoms";
import { getTrackablePages } from "../unified/JsonApiRequest";

// Routes to exclude from tracking
const EXCLUDED_ROUTES = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/activate"];

export function usePageTracker() {
  const pathname = usePathname();
  const [recentPages, setRecentPages] = useAtom(recentPagesAtom);

  useEffect(() => {
    if (!pathname) return;

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

    let pageTitle = foundModule.name;
    if (typeof document !== "undefined") {
      const titleParts = document.title.split("]");
      if (titleParts[1]) {
        const cleanTitle = titleParts[1].split("|")[0]?.trim();
        pageTitle = cleanTitle || foundModule.name;
      }
    }

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
  }, [pathname, setRecentPages]);
}
