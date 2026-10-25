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
  /**
   * `undefined` while the app has not read its consent store yet: the tracker sends
   * nothing and leaves the visitor cookie alone. `false` when there is no consent
   * (refused or not chosen yet): the cookie is cleared and page views go out without
   * an id. Never pass `false` as a placeholder for "not read yet".
   */
  hasConsent?: boolean;
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
  // The last consent value the app actually read. `undefined` until then, so a page
  // load with consent already stored is never mistaken for the Accept click.
  const lastKnownConsent = useRef<boolean | undefined>(undefined);
  const attribution = useRef<Attribution | null>(null);

  useEffect(() => {
    // Consent not read yet: send nothing and keep the cookie, or a visitor who
    // already accepted would lose their id on every tracker mount.
    if (hasConsent === undefined) return;
    if (hasConsent === false) clearVisitorCookie();

    if (!pathname) return;
    if (typeof navigator !== "undefined" && navigator.webdriver) return;

    const path = pathname.split(/[?#]/)[0] || "/";
    if (path.startsWith(EXCLUDED_PREFIX)) return;

    // One event per distinct path. The same path is sent again only when the
    // visitor clicks Accept (a known `false` turning `true`), flagged so the API
    // moves the open cookieless session onto the cookie id.
    const isNewPath = lastPath.current !== path;
    const consentGranted = hasConsent === true && lastKnownConsent.current === false;
    lastKnownConsent.current = hasConsent;
    if (!isNewPath && !consentGranted) return;
    lastPath.current = path;

    const sentPath = maskSensitivePath(path, sensitivePrefixes);

    const input: AnalyticsEventInput = {
      id: v4(),
      path: sentPath,
      section: resolveSection(sentPath),
      screenWidth: window.innerWidth,
    };

    if (hasConsent) input.visitorId = ensureVisitorCookie();
    if (consentGranted) input.consentGranted = true;

    // The first event of the page load carries the attribution. The event sent
    // because consent was just granted carries it again, so the session opened
    // on the cookie id keeps the source the visitor arrived from.
    const isFirstEvent = attribution.current === null;
    if (isFirstEvent) {
      const referrer = readExternalReferrer();
      attribution.current = { ...(referrer ? { referrer } : {}), ...readUtm(window.location.search) };
    }
    if (isFirstEvent || consentGranted) Object.assign(input, attribution.current);

    // AnalyticsService.track never rejects: it logs and swallows its own failures.
    void AnalyticsService.track(input);
  }, [pathname, hasConsent, resolveSection, sensitivePrefixes]);

  return null;
}
