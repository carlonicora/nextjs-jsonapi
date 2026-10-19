/**
 * A next-intl message file: nested objects whose leaves are strings.
 */
export type MessageTree = { [key: string]: string | MessageTree };

function isMessageTree(value: unknown): value is MessageTree {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Deep-merges two message trees. At every path the override's leaf wins; a path
 * only in the base stays; a path only in the override is added. A non-object
 * value replaces, never merges. Neither input is mutated; the result is a new
 * object at every level.
 */
export function mergeMessages(base: MessageTree, override: MessageTree): MessageTree {
  const merged: MessageTree = {};

  for (const [key, value] of Object.entries(base)) {
    merged[key] = isMessageTree(value) ? mergeMessages(value, {}) : value;
  }

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    merged[key] = isMessageTree(value) ? mergeMessages(isMessageTree(current) ? current : {}, value) : value;
  }

  return merged;
}
