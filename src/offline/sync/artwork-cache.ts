// Artwork images for the device copy, kept in Cache Storage under the exact URL the stored
// artwork record holds (`attributes.imageUrl`). The service worker answers those URLs from the
// same cache when the network fails. The image downloads are plain GETs of the URLs the API
// already returned (decision recorded in the plan).

// The service worker names its caches `${appId}-images` and `${appId}-offline-${revision}`
// (pwa/sw.js). The page does not load sw-config.js, so it finds the app id from those names;
// Cache Storage is per origin, so only this app's caches are listed.
const IMAGES_CACHE_SUFFIX = "-images";
const OFFLINE_CACHE_MARKER = "-offline-";

async function imagesCacheName(): Promise<string | undefined> {
  if (typeof caches === "undefined") return undefined;
  const keys = await caches.keys();
  const existing = keys.find((key) => key.endsWith(IMAGES_CACHE_SUFFIX));
  if (existing) return existing;

  const offline = keys.find((key) => key.includes(OFFLINE_CACHE_MARKER));
  if (!offline) return undefined;
  return `${offline.slice(0, offline.indexOf(OFFLINE_CACHE_MARKER))}${IMAGES_CACHE_SUFFIX}`;
}

/** The image URL a stored resource carries, if any. */
export function imageUrlOf(resource: any): string | undefined {
  const url = resource?.attributes?.imageUrl;
  return typeof url === "string" && url.length > 0 ? url : undefined;
}

/**
 * Makes sure `url` is in the images cache: downloaded when missing. When `previousUrl` is a
 * different URL of the same artwork, its entry is removed. A failed download is logged and
 * retried at the next sync.
 */
export async function cacheArtworkImage(url: string, previousUrl?: string): Promise<void> {
  const name = await imagesCacheName();
  if (!name) return;
  const cache = await caches.open(name);

  if (previousUrl && previousUrl !== url) await cache.delete(previousUrl);
  if (await cache.match(url)) return;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn("[offline] could not download an artwork image", url, response.status);
      return;
    }
    await cache.put(url, response);
  } catch (error) {
    console.warn("[offline] could not download an artwork image", url, error);
  }
}

/** Removes the cached copy of `url`. */
export async function removeArtworkImage(url: string): Promise<void> {
  const name = await imagesCacheName();
  if (!name) return;
  const cache = await caches.open(name);
  await cache.delete(url);
}

/** Deletes this app's whole images cache (logout, or another user signing in). */
export async function deleteImagesCaches(): Promise<void> {
  if (typeof caches === "undefined") return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((key) => key.endsWith(IMAGES_CACHE_SUFFIX)).map((key) => caches.delete(key)));
}
