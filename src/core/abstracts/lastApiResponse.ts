/**
 * Last-response store shared by `AbstractService` and `ClientAbstractService`.
 *
 * `useDataListRetriever` reads the total here when the calling service does not
 * forward a `total` ref. The values MUST therefore always describe the most
 * recent API response: writing only when a response carries `meta.total` let a
 * total leak across entities (a judgement list's 407871 showing up under a task
 * list, whose API never returns a total at all).
 *
 * Both service bases write through `setLastApiResponse`. The module has no
 * imports so the client base can use it without pulling in server code — the
 * reason the two bases do not import each other.
 */
let lastApiTotal: number | undefined = undefined;
let lastApiMeta: Record<string, any> | undefined = undefined;

/** Record the top-level `meta` of the response that just completed. */
export function setLastApiResponse(meta: Record<string, any> | undefined): void {
  lastApiMeta = meta;
  lastApiTotal = meta?.total;
}

export function getLastApiTotal(): number | undefined {
  return lastApiTotal;
}

export function clearLastApiTotal(): void {
  lastApiTotal = undefined;
}

export function getLastApiMeta(): Record<string, any> | undefined {
  return lastApiMeta;
}

export function clearLastApiMeta(): void {
  lastApiMeta = undefined;
}
