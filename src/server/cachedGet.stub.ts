// What `@carlonicora/nextjs-jsonapi/cached-get` resolves to outside the `react-server`
// condition (client components, their SSR pass). The shared request code reaches
// `serverRequest` from client hooks too, and Next rejects `"use cache"` and
// `cacheLife`/`cacheTag` in those bundles. Nothing there calls the cached path: it
// only runs on the server, where the real `cachedGet.ts` is resolved instead.

import type { ApiData } from "../core/interfaces/ApiData";
import type { CachedGetParams } from "./cachedGet";

export { statusFromDigest } from "./cacheDigest";
export type { CachedGetParams } from "./cachedGet";

export async function cachedServerGet(_params: CachedGetParams): Promise<ApiData> {
  throw new Error("cachedServerGet is server-only: it was resolved outside the react-server condition");
}
