import { EndpointCreator } from "../../core/endpoint/EndpointCreator";
import { ApiRequestDataTypeInterface } from "../../core/interfaces/ApiRequestDataTypeInterface";
import { Modules } from "../../core/registry/ModuleRegistry";
import { JsonApiGet } from "../../unified/JsonApiRequest";
import { getOfflineConfig, getOfflineStore, isOfflineConfigured, rootKinds, writeOfflineLastSync } from "../config";
import { canReachApi, setOfflineState } from "../state";
import type { DeviceStore, SkippedRecord, StoredRecord } from "../store/DeviceStore";
import type { OfflineRootKind } from "../types";
import { cacheArtworkImage, imageUrlOf, removeArtworkImage } from "./artwork-cache";
import { knownRootIds, refreshLockedRoots, rememberSyncRoots } from "./known-roots";
import { ROOT_SYNC_ENDPOINT, RootSync } from "./models/RootSync";
import { currentLocale } from "./session-refresh";
import { recordKeyOf as keyOf, waitingRecordKeys } from "./waiting";

class SyncInterruptedError extends Error {}

function assertStillOnline(): void {
  if (!canReachApi()) throw new SyncInterruptedError("The connection dropped during the sync");
}

/**
 * A record the GM cannot read (403) or that is gone (404) is skipped by this sync (it never
 * blocks the sync state). It is not stored; it is remembered with its `updatedAt` from the sync
 * answer, and a later sync asks for it again only once that `updatedAt` is newer.
 */
const isSkippable = (status: number) => status === 403 || status === 404;

