"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { captureSignupSource } from "./signup-source";

/**
 * SignupSourceCapture records where a visitor came from (ref, UTM, external referrer, landing path).
 *
 * Behavior:
 * - Captures on mount and on every client navigation (pathname/search change)
 * - First touch wins: an existing in-memory value or cookie is never overwritten
 * - Writes the `signup_source` cookie only when `persist` is true (cookie consent accepted);
 *   when `persist` flips to true later, the in-memory value is written then
 * - Renders nothing (null)
 */
export function SignupSourceCapture({ persist }: { persist: boolean }): null {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    captureSignupSource({ persist });
  }, [pathname, searchParams, persist]);

  return null;
}
