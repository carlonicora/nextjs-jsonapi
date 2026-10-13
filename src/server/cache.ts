// Server-only utilities (NOT server actions - these cannot be called from client components)

import { revalidateTag, updateTag } from "next/cache";

import type { CacheProfile } from "./cacheProfiles";

export { CACHE_PROFILES, type CacheProfile } from "./cacheProfiles";

/**
 * Revalidate a cache tag to invalidate cached data.
 * Next.js 16+ requires a profile parameter.
 *
 * With `"max"` the tagged entries are marked stale and served stale-while-revalidate
 * (a one-year window): the next request still gets the old data while fresh data loads
 * in the background. It is not an immediate invalidation. A Server Action that must
 * read its own write uses `updateCacheTag` instead.
 *
 * @param tag - The cache tag to invalidate
 * @param profile - The cache profile whose `expire` bounds how long stale data may be served (defaults to "max")
 */
export async function invalidateCacheTag(tag: string, profile: CacheProfile = "max"): Promise<void> {
  revalidateTag(tag, profile);
}

/**
 * Revalidate multiple cache tags.
 *
 * @param tags - Array of cache tags to invalidate
 * @param profile - The cache profile, see `invalidateCacheTag` (defaults to "max", stale-while-revalidate)
 */
export async function invalidateCacheTags(tags: string[], profile: CacheProfile = "max"): Promise<void> {
  for (const tag of tags) {
    revalidateTag(tag, profile);
  }
}

/**
 * Expire a cache tag immediately, so the same request reads fresh data (read-your-own-writes).
 * Wraps `updateTag`, which works in Server Actions only. Route Handlers use `invalidateCacheTag`.
 *
 * @param tag - The cache tag to expire
 */
export async function updateCacheTag(tag: string): Promise<void> {
  updateTag(tag);
}
