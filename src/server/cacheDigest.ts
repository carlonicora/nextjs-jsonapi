// Shared by `cachedGet.ts` and its client stub, so `serverRequest` reads the status
// back the same way whichever one the bundler resolved.

/** Reads the HTTP status from an `HTTP_<status>` digest, or `undefined` when there is none. */
export function statusFromDigest(error: unknown): number | undefined {
  const digest = (error as { digest?: unknown } | null | undefined)?.digest;
  if (typeof digest !== "string") return undefined;
  const match = /^HTTP_(\d+)$/.exec(digest);
  return match ? Number(match[1]) : undefined;
}
