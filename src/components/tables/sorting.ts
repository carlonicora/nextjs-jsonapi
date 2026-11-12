/** Direction of a column sort. */
export type SortDirection = "asc" | "desc";

/**
 * The fields a column sorts by: its `meta.sortFields` when declared (a column
 * built from several stored fields, or whose stored property differs from its
 * id), otherwise its id.
 */
export function sortFieldsOf(column: { id?: string; columnDef: { meta?: unknown } }): string[] {
  const meta = column.columnDef.meta as { sortFields?: unknown } | undefined;
  if (Array.isArray(meta?.sortFields) && meta.sortFields.length > 0) {
    return meta.sortFields.filter((field): field is string => typeof field === "string");
  }
  return column.id ? [column.id] : [];
}

/**
 * The direction `sort` (JSON:API wire format) gives a column sorting by `fields`,
 * or `undefined` when `sort` is about another column or absent.
 */
export function sortStateFor(sort: string | undefined, fields: string[]): SortDirection | undefined {
  if (!sort || fields.length === 0) return undefined;
  if (sort === fields.join(",")) return "asc";
  if (sort === fields.map((field) => `-${field}`).join(",")) return "desc";
  return undefined;
}

/**
 * The sort a header click sets: none → ascending → descending → none.
 * Returns `null` to clear the sort.
 */
export function nextSortValue(current: string | undefined, fields: string[]): string | null {
  switch (sortStateFor(current, fields)) {
    case undefined:
      return fields.join(",");
    case "asc":
      return fields.map((field) => `-${field}`).join(",");
    case "desc":
      return null;
  }
}