async function fetchResources(
  module: ApiRequestDataTypeInterface,
  endpoint: string,
  skipped: string[],
  included: any[],
): Promise<any[]> {
  const response = await JsonApiGet({ classKey: module, endpoint, language: currentLocale() });
  assertStillOnline();
  if (!response.ok) {
    if (isSkippable(response.response)) {
      skipped.push(endpoint);
      return [];
    }
    throw new Error(`[offline] GET ${endpoint} answered ${response.response}`);
  }
  included.push(...(response.raw?.included ?? []));
  const data = response.raw?.data;
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

async function imagesOfRoot(store: DeviceStore, rootId: string): Promise<{ type: string; id: string; url: string }[]> {
  const images: { type: string; id: string; url: string }[] = [];
  for (const typeConfig of getOfflineConfig().types) {
    for (const record of await store.listRecords({ type: typeConfig.module.name, rootId })) {
      const url = imageUrlOf(record.resource);
      if (url) images.push({ type: record.type, id: record.id, url });
    }
  }
  return images;
}

/**
 * Removes a root record from the device (records, links, sync state, images) unless it has waiting
 * changes. A shared record another root record still uses stays, with its image.
 */
async function removeRootIfIdle(store: DeviceStore, rootId: string): Promise<void> {
  if ((await store.queue()).some((entry) => entry.rootId === rootId)) return;
  const images = await imagesOfRoot(store, rootId);
  await store.removeRoot(rootId);
  for (const image of images) {
    if (!(await store.getRecord(image.type, image.id))) await removeArtworkImage(image.url);
  }
}

/**
 * Brings one root record's device copy up to date with the sync answer (C2): records changed since
 * the stored server time are fetched (C3), records gone from the root record are deleted, the links
 * are replaced, and artwork images are downloaded. The sync state is stored only once every
 * fetch succeeded (or answered 403/404). A record with a waiting change is never overwritten.
 */
export async function syncRoot(rootId: string, kind?: OfflineRootKind): Promise<void> {
  const config = getOfflineConfig();
  const rootKind = kind ?? rootKinds(config)[0];
  const store = await getOfflineStore();
  const previous = await store.getSyncState(rootId);

  const syncEndpoint = new EndpointCreator({
    endpoint: rootKind.module,
    id: rootId,
    childEndpoint: ROOT_SYNC_ENDPOINT,
  }).generate();
  const syncResponse = await JsonApiGet({
    classKey: rootKind.syncModule ?? Modules.RootSync,
    endpoint: syncEndpoint,
    language: currentLocale(),
  });
  assertStillOnline();
  if (!syncResponse.ok) {
    // Deleted, or no longer the GM's: removed from the device unless changes still wait.
    if (isSkippable(syncResponse.response)) {
      await removeRootIfIdle(store, rootId);
      return;
    }
    throw new Error(`[offline] GET ${syncEndpoint} answered ${syncResponse.response}`);
  }

  const sync = syncResponse.data as RootSync;
  if (sync.locked) {
    // Locked online, locked offline: nothing is downloaded, waiting changes are kept.
    await store.setSyncState(rootId, {
      serverTime: previous.serverTime,
      locked: true,
      lockedFrom: sync.lockedFrom ?? null,
    });
    await refreshLockedRoots();
    return;
  }

  const typeNames = new Set(config.types.map((typeConfig) => typeConfig.module.name));
  const entries = sync.entries.filter((entry) => typeNames.has(entry.type));
  const entryUpdatedAt = new Map(entries.map((entry) => [keyOf(entry.type, entry.id), entry.updatedAt]));
  const since = previous.serverTime;
  /** Inside the `updatedSince` window: a list read with `updatedSince` brings it. */
  const inWindow = (entry: { updatedAt: Date }) => !since || entry.updatedAt.getTime() > since.getTime();

  // What the device holds for this root record now. A record is fetched when it changed since the
  // last sync, and also when the device does not hold it or holds it as stale (updatedAt cleared
  // while it had a waiting change, see below) — unless an earlier sync skipped it (403/404, or
  // absent from the answer) and it has not changed on the server since.
  const stored = new Map<string, StoredRecord>();
  for (const typeConfig of config.types) {
    for (const record of await store.listRecords({ type: typeConfig.module.name, rootId })) {
      stored.set(keyOf(record.type, record.id), record);
    }
  }
  const previouslySkipped = new Map(
    (await store.skippedRecords(rootId)).map((record) => [keyOf(record.type, record.id), record.updatedAt]),
  );
  const isStale = (entry: { type: string; id: string; updatedAt: Date }) => {
    const key = keyOf(entry.type, entry.id);
    const record = stored.get(key);
    if (record && record.updatedAt !== null) return false;
    const skippedAt = previouslySkipped.get(key);
    return !skippedAt || entry.updatedAt.getTime() > skippedAt.getTime();
  };
  const changed = entries.filter((entry) => inWindow(entry) || isStale(entry));

  const skipped: string[] = [];
  const fetched: any[] = [];
  // Records the answers include whose type the device does not sync itself (the root record's
  // owner): kept for display only, so a local answer can include them as the server does.
  const included: any[] = [];
  // The root record of the kind is fetched before the other types: a kind's `typeEndpoints` are
  // built from it.
  const rootTypeName = rootKind.module.name;
  const orderedTypes = [
    ...config.types.filter((typeConfig) => typeConfig.module.name === rootTypeName),
    ...config.types.filter((typeConfig) => typeConfig.module.name !== rootTypeName),
  ];
  const rootResource = async (): Promise<StoredRecord["resource"]> => {
    const fresh = fetched.find((resource) => resource?.type === rootTypeName && resource?.id === rootId);
    if (fresh) return fresh;
    const storedRoot = await store.getRecord(rootTypeName, rootId);
    if (storedRoot) return storedRoot.resource;
    throw new Error(`[offline] ${rootTypeName} ${rootId}: the root record is needed to build the type endpoints`);
  };
  for (const typeConfig of orderedTypes) {
    const changedOfType = changed.filter((entry) => entry.type === typeConfig.module.name);
    if (changedOfType.length === 0) continue;

    const typeEndpoint = rootKind.typeEndpoints?.find((candidate) => candidate.module.name === typeConfig.module.name);
    if (typeEndpoint) {
      // One full list read under this kind, never with `updatedSince`.
      const endpoint = typeEndpoint.endpoint({ id: rootId, resource: await rootResource() });
      fetched.push(...(await fetchResources(typeConfig.module, endpoint, skipped, included)));
    } else if (typeConfig.fetch === "root-list") {
      // One list read per type. With `updatedSince` when every changed record is inside the
      // window; without it when a record older than the window is missing or stale on the
      // device, so the whole list comes in the same single request (never one read per record).
      const endpoint = new EndpointCreator({
        endpoint: rootKind.module,
        id: rootId,
        childEndpoint: typeConfig.module,
      }).addAdditionalParam("fetchAll", "true");
      if (since && changedOfType.every(inWindow)) endpoint.addAdditionalParam("updatedSince", since.toISOString());
      fetched.push(...(await fetchResources(typeConfig.module, endpoint.generate(), skipped, included)));
    } else if (typeConfig.fetch === "linked-list") {
      // Read only as a list per target: the targets are the other ends of the changed records'
      // sync links of `linkKind`; each target's list is read once, and only the type's entries kept.
      if (!typeConfig.linkedList) throw new Error(`[offline] ${typeConfig.module.name}: linked-list needs linkedList`);
      const { linkKind, endpoint } = typeConfig.linkedList;
      const changedIds = new Set(changedOfType.map((entry) => entry.id));
      const targets = new Map<string, { type: string; id: string }>();
      for (const link of sync.links) {
        if (link.kind !== linkKind || link.fromType !== typeConfig.module.name || !changedIds.has(link.fromId))
          continue;
        targets.set(keyOf(link.toType, link.toId), { type: link.toType, id: link.toId });
      }
      for (const target of targets.values()) {
        const resources = await fetchResources(typeConfig.module, endpoint(rootId, target), skipped, included);
        fetched.push(
          ...resources.filter((resource) => resource?.type === typeConfig.module.name && changedIds.has(resource.id)),
        );
      }
    } else {
      for (const entry of changedOfType) {
        const endpoint = new EndpointCreator({ endpoint: typeConfig.module, id: entry.id }).generate();
        fetched.push(...(await fetchResources(typeConfig.module, endpoint, skipped, included)));
      }
    }
  }

  const fetchedKeys = new Set(fetched.map((resource) => keyOf(resource?.type, resource?.id)));
  const previousImageUrls = new Map<string, string>();
  const removedImageUrls: string[] = [];

  await store.transaction(async (tx) => {
    // A record with a waiting change (pending, sending, in conflict or failed) is never
    // overwritten nor deleted here. Read inside this transaction, so an edit queued while the
    // records were being fetched is seen.
    const waiting = waitingRecordKeys(await tx.queue(), typeNames);

    for (const typeConfig of config.types) {
      for (const record of await tx.listRecords({ type: typeConfig.module.name, rootId })) {
        const key = keyOf(record.type, record.id);
        if (waiting.has(key)) {
          // Marked stale: once the change stops waiting (sent, resolved, discarded), the next
          // sync fetches the record again, whatever its updatedAt.
          if (record.updatedAt !== null) await tx.putRecord({ ...record, updatedAt: null });
          continue;
        }
        if (entryUpdatedAt.has(key)) continue;
        // Leaves this root record; deleted only when no other root record keeps it (a shared record).
        await tx.removeRecordFromRoot(record.type, record.id, rootId);
        const url = imageUrlOf(record.resource);
        if (url && !(await tx.getRecord(record.type, record.id))) removedImageUrls.push(url);
      }
    }

    for (const resource of fetched) {
      const key = keyOf(resource?.type, resource?.id);
      if (!entryUpdatedAt.has(key)) continue;
      if (waiting.has(key)) continue;
      const existing = await tx.getRecord(resource.type, resource.id);
      const previousUrl = imageUrlOf(existing?.resource);
      if (previousUrl) previousImageUrls.set(key, previousUrl);
      await tx.putRecord({
        type: resource.type,
        id: resource.id,
        rootId,
        resource,
        updatedAt: entryUpdatedAt.get(key) ?? null,
        base: null,
        localOnly: false,
      });
    }

    for (const resource of included) {
      if (!resource?.type || !resource?.id || typeNames.has(resource.type)) continue;
      await tx.putRecord({
        type: resource.type,
        id: resource.id,
        rootId,
        resource,
        updatedAt: null,
        base: null,
        localOnly: false,
      });
    }

    // Remembered skips: a changed record no answer brought (403/404, or absent from the list), and
    // an earlier skip still in the root record that was not asked for again.
    const skippedRecords: SkippedRecord[] = [];
    const changedKeys = new Set(changed.map((entry) => keyOf(entry.type, entry.id)));
    for (const entry of entries) {
      const key = keyOf(entry.type, entry.id);
      if (waiting.has(key) || fetchedKeys.has(key)) continue;
      if (changedKeys.has(key)) skippedRecords.push({ type: entry.type, id: entry.id, updatedAt: entry.updatedAt });
      else {
        const skippedAt = previouslySkipped.get(key);
        if (skippedAt) skippedRecords.push({ type: entry.type, id: entry.id, updatedAt: skippedAt });
      }
    }
    await tx.setSkippedRecords(rootId, skippedRecords);

    await tx.replaceRootLinks(rootId, sync.links);
    await tx.setSyncState(rootId, {
      serverTime: sync.serverTime,
      locked: false,
      lockedFrom: sync.lockedFrom ?? null,
    });
  });

  if (skipped.length > 0) {
    console.warn(`[offline] root record ${rootId}: skipped records the GM cannot read:`, skipped.join(", "));
  }

  for (const url of removedImageUrls) await removeArtworkImage(url);
  for (const typeConfig of config.types) {
    for (const record of await store.listRecords({ type: typeConfig.module.name, rootId })) {
      const url = imageUrlOf(record.resource);
      if (url) await cacheArtworkImage(url, previousImageUrls.get(keyOf(record.type, record.id)));
    }
  }

  await refreshLockedRoots();
}

/**
 * Syncs every root record of every kind (`listSyncRoots()` of the primary kind and of each
 * `extraRootKinds` entry), then removes from the device the known root records no kind lists
 * (unless they still have waiting changes). A kind whose list throws keeps its device copy
 * unchanged; the primary kind's list throwing stops the sync. Does nothing offline.
 */
export async function syncAll(): Promise<void> {
  if (!isOfflineConfigured()) return;
  const config = getOfflineConfig();
  if (!config.getUserId() || !canReachApi()) return;

  const [primaryKind, ...extraKinds] = rootKinds(config);
  let primaryRoots: string[];
  try {
    primaryRoots = await primaryKind.listSyncRoots();
  } catch (error) {
    console.warn("[offline] could not list the root records to sync", error);
    return;
  }
  const work: { rootId: string; kind: OfflineRootKind }[] = primaryRoots.map((rootId) => ({
    rootId,
    kind: primaryKind,
  }));
  const extraRoots: string[] = [];
  // Kinds whose list failed: their stored roots are kept as they are.
  const unlistedKinds: OfflineRootKind[] = [];
  for (const kind of extraKinds) {
    try {
      const ids = await kind.listSyncRoots();
      extraRoots.push(...ids);
      work.push(...ids.map((rootId) => ({ rootId, kind })));
    } catch (error) {
      console.warn(`[offline] could not list the ${kind.module.name} root records to sync`, error);
      unlistedKinds.push(kind);
    }
  }
  if (!canReachApi()) return;
  const kept = new Set(work.map((item) => item.rootId));
  if (unlistedKinds.length > 0) {
    const store = await getOfflineStore();
    for (const kind of unlistedKinds) {
      for (const record of await store.listRecords({ type: kind.module.name })) {
        kept.add(record.id);
        extraRoots.push(record.id);
      }
    }
  }
  rememberSyncRoots([...kept], extraRoots);

  const total = work.length;
  setOfflineState({ syncProgress: { done: 0, total } });
  try {
    let done = 0;
    for (const { rootId, kind } of work) {
      try {
        await syncRoot(rootId, kind);
      } catch (error) {
        console.warn(`[offline] sync of root record ${rootId} failed`, error);
        if (!canReachApi()) return;
      } finally {
        done += 1;
        setOfflineState({ syncProgress: { done, total } });
      }
    }

    // Every root record was tried: this counts as the device's last sync. The root count is the
    // primary kind's (shown as the number of root records, e.g. campaigns).
    const finishedAt = Date.now();
    const userId = config.getUserId();
    if (userId) writeOfflineLastSync(userId, finishedAt);
    setOfflineState({ lastSyncedAt: finishedAt, rootCount: primaryRoots.length });

    const store = await getOfflineStore();
    for (const rootId of await knownRootIds(store)) {
      if (!kept.has(rootId)) await removeRootIfIdle(store, rootId);
    }
    await refreshLockedRoots();
  } finally {
    setOfflineState({ syncProgress: null });
  }
}
