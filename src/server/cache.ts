"use server";

import { revalidateTag } from "next/cache";

export type CacheProfile = "seconds" | "minutes" | "hours" | "days" | "weeks" | "max" | "default";

/**
 * Revalidate a cache tag to invalidate cached data.
 * Next.js 16+ requires a profile parameter.
 *
 * @param tag - The cache tag to invalidate
 * @param profile - The cache profile (defaults to "max" for immediate invalidation)
 */
export async function invalidateCacheTag(tag: string, profile: CacheProfile = "max"): Promise<void> {
  revalidateTag(tag, profile);
}

/**
 * Revalidate multiple cache tags.
 *
 * @param tags - Array of cache tags to invalidate
 * @param profile - The cache profile (defaults to "max" for immediate invalidation)
 */
export async function invalidateCacheTags(tags: string[], profile: CacheProfile = "max"): Promise<void> {
  for (const tag of tags) {
    revalidateTag(tag, profile);
  }
}
