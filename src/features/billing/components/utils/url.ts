/**
 * The URL to write back after consuming a one-shot query parameter (a deep-link
 * `?action=`). Drops only `param`; every other parameter and the hash stay, so a
 * host page that keys its state on the URL (the settings hub's `?section=`) keeps
 * showing the same place.
 */
export function urlWithoutParam(params: { pathname: string; search: string; hash?: string; param: string }): string {
  const query = new URLSearchParams(params.search);
  query.delete(params.param);
  const remaining = query.toString();
  return `${params.pathname}${remaining ? `?${remaining}` : ""}${params.hash ?? ""}`;
}
