"use client";

import { getCookie } from "cookies-next";

/**
 * Get the authentication token from cookies (client-side only)
 */
export async function getClientToken(): Promise<string | undefined> {
  return await getCookie("token");
}
