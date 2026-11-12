"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The sort of one list, kept in the page address as `sort[<sortKey>]=<value>`
 * (JSON:API wire format: `name`, `-name`, `lastName,firstName`).
 *
 * The address is read from `window.location` once on mount, so this hook is not a
 * Next search-params hook consumer and needs no `<Suspense>` boundary. `ready` is false
 * until that read has happened; a loader holds its first fetch until then, so a
 * restored sort costs one request, not two.
 *
 * `setSort` replaces only the query string of the current path with
 * `history.replaceState`, keeping every other search param and the hash: no
 * navigation, no scroll, no locale handling. `null` removes this list's key only.
 *
 * @param params.sortKey the list's address key; two lists on one page need two keys.
 */
export function useListSortParam(params: { sortKey: string }): {
  sort: string | undefined;
  ready: boolean;
  setSort: (value: string | null) => void;
} {
  const { sortKey } = params;
  const [sort, setSortState] = useState<string | undefined>(undefined);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get(`sort[${sortKey}]`);
    setSortState(value ? value : undefined);
    setReady(true);
  }, [sortKey]);

  const setSort = useCallback(
    (value: string | null) => {
      const search = new URLSearchParams(window.location.search);
      if (value) search.set(`sort[${sortKey}]`, value);
      else search.delete(`sort[${sortKey}]`);

      const next = search.toString();
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`,
      );
      setSortState(value ? value : undefined);
    },
    [sortKey],
  );

  return { sort, ready, setSort };
}
