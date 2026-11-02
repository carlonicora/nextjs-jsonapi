import { EndpointCreator } from "../../core/endpoint/EndpointCreator";
import { getOfflineConfig, getOfflineStore } from "../config";
import { getOfflineState } from "../state";
import type { Conflict, DeviceStore, QueueEntry } from "../store/DeviceStore";
import type { OfflineChangeResolution } from "./models/OfflineChangeSetInterface";
import { refreshOfflineCounts } from "./counts";
import { drainQueue } from "./drain-queue";

export { useConflicts } from "./counts";

export type ConflictChoice =
  | { kind: "mine" }
  | { kind: "theirs" }
  /**
   * Per conflicting field: whose value wins. `mergedBody`: the JSON:API document the record
   * type's model built with createJsonApi() holding only the fields chosen "merged".
   */
  | { kind: "fields"; choices: Record<string, "mine" | "theirs" | "merged">; mergedBody?: any }
  | { kind: "restore" }
  | { kind: "accept-deletion" }
  | { kind: "delete-anyway" }
  | { kind: "retry" }
  | { kind: "discard" };

function updatedAtOf(resource: any): Date | null {
  const value = resource?.attributes?.updatedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Writes the chosen "theirs" and "merged" values of the conflicting fields into the stored record. */
async function applyChoicesToRecord(
  store: DeviceStore,
  conflict: Conflict,
  choices: Record<string, "mine" | "theirs" | "merged">,
  mergedBody: any,
): Promise<void> {
  if (!conflict.recordType || !conflict.recordId) return;
  const record = await store.getRecord(conflict.recordType, conflict.recordId);
  if (!record) return;
  const attributes = { ...(record.resource?.attributes ?? {}) };
  const relationships = { ...(record.resource?.relationships ?? {}) };
  for (const [field, choice] of Object.entries(choices)) {
    const source = choice === "theirs" ? conflict.theirs : choice === "merged" ? mergedBody?.data : undefined;
    if (!source) continue;
    if (source.attributes && field in source.attributes) attributes[field] = source.attributes[field];
    else if (source.relationships && field in source.relationships) relationships[field] = source.relationships[field];
  }
  await store.putRecord({ ...record, resource: { ...record.resource, attributes, relationships } });
}

async function rootIdOf(store: DeviceStore, conflict: Conflict, entry: QueueEntry | undefined): Promise<string> {
  if (entry) return entry.rootId;
  if (conflict.recordType && conflict.recordId) {
    const record = await store.getRecord(conflict.recordType, conflict.recordId);
    if (record) return record.rootId;
  }
  throw new Error(`[offline] conflict ${conflict.id} belongs to no root record on this device`);
}

/** The collection path of a record type, from the configured module (EndpointCreator). */
function collectionPath(recordType: string): string {
  const module = getOfflineConfig().types.find((typeConfig) => typeConfig.module.name === recordType)?.module;
  return new EndpointCreator({ endpoint: module ?? recordType }).generate();
}

/** Queues the conflicting change again, unchanged apart from `resolution`, and drops the old entry. */
async function requeueOriginal(
  store: DeviceStore,
  conflict: Conflict,
  entry: QueueEntry | undefined,
  fallbackMethod: "PATCH" | "DELETE",
  resolution: OfflineChangeResolution,
): Promise<void> {
  const method = entry?.method ?? fallbackMethod;
  const body = method === "DELETE" ? undefined : (entry?.body ?? conflict.mine ?? undefined);
  await store.enqueue({
    rootId: await rootIdOf(store, conflict, entry),
    method,
    path:
      entry?.path ??
      new EndpointCreator({ endpoint: collectionPath(conflict.recordType!), id: conflict.recordId }).generate(),
    ...(body !== undefined ? { body } : {}),
    recordType: entry?.recordType ?? conflict.recordType,
    recordId: entry?.recordId ?? conflict.recordId,
    base: entry ? entry.base : (conflict.base ?? null),
    // QueueEntry["resolution"] is the store's copy of OfflineChange["resolution"].
    resolution: resolution as QueueEntry["resolution"],
  });
  if (entry) await store.removeQueueEntry(entry.seq);
}

async function resolve(store: DeviceStore, conflict: Conflict, choice: ConflictChoice): Promise<void> {
  const entry = (await store.queue()).find((candidate) => candidate.seq === conflict.queueSeq);
  const dropEntry = async () => {
    if (entry) await store.removeQueueEntry(entry.seq);
  };

  switch (choice.kind) {
    case "mine":
    case "fields": {
      if (choice.kind === "fields" && Object.values(choice.choices).every((value) => value === "theirs")) {
        return resolve(store, conflict, { kind: "theirs" });
      }
      // The ORIGINAL change goes back (original body and base, so the server's three-way merge
      // keeps every field only the server changed), carrying how each conflicting field is settled.
      const resolution: OfflineChangeResolution =
        choice.kind === "mine"
          ? { kind: "mine" }
          : {
              kind: "merged",
              choices: choice.choices,
              ...(choice.mergedBody !== undefined ? { mergedBody: choice.mergedBody } : {}),
            };
      await requeueOriginal(store, conflict, entry, "PATCH", resolution);
      if (choice.kind === "fields") await applyChoicesToRecord(store, conflict, choice.choices, choice.mergedBody);
      break;
    }
    case "theirs": {
      // Only the device changes: the server's version replaces mine.
      await dropEntry();
      if (conflict.recordType && conflict.recordId) {
        if (conflict.theirs) {
          await store.putRecord({
            type: conflict.recordType,
            id: conflict.recordId,
            rootId: await rootIdOf(store, conflict, entry),
            resource: conflict.theirs,
            updatedAt: updatedAtOf(conflict.theirs),
            base: null,
            localOnly: false,
          });
        } else {
          await store.deleteRecord(conflict.recordType, conflict.recordId);
        }
      }
      break;
    }
    case "restore": {
      // Deleted on the server: created again with my version.
      if (!conflict.recordType) throw new Error(`[offline] conflict ${conflict.id} has no record to restore`);
      const body = conflict.mine ?? entry?.body;
      const rootId = await rootIdOf(store, conflict, entry);
      await store.enqueue({
        rootId,
        method: "POST",
        path: collectionPath(conflict.recordType),
        body,
        recordType: conflict.recordType,
        recordId: conflict.recordId,
        base: null,
      });
      await dropEntry();
      if (conflict.recordId) {
        const record = await store.getRecord(conflict.recordType, conflict.recordId);
        // localOnly keeps it on the device until the server has it again.
        if (record) await store.putRecord({ ...record, base: null, localOnly: true });
        else if (body?.data)
          await store.putRecord({
            type: conflict.recordType,
            id: conflict.recordId,
            rootId,
            resource: body.data,
            updatedAt: null,
            base: null,
            localOnly: true,
          });
      }
      break;
    }
    case "accept-deletion": {
      await dropEntry();
      if (conflict.recordType && conflict.recordId) await store.deleteRecord(conflict.recordType, conflict.recordId);
      break;
    }
    case "delete-anyway": {
      // The original DELETE with a resolution: the server skips the changed-on-server check.
      await requeueOriginal(store, conflict, entry, "DELETE", { kind: "mine" });
      break;
    }
    case "retry": {
      if (entry) await store.setQueueStatus(entry.seq, "pending");
      break;
    }
    case "discard": {
      await dropEntry();
      break;
    }
  }

  await store.removeConflict(conflict.id);
}

/**
 * Applies the GM's choice for one conflict. "keep mine", per-field choices, "restore" and "delete anyway"
 * queue one more change (sent with the next package); "keep theirs" and "let the deletion
 * stand" only update the device. Online, the queue is sent right away.
 */
export async function resolveConflict(id: string, choice: ConflictChoice): Promise<void> {
  const store = await getOfflineStore();
  const conflict = (await store.conflicts()).find((candidate) => candidate.id === id);
  if (!conflict) throw new Error(`[offline] no conflict ${id}`);

  await store.transaction((tx) => resolve(tx, conflict, choice));
  await refreshOfflineCounts(store);

  if (getOfflineState().online) {
    drainQueue().catch((error) => console.warn("[offline] sending the resolved change failed", error));
  }
}
