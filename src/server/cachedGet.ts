// Server-only utilities (NOT server actions - these cannot be called from client components)
//
// Reached through `@carlonicora/nextjs-jsonapi/cached-get` under the `react-server`
// condition only; every other bundle gets `cachedGet.stub.ts` (see package.json).

import { cacheLife, cacheTag } from "next/cache";
import { ApiData } from "../core/interfaces/ApiData";
import { CACHE_PROFILES, CacheProfile } from "./cacheProfiles";

export { statusFromDigest } from "./cacheDigest";

export interface CachedGetParams {
  url: string;
  /** A cacheLife profile name, or a tag. */
  cache: string;
  language: string;
  companyId?: string;
  additionalHeaders?: Record<string, string>;
}

function httpError(status: number, statusText: string): Error {
  return Object.assign(new Error(statusText), { status, digest: `HTTP_${status}` });
}

/**
 * Token-free cached GET for shared data.
 *
 * The arguments are the cache key, so they never carry a token, a cookie value
 * or a user id. The request is sent without `Authorization`: an endpoint that
 * needs a token is per-user and must not set `cache`.
 *
 * A non-OK response or an unreachable API throws, so Next does not store the
 * entry. The status travels in `error.digest` as `HTTP_<status>` (503 when the
 * API is unreachable), because `digest` is the only property that survives
 * into production. Read it back with `statusFromDigest`.
 */
export async function cachedServerGet(params: CachedGetParams): Promise<ApiData> {
  "use cache";

  if (CACHE_PROFILES.includes(params.cache as CacheProfile)) {
    cacheLife(params.cache as CacheProfile);
  } else {
    cacheTag(params.cache);
    cacheLife("max");
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...params.additionalHeaders,
    "x-language": params.language,
  };
  if (params.companyId) {
    headers["x-companyid"] = params.companyId;
  }

  let apiResponse: Response;
  try {
    apiResponse = await fetch(params.url, { method: "GET", headers });
  } catch {
    throw httpError(503, "Service Unavailable");
  }

  if (!apiResponse.ok) {
    throw httpError(apiResponse.status, apiResponse.statusText);
  }

  let data: any;
  try {
    data = await apiResponse.json();
  } catch {
    data = undefined;
  }

  return {
    data,
    ok: apiResponse.ok,
    status: apiResponse.status,
    statusText: apiResponse.statusText,
  };
}
