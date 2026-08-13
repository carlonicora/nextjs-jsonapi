/**
 * True when an image src is an absolute remote URL.
 *
 * `next/image` THROWS when it is given an absolute URL whose hostname is not
 * listed in `images.remotePatterns`, which takes down the whole page through
 * the nearest error boundary. Avatars can come from OAuth providers
 * (Discord, Google, ...), so their hostname is user-controlled and can never
 * be reliably enumerated in config. Pass `unoptimized` for these srcs.
 *
 * `blob:` and `data:` srcs are excluded: `next/image` already marks those
 * unoptimized on its own.
 */
export function isRemoteImageSrc(src?: string | null): boolean {
  if (!src) return false;
  return src.startsWith("http://") || src.startsWith("https://");
}
