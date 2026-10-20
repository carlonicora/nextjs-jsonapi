export type SignupSource = {
  sourceRef?: string;
  sourceUtmSource?: string;
  sourceUtmMedium?: string;
  sourceUtmCampaign?: string;
  sourceReferrer?: string;
  sourceLandingPath?: string;
};

export const SIGNUP_SOURCE_COOKIE = "signup_source";
export const SIGNUP_SOURCE_COOKIE_MAX_AGE = 2592000;

/** The six source fields, in display order. */
export const SIGNUP_SOURCE_FIELDS: readonly (keyof SignupSource)[] = [
  "sourceRef",
  "sourceUtmSource",
  "sourceUtmMedium",
  "sourceUtmCampaign",
  "sourceReferrer",
  "sourceLandingPath",
];

const SIGNUP_SOURCE_MAX_LENGTH = 200;

// First touch for the current page session. Survives client navigations, lost on a full reload.
let memorySource: SignupSource | undefined;

function clean(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, SIGNUP_SOURCE_MAX_LENGTH);
}

function sanitise(input: unknown): SignupSource | undefined {
  if (!input || typeof input !== "object") return undefined;
  const result: SignupSource = {};
  for (const field of SIGNUP_SOURCE_FIELDS) {
    const value = clean((input as Record<string, unknown>)[field]);
    if (value !== undefined) result[field] = value;
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Pure. Reads ref and utm_source/medium/campaign from the URL, the referrer host when it is not ownHost,
 * and the landing path. Returns undefined for a direct visit (no ref, no UTM, no external referrer).
 */
export function readSignupSourceFromLocation(params: {
  url: string;
  referrer: string;
  ownHost: string;
}): SignupSource | undefined {
  let url: URL;
  try {
    url = new URL(params.url);
  } catch {
    return undefined;
  }

  const sourceRef = clean(url.searchParams.get("ref"));
  const sourceUtmSource = clean(url.searchParams.get("utm_source"));
  const sourceUtmMedium = clean(url.searchParams.get("utm_medium"));
  const sourceUtmCampaign = clean(url.searchParams.get("utm_campaign"));

  let sourceReferrer: string | undefined;
  if (params.referrer) {
    try {
      const referrerHost = new URL(params.referrer).host;
      if (referrerHost && referrerHost !== params.ownHost) sourceReferrer = clean(referrerHost);
    } catch {
      sourceReferrer = undefined;
    }
  }

  if (!sourceRef && !sourceUtmSource && !sourceUtmMedium && !sourceUtmCampaign && !sourceReferrer) return undefined;

  return sanitise({
    sourceRef,
    sourceUtmSource,
    sourceUtmMedium,
    sourceUtmCampaign,
    sourceReferrer,
    sourceLandingPath: url.pathname,
  });
}

function readSignupSourceCookie(): SignupSource | undefined {
  if (typeof document === "undefined") return undefined;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const cookie of cookies) {
    const separator = cookie.indexOf("=");
    if (separator === -1) continue;
    if (cookie.slice(0, separator) !== SIGNUP_SOURCE_COOKIE) continue;
    const value = cookie.slice(separator + 1);
    if (!value) return undefined;
    try {
      return sanitise(JSON.parse(decodeURIComponent(value)));
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function writeSignupSourceCookie(source: SignupSource): void {
  document.cookie = `${SIGNUP_SOURCE_COOKIE}=${encodeURIComponent(JSON.stringify(source))}; path=/; max-age=${SIGNUP_SOURCE_COOKIE_MAX_AGE}; SameSite=Lax`;
}

/**
 * First touch: an existing in-memory value or cookie is never overwritten.
 * Writes the cookie only when persist is true and no cookie exists yet.
 */
export function captureSignupSource(params: { persist: boolean }): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const existingCookie = readSignupSourceCookie();

  if (!memorySource) {
    memorySource =
      existingCookie ??
      readSignupSourceFromLocation({
        url: window.location.href,
        referrer: document.referrer,
        ownHost: window.location.host,
      });
  }

  if (params.persist && !existingCookie && memorySource) writeSignupSourceCookie(memorySource);
}

/** The in-memory value, else the cookie value, else undefined. */
export function getSignupSource(): SignupSource | undefined {
  return memorySource ?? readSignupSourceCookie();
}
