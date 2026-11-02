import { EndpointCreator } from "../../core/endpoint/EndpointCreator";
import { Modules } from "../../core/registry/ModuleRegistry";
import { buildUrl, JsonApiPost } from "../../unified/JsonApiRequest";
import { getOfflineConfig, getOfflineStore, isOfflineConfigured } from "../config";
import { allowWhileReconnecting, getOfflineState, setOfflineState } from "../state";
import type { DeviceStore, QueueEntry } from "../store/DeviceStore";
import { isRootLocked } from "../store/lifecycle";
import { writeThrough } from "../write-through";
import { refreshOfflineCounts } from "./counts";
import { OfflineChangeSet } from "./models/OfflineChangeSet";
import { OfflineChange, OfflineChangeResult } from "./models/OfflineChangeSetInterface";
import { currentLocale, refreshSession } from "./session-refresh";
import { recordKeysOfEntry, waitingRecordKeys } from "./waiting";

export type DrainResult = { applied: number; conflicts: number; stoppedForLogin: boolean };

const syncedTypeNames = () => new Set(getOfflineConfig().types.map((typeConfig) => typeConfig.module.name));

/**
 * The body as sent: each resource's server-owned fields (AI summaries, tl;dr, `aiStatus`, …) are
 * left out of its attributes. The stored body and the stored record keep them.
 */
function withoutServerOwnedFields(body: any): any {
  const data = body?.data;
  if (!data) return body;
  const owned = new Map(
    getOfflineConfig().types.map((typeConfig) => [typeConfig.module.name, typeConfig.serverOwnedFields]),
  );
  const strip = (resource: any) => {
    const fields = owned.get(resource?.type) ?? [];
    if (!resource?.attributes || fields.length === 0) return resource;
    const attributes = { ...resource.attributes };
    for (const field of fields) delete attributes[field];
    return { ...resource, attributes };
  };
  return { ...body, data: Array.isArray(data) ? data.map(strip) : strip(data) };
}

function toChange(entry: QueueEntry): OfflineChange {
  const change: OfflineChange = { seq: entry.seq, method: entry.method as OfflineChange["method"], path: entry.path };
  if (entry.body !== undefined) change.body = withoutServerOwnedFields(entry.body);
  if (entry.recordType) change.recordType = entry.recordType;
  if (entry.recordId) change.recordId = entry.recordId;
  change.base = entry.base ?? null;
  if (entry.resolution) change.resolution = entry.resolution;
  return change;
}

/**
 * The merge the server settled, as a resource the record type's model can rehydrate: the server's
 * current resource with the merged attribute values laid over it (decision piece 2: the library
 * shapes stored resources). Undefined when the server gave no merge or no current record.
 */
function mergedResource(current: any, merged: Record<string, unknown> | undefined): any | undefined {
  if (!merged || !current?.type) return undefined;
  return { ...current, attributes: { ...(current.attributes ?? {}), ...merged } };
}

function newPackageId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * The id of the package to send: the id of a package that never got its answer (the page
 * closed, the network dropped) when one of the entries carries it, so the server applies it
 * once; a fresh id otherwise.
 */
function packageIdFor(entries: QueueEntry[]): string {
  return entries.find((entry) => entry.packageId)?.packageId ?? newPackageId();
}

/** The entries to send: pending, of unlocked root records, not behind a conflict on the same record. */
async function entriesToSend(store: DeviceStore): Promise<QueueEntry[]> {
  const all = await store.queue();
  const typeNames = syncedTypeNames();
  const blocked = waitingRecordKeys(
    all.filter((entry) => entry.status === "conflict"),
    typeNames,
  );
  const lockedIds = new Set(getOfflineState().lockedRootIds);
  const lockedByRoot = new Map<string, boolean>();
  const now = new Date();

  const result: QueueEntry[] = [];
  for (const entry of all) {
    // "sending" is a package that never got its answer (the page closed): it is sent again.
    if (entry.status !== "pending" && entry.status !== "sending") continue;
    if (recordKeysOfEntry(entry, typeNames).some((key) => blocked.has(key))) continue;

    if (!lockedByRoot.has(entry.rootId)) {
      lockedByRoot.set(
        entry.rootId,
        lockedIds.has(entry.rootId) || isRootLocked(await store.getSyncState(entry.rootId), now),
      );
    }
    if (lockedByRoot.get(entry.rootId)) continue;
    result.push(entry);
  }
  return result.sort((a, b) => a.seq - b.seq);
}

