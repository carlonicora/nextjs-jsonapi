import type { QueueEntry } from "../store/DeviceStore";

export const recordKeyOf = (type: string, id: string) => `${type}:${id}`;

/**
 * The records a queue entry targets: its `recordType`/`recordId`, the `data.type`/`data.id` of
 * its body (a record created on this device), and the `<type>/<id>` of its path (the last
 * segment naming a synced type, when an id follows it: `npcs/n1`, `npcs/n1/merge`; a collection
 * path such as `roots/C/npcs` targets no record).
 */
export function recordKeysOfEntry(entry: QueueEntry, typeNames: Set<string>): string[] {
  const keys: string[] = [];
  if (entry.recordType && entry.recordId) keys.push(recordKeyOf(entry.recordType, entry.recordId));

  const data = entry.body?.data;
  if (data && !Array.isArray(data) && typeof data.type === "string" && typeof data.id === "string") {
    keys.push(recordKeyOf(data.type, data.id));
  }

  const segments = String(entry.path ?? "")
    .split("?")[0]
    .split("/")
    .filter(Boolean);
  for (let index = segments.length - 1; index >= 0; index--) {
    if (!typeNames.has(segments[index])) continue;
    if (index + 1 < segments.length) keys.push(recordKeyOf(segments[index], segments[index + 1]));
    break;
  }
  return keys;
}

/**
 * Every record with a waiting change: targeted by a queue entry that is pending, sending, in
 * conflict or failed. Such a record is never overwritten or deleted by a sync or a write-through.
 */
export function waitingRecordKeys(queue: QueueEntry[], typeNames: Set<string>): Set<string> {
  const keys = new Set<string>();
  for (const entry of queue) for (const key of recordKeysOfEntry(entry, typeNames)) keys.add(key);
  return keys;
}
