import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { v4 } from "uuid";

export const ANALYTICS_VISITOR_COOKIE = "analytics_visitor";

/** 395 days: the 13-month retention window. */
const MAX_AGE_SECONDS = 395 * 24 * 3600;

export function readVisitorCookie(): string | undefined {
  const value = getCookie(ANALYTICS_VISITOR_COOKIE);
  return typeof value === "string" && value !== "" ? value : undefined;
}

/** Returns the existing visitor id, or creates and stores a new one. */
export function ensureVisitorCookie(): string {
  const existing = readVisitorCookie();
  if (existing) return existing;

  const id = v4();
  setCookie(ANALYTICS_VISITOR_COOKIE, id, {
    maxAge: MAX_AGE_SECONDS,
    sameSite: "lax",
    path: "/",
    secure: typeof location !== "undefined" && location.protocol === "https:",
  });

  return id;
}

export function clearVisitorCookie(): void {
  deleteCookie(ANALYTICS_VISITOR_COOKIE, { path: "/" });
}
