import type { ApiData } from "../core/interfaces/ApiData";
import { getOfflineConfig, getOfflineStore, OfflineUnavailableError } from "./config";
import { rootIdForResource, linkKindFor, linkKindsOf, linksOfKind } from "./generic-answers";
import { splitApiUrl } from "./local-transport";
import { matchPattern } from "./router";
import type { DeviceStore, StoredLink } from "./store/DeviceStore";
import type { OfflineTypeConfig } from "./types";
import { cacheArtworkImage, imageUrlOf } from "./sync/artwork-cache";
import { knownRootIds } from "./sync/known-roots";
import { recordKeyOf, waitingRecordKeys } from "./sync/waiting";

export type WriteThroughRequest = { method: string; url: string };

function updatedAtOf(resource: any): Date | null {
  const value = resource?.attributes?.updatedAt;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

type Identifier = { type: string; id: string };

function identifiersOf(relationship: any): Identifier[] {
  const data = relationship?.data;
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).filter((item: any) => item && item.type && item.id);
}

/**
 * Brings the stored links of the written record in line with the relationships the answer
 * carries (only those whose `data` it holds), as the local answers do: a link of the
 * relationship (its name or mapped Neo4j type; any kind when the type is not mapped, for an
 * identifier the record held before) to an identifier no longer there is removed, and a new
 * identifier gets a link of `linkKindFor` the relationship.
 */
async function updateLinks(
  store: DeviceStore,
  typeConfig: OfflineTypeConfig | undefined,
  record: Identifier,
  before: any,
  after: any,
): Promise<void> {
  const otherEnd = (link: StoredLink) => (link.fromId === record.id ? link.toId : link.fromId);
  const allLinks = async (): Promise<StoredLink[]> => [
    ...(await store.linksFrom(record.id)),
    ...(await store.linksTo(record.id)),
  ];

  for (const [name, relationship] of Object.entries<any>(after ?? {})) {
    if (!relationship || !("data" in relationship)) continue;
    const next = new Map(identifiersOf(relationship).map((identifier) => [identifier.id, identifier]));
    const previous = new Set(identifiersOf(before?.[name]).map((identifier) => identifier.id));
    const kinds = linkKindsOf(typeConfig, name) ?? [name];
    const ofRelationship = await linksOfKind(store, record.id, kinds, "both");
    const mapped = linkKindsOf(typeConfig, name) !== undefined;

    const stale = [
      ...ofRelationship.filter((link) => !next.has(otherEnd(link))),
      // Unmapped: the link to an identifier the record held before may carry any kind.
      ...(mapped ? [] : (await allLinks()).filter((link) => previous.has(otherEnd(link)) && !next.has(otherEnd(link)))),
    ];
    for (const link of stale) await store.deleteLink({ fromId: link.fromId, toId: link.toId, kind: link.kind });

    const linked = new Set(
      (mapped ? await linksOfKind(store, record.id, kinds, "both") : await allLinks()).map(otherEnd),
    );
    for (const [id, identifier] of next) {
      if (linked.has(id)) continue;
      await store.putLink({
        fromType: record.type,
        fromId: record.id,
        toType: identifier.type,
        toId: id,
        kind: linkKindFor(typeConfig, name),
        props: {},
      });
    }
  }
}

type ImageChange = { url: string; previousUrl?: string };

async function storeResource(
  store: DeviceStore,
  resource: any,
  pathRootId: string | undefined,
  waiting: Set<string>,
  kept: Set<string>,
  primary: boolean,
  images: ImageChange[],
): Promise<void> {
  const config = getOfflineConfig();
  if (!resource?.type || !resource?.id) return;
  if (!config.types.some((typeConfig) => typeConfig.module.name === resource.type)) return;
  // A record with unsent local changes keeps them: the next sync, once they are sent, brings
  // the server's version.
  if (waiting.has(recordKeyOf(resource.type, resource.id))) return;

  const existing = await store.getRecord(resource.type, resource.id);
  if (existing && existing.base !== null) return;
  const rootId = existing?.rootId ?? (await rootIdForResource(store, config, resource)) ?? pathRootId;
  // A record that belongs to no root record on this device waits for the next sync.
  if (!rootId) return;
  // Only the root records the device keeps are written through (never a player's root record).
  if (!kept.has(rootId)) return;

  // An answer can carry a sparse resource (fields limited): it is merged onto what is stored.
  const before = existing?.resource ?? {};
  const merged = {
    ...before,
    ...resource,
    attributes: { ...(before.attributes ?? {}), ...(resource.attributes ?? {}) },
    relationships: { ...(before.relationships ?? {}), ...(resource.relationships ?? {}) },
  };

  await store.putRecord({
    type: resource.type,
    id: resource.id,
    rootId,
    resource: merged,
    updatedAt: updatedAtOf(resource) ?? existing?.updatedAt ?? null,
    base: null,
    localOnly: false,
  });
  if (primary) {
    const typeConfig = config.types.find((candidate) => candidate.module.name === resource.type);
    await updateLinks(store, typeConfig, resource, before.relationships, resource.relationships);
  }

  const url = imageUrlOf(merged);
  const previousUrl = imageUrlOf(existing?.resource);
  if (url && url !== previousUrl) images.push({ url, previousUrl });
}

/**
 * After a successful online write, copies the answer into the device copy so it is never behind
 * the GM's own work: the resource and its `included` for POST/PUT/PATCH, the record removed for a
 * DELETE. It never fails the request: a problem is logged and the next sync repairs the copy.
 */
export async function writeThrough(request: WriteThroughRequest, response: ApiData): Promise<void> {
  const method = request.method.toUpperCase();
  if (method === "GET" || !response.ok) return;

  try {
    const config = getOfflineConfig();
    if (!config.getUserId()) return;
    const { path } = splitApiUrl(request.url);
    const store = await getOfflineStore();

    if (method === "DELETE") {
      for (const typeConfig of config.types) {
        const params = matchPattern([typeConfig.module, ":id"], path);
        if (params) {
          await store.deleteRecord(typeConfig.module.name, params.id);
          return;
        }
      }
      return;
    }

    const rootParams = matchPattern([config.rootModule, ":rootId"], path.split("/").slice(0, 2).join("/"));
    const pathRootId = rootParams?.rootId;

    const document = response.data;
    const primary = Array.isArray(document?.data) ? document.data : document?.data ? [document.data] : [];
    const waiting = waitingRecordKeys(
      await store.queue(),
      new Set(config.types.map((typeConfig) => typeConfig.module.name)),
    );
    // The root records this device keeps for the signed-in user (stored roots, waiting changes, last
    // sync roots): a write in any other root record (a player's) stores nothing.
    const kept = new Set(await knownRootIds(store));
    const images: ImageChange[] = [];
    await store.transaction(async (transactionStore) => {
      for (const resource of primary) {
        await storeResource(transactionStore, resource, pathRootId, waiting, kept, true, images);
      }
      for (const resource of document?.included ?? []) {
        await storeResource(transactionStore, resource, pathRootId, waiting, kept, false, images);
      }
    });
    // A new image URL of an artwork: downloaded, the old cached image removed (as the sync does).
    for (const image of images) await cacheArtworkImage(image.url, image.previousUrl);
  } catch (error) {
    // A browser that cannot keep the device copy was already warned about once.
    if (error instanceof OfflineUnavailableError) return;
    console.warn("[offline] could not copy the answer to the device", error);
  }
}
