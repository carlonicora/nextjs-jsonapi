"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { v4 } from "uuid";
import { AnalyticsService } from "../data/AnalyticsService";
import type { AnalyticsEventInput } from "../data/analytics.types";
import { readUtm } from "../lib/utm";
import { clearVisitorCookie, ensureVisitorCookie } from "../lib/visitorCookie";

// The dashboard itself is never tracked, so administrators reading it do not inflate it.
const EXCLUDED_PREFIX = "/administration/analytics";

// The API rejects longer referrers.
const MAX_REFERRER_LENGTH = 2048;

type Attribution = Pick<
  AnalyticsEventInput,
  "referrer" | "utmSource" | "utmMedium" | "utmCampaign" | "utmTerm" | "utmContent"
>;

type AnalyticsTrackerProps = {
  hasConsent: boolean;
  resolveSection: (pathname: string) => "public" | "app";
  sensitivePrefixes?: string[];
};

/**
 * Returns the referrer only when it comes from another host, so internal
 * navigation is never stored as a traffic source.
 */
function readExternalReferrer(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    if (new URL(document.referrer).host === window.location.host) return undefined;
  } catch {
    return undefined;
  }
  return document.referrer.slice(0, MAX_REFERRER_LENGTH);
}

/**
 * Replaces every segment after a sensitive prefix with ":code", so single-use
 * account codes in the URL never leave the browser.
 */
function maskSensitivePath(path: string, sensitivePrefixes: string[] | undefined): string {
  if (!sensitivePrefixes) return path;

  for (const prefix of sensitivePrefixes) {
    if (path === prefix) return path;
    if (path.startsWith(`${prefix}/`)) {
      const segments = path
        .slice(prefix.length + 1)
        .split("/")
        .filter((segment) => segment.length > 0);
      return [prefix, ...segments.map(() => ":code")].join("/");
    }
  }

  return path;
}

export function AnalyticsTracker({ hasConsent, resolveSection, sensitivePrefixes }: AnalyticsTrackerProps): null {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const lastConsent = useRef<boolean>(false);
  const attribution = useRef<Attribution | null>(null);

  useEffect(() => {
    if (!hasConsent) clearVisitorCookie();

    if (!pathname) return;
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const path = pathname.split(/[?#]/)[0] || "/";
    if (path.startsWith(EXCLUDED_PREFIX)) return;

    // One event per distinct path. The same path is sent again only when consent
    // was just granted, so the processor starts a new visitor on the cookie id.
    const isNewPath = lastPath.current !== path;
    const consentJustGranted = hasConsent && !lastConsent.current;
    lastConsent.current = hasConsent;
    if (!isNewPath && !consentJustGranted) return;
    lastPath.current = path;

    const sentPath = maskSensitivePath(path, sensitivePrefixes);

    const input: AnalyticsEventInput = {
      id: v4(),
      path: sentPath,
      section: resolveSection(sentPath),
      screenWidth: window.innerWidth,
    };

    if (hasConsent) input.visitorId = ensureVisitorCookie();

    // The first event of the page load carries the attribution. The event sent
    // because consent was just granted carries it again, so the session opened
    // on the cookie id keeps the source the visitor arrived from.
    const isFirstEvent = attribution.current === null;
    if (isFirstEvent) {
      const referrer = readExternalReferrer();
      attribution.current = { ...(referrer ? { referrer } : {}), ...readUtm(window.location.search) };
    }
    if (isFirstEvent || consentJustGranted) Object.assign(input, attribution.current);

    // AnalyticsService.track never rejects: it logs and swallows its own failures.
    void AnalyticsService.track(input);
  }, [pathname, hasConsent, resolveSection, sensitivePrefixes]);

  return null;
}