async function applyResult(
  store: DeviceStore,
  entry: QueueEntry,
  result: OfflineChangeResult,
): Promise<"applied" | "conflict" | "pending"> {
  if (result.status === "applied") {
    await store.removeQueueEntry(entry.seq);
    // The record's base is kept only while it has unsent changes; cleared first, so the
    // write-through below may store the server's answer (it never overwrites a record that
    // still has a base or a waiting change).
    const typeNames = syncedTypeNames();
    const stillWaiting = waitingRecordKeys(await store.queue(), typeNames);
    for (const key of recordKeysOfEntry(entry, typeNames)) {
      if (stillWaiting.has(key)) continue;
      const separator = key.indexOf(":");
      const record = await store.getRecord(key.slice(0, separator), key.slice(separator + 1));
      if (record && (record.base !== null || record.localOnly)) {
        await store.putRecord({ ...record, base: null, localOnly: false });
      }
    }
    if (result.response) {
      await writeThrough(
        { method: entry.method, url: entry.path },
        { ok: true, status: 200, statusText: "OK", data: result.response },
      );
    } else if (entry.method === "DELETE") {
      await writeThrough(
        { method: entry.method, url: entry.path },
        { ok: true, status: 204, statusText: "OK", data: undefined },
      );
    }
    return "applied";
  }

  if (result.status === "conflict" || result.status === "could-not-apply") {
    await store.addConflict({
      queueSeq: entry.seq,
      kind: result.status === "could-not-apply" ? "could-not-apply" : (result.conflict ?? "fields"),
      recordType: entry.recordType,
      recordId: entry.recordId,
      mine: entry.body ?? null,
      theirs: result.current ?? null,
      base: entry.base ?? null,
      merged: mergedResource(result.current, result.merged),
      fields: result.conflictFields ?? [],
      blocks: result.conflictBlocks,
      reason: result.detail,
    });
    await store.setQueueStatus(entry.seq, "conflict");
    return "conflict";
  }

  await store.setQueueStatus(entry.seq, "pending");
  return "pending";
}

async function drain(): Promise<DrainResult> {
  const outcome: DrainResult = { applied: 0, conflicts: 0, stoppedForLogin: false };
  if (!isOfflineConfigured() || !getOfflineConfig().getUserId()) return outcome;

  const store = await getOfflineStore();
  const entries = await entriesToSend(store);
  if (entries.length === 0) return outcome;

  const session = await refreshSession();
  if (session === "unreachable") return outcome;
  if (session === "expired") return { ...outcome, stoppedForLogin: true };

  setOfflineState({ draining: true });
  const handled = new Set<number>();
  try {
    const packageId = packageIdFor(entries);
    // Stored with the entries before sending: an unanswered package keeps its id for the resend.
    await store.setQueuePackage(
      entries.map((entry) => entry.seq),
      packageId,
    );
    for (const entry of entries) await store.setQueueStatus(entry.seq, "sending");

    // ONE request with every waiting change, whatever its size: never split (Carlo, 2026-11-01).
    const endpoint = new EndpointCreator({ endpoint: Modules.OfflineChangeSet }).generate();
    // During a reconnect attempt the session is still offline: this request goes to the network.
    const release = allowWhileReconnecting(buildUrl(endpoint));
    let response: Awaited<ReturnType<typeof JsonApiPost>>;
    try {
      response = await JsonApiPost({
        classKey: Modules.OfflineChangeSet,
        endpoint,
        body: { id: packageId, changes: entries.map(toChange) },
        language: currentLocale(),
      });
    } finally {
      release();
    }

    if (!response.ok) {
      if (response.response === 401) outcome.stoppedForLogin = true;
      return outcome;
    }

    // The server answered for this package: every entry left in the queue leaves it.
    await store.setQueuePackage(
      entries.map((entry) => entry.seq),
      null,
    );

    const results = new Map((response.data as OfflineChangeSet).results.map((result) => [result.seq, result]));
    for (const entry of entries) {
      const result = results.get(entry.seq);
      const status = result ? await applyResult(store, entry, result) : "pending";
      if (!result) await store.setQueueStatus(entry.seq, "pending");
      handled.add(entry.seq);
      if (status === "applied") outcome.applied++;
      if (status === "conflict") outcome.conflicts++;
    }
    return outcome;
  } catch (error) {
    console.error("[offline] sending the waiting changes failed", error);
    return outcome;
  } finally {
    // Nothing is dropped: every entry without an answer goes back to pending.
    for (const entry of entries) {
      if (!handled.has(entry.seq)) await store.setQueueStatus(entry.seq, "pending");
    }
    setOfflineState({ draining: false });
    await refreshOfflineCounts(store);
  }
}

let _inFlight: Promise<DrainResult> | undefined;

/**
 * Sends every waiting change of the unlocked root records in ONE `offline-change-sets` request,
 * after renewing the sign-in. Applied entries are removed and their answer written to the
 * device copy; conflicts become Conflict rows; waiting entries stay pending. A network error
 * or an expired sign-in stops it and keeps every entry.
 */
export function drainQueue(): Promise<DrainResult> {
  if (!_inFlight) {
    _inFlight = drain().finally(() => {
      _inFlight = undefined;
    });
  }
  return _inFlight;
}
