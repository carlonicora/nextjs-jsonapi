// Plain constants, no `next/cache` import: `cachedGet.ts` reads them, and this file
// keeps `revalidateTag`/`updateTag` (in `cache.ts`) out of every graph that loads it.

export type CacheProfile = "seconds" | "minutes" | "hours" | "days" | "weeks" | "max" | "default";

/** The built-in `cacheLife` profile names. A module `cache` value outside this list is treated as a tag. */
export const CACHE_PROFILES: readonly CacheProfile[] = [
  "seconds",
  "minutes",
  "hours",
  "days",
  "weeks",
  "max",
  "default",
];
