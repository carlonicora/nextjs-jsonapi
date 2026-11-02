import { getCookie } from "cookies-next";
import { getI18nDefaultLocale, getI18nSupportedLocales } from "../../i18n/config";
import { getOfflineConfig } from "../config";

/** The locale of the page the GM is on (first path segment), or the app's default locale. */
export function currentLocale(): string {
  if (typeof window === "undefined") return getI18nDefaultLocale();
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  return first && getI18nSupportedLocales().includes(first) ? first : getI18nDefaultLocale();
}

export type SessionRefreshResult = "ok" | "expired" | "unreachable";

/**
 * Renews the sign-in before the waiting changes are sent: one same-origin GET of the offline
 * shell (`cache: "no-store"`). It passes through the app's proxy, which renews the `token`
 * cookie; the shell path is public, so the proxy never redirects it. The sign-in has expired
 * when the `token` cookie is absent after the request.
 *
 * This is the one `fetch` of the offline layer: a request to the web app itself, not the API
 * (Carlo's decision, 2026-11-01).
 */
export async function refreshSession(): Promise<SessionRefreshResult> {
  try {
    await fetch(getOfflineConfig().shellPath(currentLocale()), { cache: "no-store", credentials: "same-origin" });
  } catch {
    return "unreachable";
  }

  const token = await getCookie("token");
  return token ? "ok" : "expired";
}
