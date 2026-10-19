/**
 * A next-intl message file: nested objects whose leaves are strings or arrays of
 * strings (read with `t.raw()`).
 */
export type MessageTree = { [key: string]: string | string[] | MessageTree };

function isMessageTree(value: unknown): value is MessageTree {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function copyLeaf(value: string | string[]): string | string[] {
  return Array.isArray(value) ? [...value] : value;
}

/**
 * Deep-merges two message trees. At every path the override's leaf wins; a path
 * only in the base stays; a path only in the override is added. A non-object
 * value (a string or an array) replaces, never merges. Neither input is mutated;
 * the result is a new object, and a new array, at every level.
 */
export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const merged: MessageTree = {};

  for (const [key, value] of Object.entries(base)) {
    merged[key] = isMessageTree(value) ? mergeMessages(value, {}) : copyLeaf(value);
  }

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    merged[key] = isMessageTree(value) ? mergeMessages(isMessageTree(current) ? current : {}, value) : copyLeaf(value);
  }

  return merged;
}
