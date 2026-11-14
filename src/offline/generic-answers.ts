import { CURRENT_USER_STORAGE_KEY } from "../features/user/data/user.storage";
import { getOfflineConfig, rootKinds } from "./config";
import { getOfflineState } from "./state";
import type { DeviceStore, StoredLink, StoredRecord } from "./store/DeviceStore";
import type {
  LocalAnswerContext,
  OfflineAnswer,
  OfflineConfig,
  OfflineMethod,
  OfflineRootKind,
  OfflineRoute,
  OfflineTypeConfig,
} from "./types";

const DEFAULT_PAGE_SIZE = 25;

// ---------------------------------------------------------------------------------------------
// Answers shared by every route
// ---------------------------------------------------------------------------------------------

/** A JSON:API errors document with one error, answered with `status`. */
export function errorAnswer(status: number, title: string, detail: string, code?: string): OfflineAnswer {
  return {
    status,
    body: { errors: [{ status: String(status), ...(code ? { code } : {}), title, detail }] },
  };
}

export function needsConnectionAnswer(detail: string = "Needs a connection"): OfflineAnswer {
  return errorAnswer(503, "Needs a connection", detail, "needs-connection");
}

export function notFoundAnswer(detail: string): OfflineAnswer {
  return errorAnswer(404, "Not found", detail);
}

/** A single document of one stored record, with `included` (`includedFor`). */
export async function singleAnswer(
  store: DeviceStore,
  record: StoredRecord,
  status: number = 200,
): Promise<OfflineAnswer> {
  return { status, body: { data: record.resource, included: await includedFor(store, [record]) } };
}

export function isRootWriteLocked(rootId: string | undefined): boolean {
  return !!rootId && getOfflineState().lockedRootIds.includes(rootId);
}

// ---------------------------------------------------------------------------------------------
// Resource helpers
// ---------------------------------------------------------------------------------------------

type ResourceIdentifier = { type: string; id: string };

function identifiersOf(relationship: any): ResourceIdentifier[] {
  const data = relationship?.data;
  if (!data) return [];
  return (Array.isArray(data) ? data : [data]).filter((item: any) => item && item.type && item.id);
}

function linkedIds(links: StoredLink[], id: string): ResourceIdentifier[] {
  return links.map((link) =>
    link.fromId === id ? { type: link.toType, id: link.toId } : { type: link.fromType, id: link.fromId },
  );
}

/** Every stored resource linked to one of `ids`, in either direction, without duplicates or the records themselves. */
/** The `{ type, id }` every relationship of a JSON:API resource points to. */
function relationshipTargets(resource: any): { type: string; id: string }[] {
  const targets: { type: string; id: string }[] = [];
  for (const relationship of Object.values<any>(resource?.relationships ?? {})) {
    const data = relationship?.data;
    for (const ref of Array.isArray(data) ? data : data ? [data] : []) {
      if (ref?.type && ref?.id) targets.push({ type: ref.type, id: ref.id });
    }
  }
  return targets;
}

/**
 * The `included` of a local answer: the stored records linked to `records` (the synced links),
 * then the stored records their relationships point to, and one level further the stored records
 * the relationships of those included records point to (an NPC's root record, then the root record's
 * owner), so a model reads the same nested relationships it reads from the server.
 *
 * Stored resources point at each other (a root record at its owner, the owner at the root record's
 * company, the company back at the owner); `RehydrationFactory` skips a resource met again inside
 * its own chain, so those circles never recurse.
 */
export async function includedFor(store: DeviceStore, records: StoredRecord[]): Promise<any[]> {
  // 0: the answer's own records; 1: what they link to; 2: what those link to.
  const level = new Map<string, number>(records.map((record) => [`${record.type}:${record.id}`, 0]));
  const included: { resource: any; level: number }[] = [];

  const add = async (target: { type: string; id: string }, atLevel: number): Promise<void> => {
    const key = `${target.type}:${target.id}`;
    if (level.has(key)) return;
    level.set(key, atLevel);
    const stored = await store.getRecord(target.type, target.id);
    const resource = stored?.resource ?? signedInUserResource(target);
    if (resource) included.push({ resource, level: atLevel });
  };

  for (const record of records) {
    const links = [...(await store.linksFrom(record.id)), ...(await store.linksTo(record.id))];
    for (const target of linkedIds(links, record.id)) await add(target, 1);
  }
  for (const record of records) {
    for (const target of relationshipTargets(record.resource)) await add(target, 1);
  }
  for (const entry of included.filter((candidate) => candidate.level === 1)) {
    for (const target of relationshipTargets(entry.resource)) await add(target, 2);
  }
  return included.map((entry) => entry.resource);
}

/**
 * The signed-in user as a resource, when `target` is that user. Users are not kept on the device,
 * but a relationship to the signed-in user (every downloaded root record's owner) must still resolve:
 * the app tells a GM from a player by comparing the root record's owner with the signed-in user. The
 * resource comes from the copy CurrentUserProvider keeps in localStorage, without relationships.
 */
function signedInUserResource(target: { type: string; id: string }): any | undefined {
  try {
    if (target.id !== getOfflineConfig().getUserId()) return undefined;
    const stored = JSON.parse(window.localStorage.getItem(CURRENT_USER_STORAGE_KEY) ?? "null");
    const user = stored?.jsonApi;
    if (user?.type !== target.type || user?.id !== target.id) return undefined;
    return { type: user.type, id: user.id, attributes: user.attributes ?? {}, meta: user.meta };
  } catch {
    return undefined;
  }
}

function attributeOf(record: StoredRecord, name: string): unknown {
  const value = record.resource?.attributes?.[name];
  if (value !== undefined && value !== null) return value;
  // The server value the sync keeps beside the resource.
  if (name === "updatedAt") return record.updatedAt ?? null;
  return value;
}

/** The server's default list order (`defineEntity` sets `defaultOrderBy: "updatedAt DESC"`). */
export const SERVER_DEFAULT_ORDER_BY = "updatedAt DESC";

/** The only `orderBy` the server accepts (`buildLegacyOrderByClause`): one property, optional ASC/DESC. */
const ORDER_BY = /^([A-Za-z_][A-Za-z0-9_]*)(?:\s+(ASC|DESC))?$/i;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T|$)/;

function comparable(value: unknown): unknown {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && ISO_DATE.test(value)) {
    const time = Date.parse(value);
    if (!Number.isNaN(time)) return time;
  }
  return value;
}

/** Cypher ORDER BY on one property, ascending: null sorts after every value. */
function compareAscending(left: unknown, right: unknown): number {
  const a = comparable(left);
  const b = comparable(right);
  const aNull = a === undefined || a === null;
  const bNull = b === undefined || b === null;
  if (aNull || bNull) return aNull === bNull ? 0 : aNull ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  const x = String(a);
  const y = String(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export type ListOptions = {
  /** The string attributes the server's fulltext index covers (default: every string attribute). */
  searchFields?: string[];
  /** The order with no `orderBy` (default `updatedAt DESC`, the server's). */
  defaultOrderBy?: string;
  /** `sort` fields ordered by rank: the index of the value in its tuple, a missing or unknown value after every rank. */
  sortRanks?: Record<string, readonly string[]>;
  /** The fields `sort` may name (default: any identifier); any other answers 400 "Invalid sort", as the server's `parseSort`. */
  sortFields?: readonly string[];
};

/**
 * `search` as the server runs it: the term is split into letter/digit tokens and a record
 * matches when every token appears, case-insensitive, inside one of its indexed string
 * attributes (the fulltext query `*token* AND ...`).
 */
export function searchRecords(
  records: StoredRecord[],
  query: URLSearchParams,
  options: ListOptions = {},
): StoredRecord[] {
  const term = query.get("search");
  if (term === null || term === undefined || term.trim() === "") return records;
  const tokens = term
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  if (tokens.length === 0) return records;

  return records.filter((record) => {
    const attributes = record.resource?.attributes ?? {};
    const fields = options.searchFields ?? Object.keys(attributes);
    const texts = fields
      .map((field) => attributes[field])
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.toLowerCase());
    return tokens.every((token) => texts.some((text) => text.includes(token)));
  });
}

/**
 * Orders records as the server's `ORDER BY` does for `orderBy` (`field` or `field ASC|DESC`),
 * or for the default order when there is none. `null` when the server would refuse the
 * `orderBy` (400).
 */
export function orderRecords(
  records: StoredRecord[],
  query: URLSearchParams,
  options: ListOptions = {},
): StoredRecord[] | null {
  const sort = query.get("sort");
  if (typeof sort === "string" && sort.trim() !== "") return sortRecords(records, sort, options);
  const requested = query.get("orderBy")?.trim();
  const value = requested || options.defaultOrderBy?.trim() || SERVER_DEFAULT_ORDER_BY;
  const match = ORDER_BY.exec(value);
  if (!match) return null;
  const field = match[1];
  const desc = match[2]?.toUpperCase() === "DESC";
  return [...records].sort((left, right) => {
    const order = compareAscending(attributeOf(left, field), attributeOf(right, field));
    return desc ? -order : order;
  });
}

/** A JSON:API `sort` key the server accepts: `-?<identifier>`. */
const SORT_KEY = /^(-?)([A-Za-z_][A-Za-z0-9_]*)$/;

/** Fields the server never compares as lowercased text (`caseInsensitiveSortKey`). */
const NEVER_TEXT_FIELDS: readonly string[] = ["id", "createdAt", "updatedAt"];

/** One `sort` key ascending, as the server's ORDER BY key for it compares. */
function compareSortKey(left: unknown, right: unknown, field: string, options: ListOptions): number {
  const ranks =
    options.sortRanks && Object.prototype.hasOwnProperty.call(options.sortRanks, field)
      ? options.sortRanks[field]
      : undefined;
  if (ranks) {
    const rank = (value: unknown) => {
      const index = typeof value === "string" ? ranks.indexOf(value) : -1;
      return index === -1 ? ranks.length : index;
    };
    return rank(left) - rank(right);
  }
  if (NEVER_TEXT_FIELDS.includes(field)) return compareAscending(left, right);
  const lower = (value: unknown) => (typeof value === "string" ? value.toLowerCase() : value);
  return compareAscending(lower(left), lower(right));
}

/**
 * Orders records as the server's list ORDER BY does for a JSON:API `sort` (`a,-b`): each key in
 * turn (a rank field by `sortRanks`, text lowercased, `-` descending), ties by `id` ascending.
 * `null` when the server would refuse the `sort` (400).
 */
function sortRecords(records: StoredRecord[], sort: string, options: ListOptions): StoredRecord[] | null {
  const keys: { field: string; desc: boolean }[] = [];
  for (const token of sort.split(",").map((key) => key.trim())) {
    const match = SORT_KEY.exec(token);
    if (!match) return null;
    const field = match[2];
    if (options.sortFields && !options.sortFields.includes(field)) return null;
    if (keys.some((key) => key.field === field)) return null;
    keys.push({ field, desc: match[1] === "-" });
  }
  return [...records].sort((left, right) => {
    for (const { field, desc } of keys) {
      const order = compareSortKey(attributeOf(left, field), attributeOf(right, field), field, options);
      if (order !== 0) return desc ? -order : order;
    }
    return compareAscending(left.id, right.id);
  });
}

function linkUrl(base: string, query: URLSearchParams, changes: Record<string, string | undefined>): string {
  const params = new URLSearchParams(query);
  for (const [key, value] of Object.entries(changes)) {
    if (value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const search = params.toString().replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/%2C/g, ",");
  return search ? `${base}?${search}` : base;
}

/**
 * One list answer for a set of stored records, as the server answers a list: `search`, then
 * `orderBy` (or the default order), then paged the way `JsonApiPaginator` pages (`fetchAll`,
 * `page[size]`, `page[offset]`), with `included`. App answers pass the records they selected.
 */
export async function listAnswer(
  ctx: LocalAnswerContext,
  records: StoredRecord[],
  options: ListOptions = {},
): Promise<OfflineAnswer> {
  const { request, store } = ctx;
  const base = request.url ? request.url.split("?")[0] : request.path;
  const sorted = orderRecords(searchRecords(records, request.query, options), request.query, options);
  if (!sorted) {
    const sort = request.query.get("sort");
    return errorAnswer(400, "Bad Request", sort?.trim() ? "Invalid sort" : "Invalid orderBy");
  }

  if (request.query.get("fetchAll") === "true") {
    return {
      status: 200,
      body: {
        data: sorted.map((record) => record.resource),
        included: await includedFor(store, sorted),
        links: { self: linkUrl(base, request.query, {}) },
        meta: { total: sorted.length },
      },
    };
  }

  const size = Number(request.query.get("page[size]")) || DEFAULT_PAGE_SIZE;
  const offset = Number(request.query.get("page[offset]")) || 0;
  const page = sorted.slice(offset, offset + size);

  const links: Record<string, string> = {
    self: linkUrl(base, request.query, { "page[size]": String(size), "page[offset]": undefined }),
  };
  if (offset + size < sorted.length) {
    links.next = linkUrl(base, request.query, { "page[size]": String(size), "page[offset]": String(offset + size) });
  }
  if (offset > 0) {
    links.prev = linkUrl(base, request.query, {
      "page[size]": String(size),
      "page[offset]": String(Math.max(0, offset - size)),
    });
    // The server names it `previous`; the client reads `prev`.
    links.previous = links.prev;
  }

  return {
    status: 200,
    body: {
      data: page.map((record) => record.resource),
      included: await includedFor(store, page),
      links,
      meta: { total: sorted.length },
    },
  };
}

/**
 * A list document of stored records in the order the caller settled, every record in one page,
 * with `included`: for an app's custom list query that has its own `ORDER BY` and no paging.
 */
export async function orderedListAnswer(store: DeviceStore, records: StoredRecord[]): Promise<OfflineAnswer> {
  return {
    status: 200,
    body: {
      data: records.map((record) => record.resource),
      included: await includedFor(store, records),
      meta: { total: records.length },
    },
  };
}

/**
 * A list document of resources the device computed rather than stored (a query-result
 * projection such as a search hit, built by its model), answered as they are, nothing included.
 */
export function resourceListAnswer(resources: any[]): OfflineAnswer {
  return { status: 200, body: { data: resources, included: [] } };
}

function listOptionsOf(typeConfig: OfflineTypeConfig): ListOptions {
  return {
    searchFields: typeConfig.searchFields,
    defaultOrderBy: typeConfig.defaultOrderBy,
    sortRanks: typeConfig.sortRanks,
    sortFields: typeConfig.sortFields,
  };
}

// ---------------------------------------------------------------------------------------------
// Link kinds
// ---------------------------------------------------------------------------------------------

/**
 * The kind a link written on the device carries for relationship `name`: the Neo4j type the
 * type config maps it to (the kind synced links carry), otherwise the name itself.
 */
export function linkKindFor(typeConfig: OfflineTypeConfig | undefined, name: string): string {
  return typeConfig?.relationshipKinds?.[name] ?? name;
}

/**
 * Every kind a link of relationship `name` may carry on the device: the name (written on the
 * device before a mapping existed) and the mapped Neo4j type (synced). `undefined` when the
 * Neo4j type is not known: then a link of any kind may be the one.
 */
export function linkKindsOf(typeConfig: OfflineTypeConfig | undefined, name: string): string[] | undefined {
  const mapped = typeConfig?.relationshipKinds?.[name];
  return mapped ? [name, mapped] : undefined;
}

/**
 * The stored links of `id` whose kind is one of `kinds` (Neo4j types and/or relationship
 * names). `out`: links from `id`; `in`: links to `id`; `both`: either.
 */
export async function linksOfKind(
  store: DeviceStore,
  id: string,
  kinds: string[],
  direction: "out" | "in" | "both" = "both",
): Promise<StoredLink[]> {
  const result: StoredLink[] = [];
  const seen = new Set<string>();
  for (const kind of new Set(kinds)) {
    const links = [
      ...(direction !== "in" ? await store.linksFrom(id, kind) : []),
      ...(direction !== "out" ? await store.linksTo(id, kind) : []),
    ];
    for (const link of links) {
      const key = `${link.fromId}|${link.toId}|${link.kind}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(link);
    }
  }
  return result;
}

function typeConfigOf(config: OfflineConfig, type: string): OfflineTypeConfig | undefined {
  return config.types.find((typeConfig) => typeConfig.module.name === type);
}

/** The relationship names of `resource` that point to a record of `type`. */
function relationshipNamesToward(resource: any, type: string): string[] {
  return Object.entries<any>(resource?.relationships ?? {})
    .filter(([, relationship]) => identifiersOf(relationship).some((identifier) => identifier.type === type))
    .map(([name]) => name);
}

// ---------------------------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------------------------

/** A record that is not on the device: only the server can answer for it. */
function notOnDeviceAnswer(type: string, id: string): OfflineAnswer {
  return needsConnectionAnswer(`${type} ${id} is not on this device`);
}

async function getOne(ctx: LocalAnswerContext, type: string): Promise<OfflineAnswer> {
  const record = await ctx.store.getRecord(type, ctx.params.id);
  if (!record) return notOnDeviceAnswer(type, ctx.params.id);
  return singleAnswer(ctx.store, record);
}

async function rootList(
  ctx: LocalAnswerContext,
  kind: OfflineRootKind,
  typeConfig: OfflineTypeConfig,
): Promise<OfflineAnswer> {
  const rootType = kind.module.name;
  const rootId = ctx.params.rootId;
  if (!(await ctx.store.getRecord(rootType, rootId))) return notOnDeviceAnswer(rootType, rootId);
  const records = await ctx.store.listRecords({ type: typeConfig.module.name, rootId });
  return listAnswer(ctx, records, listOptionsOf(typeConfig));
}

/**
 * `GET <parent>/:parentId/<type>`: the stored records of `type` linked to the parent by the
 * relationship between the two types. That relationship is the one whose name, on either
 * record, points to the other type; its links are matched by name and by mapped Neo4j type.
 * When its Neo4j type is not known, links of any kind count.
 */
async function relatedList(
  ctx: LocalAnswerContext,
  config: OfflineConfig,
  typeConfig: OfflineTypeConfig,
): Promise<OfflineAnswer> {
  const type = typeConfig.module.name;
  const { parentType, parentId } = ctx.params;
  const parent = await ctx.store.getRecord(parentType, parentId);
  if (!parent) return notOnDeviceAnswer(parentType, parentId);

  const links = [...(await ctx.store.linksFrom(parentId)), ...(await ctx.store.linksTo(parentId))].filter((link) =>
    link.fromId === parentId ? link.toType === type : link.fromType === type,
  );
  const candidates = await ctx.store.listRecords({
    type,
    ids: [...new Set(links.map((link) => (link.fromId === parentId ? link.toId : link.fromId)))],
  });

  const kinds = new Set<string>();
  let anyKind = false;
  const collect = (owner: OfflineTypeConfig | undefined, names: string[]) => {
    for (const name of names) {
      const known = linkKindsOf(owner, name);
      if (known) known.forEach((kind) => kinds.add(kind));
      else anyKind = true;
    }
  };
  collect(typeConfig, [
    ...new Set(candidates.flatMap((record) => relationshipNamesToward(record.resource, parentType))),
  ]);
  collect(typeConfigOf(config, parentType), relationshipNamesToward(parent.resource, type));

  const accepted = anyKind || kinds.size === 0 ? links : links.filter((link) => kinds.has(link.kind));
  const ids = new Set(accepted.map((link) => (link.fromId === parentId ? link.toId : link.fromId)));
  return listAnswer(
    ctx,
    candidates.filter((record) => ids.has(record.id)),
    listOptionsOf(typeConfig),
  );
}

// ---------------------------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------------------------

/**
 * The root record a record belongs to: itself (the type of any root kind), a relationship to a
 * root of any kind, or a related stored record.
 */
export async function rootIdForResource(
  store: DeviceStore,
  config: OfflineConfig,
  resource: any,
): Promise<string | undefined> {
  const rootTypes = new Set(rootKinds(config).map((kind) => kind.module.name));
  if (rootTypes.has(resource?.type) && resource.id) return resource.id;

  const identifiers = Object.values(resource?.relationships ?? {}).flatMap(identifiersOf);
  const root = identifiers.find((identifier) => rootTypes.has(identifier.type));
  if (root) return root.id;

  for (const identifier of identifiers) {
    const stored = await store.getRecord(identifier.type, identifier.id);
    if (stored?.rootId) return stored.rootId;
  }
  return undefined;
}

async function linkRelationships(
  store: DeviceStore,
  typeConfig: OfflineTypeConfig | undefined,
  record: { type: string; id: string },
  before: Record<string, any>,
  after: Record<string, any>,
): Promise<void> {
  for (const [name, relationship] of Object.entries(after)) {
    const previous = new Map(identifiersOf(before[name]).map((identifier) => [identifier.id, identifier]));
    const next = new Map(identifiersOf(relationship).map((identifier) => [identifier.id, identifier]));
    const kinds = linkKindsOf(typeConfig, name);

    for (const [id] of previous) {
      if (next.has(id)) continue;
      // Only the links of this relationship (by name or Neo4j type); any kind when it is not known.
      const links = kinds
        ? await linksOfKind(store, record.id, kinds, "both")
        : [...(await store.linksFrom(record.id)), ...(await store.linksTo(record.id))];
      for (const link of links) {
        if (link.fromId === id || link.toId === id) {
          await store.deleteLink({ fromId: link.fromId, toId: link.toId, kind: link.kind });
        }
      }
    }
    for (const [id, identifier] of next) {
      if (previous.has(id)) continue;
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

/** The `data` of a JSON:API document a model built (`createJsonApi()` or a dedicated method). */
export type ResourceDocumentData = {
  attributes?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

/**
 * The resource a create document stands for, under `identity`: the document's attributes,
 * relationships and meta, as the device stores a record it creates.
 */
export function resourceFromDocument(document: any, identity: { type: string; id: string }): any {
  const data: ResourceDocumentData = document?.data ?? {};
  const resource: any = { type: identity.type, id: identity.id };
  if (data.attributes) resource.attributes = { ...data.attributes };
  if (data.relationships) resource.relationships = { ...data.relationships };
  if (data.meta) resource.meta = { ...data.meta };
  return resource;
}

/**
 * A stored resource with a document's `data` written over it: attributes and relationships merged
 * by name, and meta merged when the document carries one, as the device applies an edit.
 */
export function mergeResource(before: any, identity: { type: string; id: string }, data: ResourceDocumentData): any {
  const previous = before ?? identity;
  const resource: any = {
    ...previous,
    type: identity.type,
    id: identity.id,
    attributes: { ...(previous.attributes ?? {}), ...(data?.attributes ?? {}) },
    relationships: { ...(previous.relationships ?? {}), ...(data?.relationships ?? {}) },
  };
  if (data?.meta) resource.meta = { ...(previous.meta ?? {}), ...data.meta };
  return resource;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function create(ctx: LocalAnswerContext, config: OfflineConfig, type: string): Promise<OfflineAnswer> {
  const typeConfig = typeConfigOf(config, type);
  const id: string = ctx.request.body?.data?.id ?? newId();
  const resource = resourceFromDocument(ctx.request.body, { type, id });
  const rootId = await rootIdForResource(ctx.store, config, resource);
  if (!rootId) return needsConnectionAnswer(`A new ${type} that belongs to no root record needs a connection`);
  if (isRootWriteLocked(rootId)) return needsConnectionAnswer("The root record is locked");

  const record: StoredRecord = { type, id, rootId, resource, updatedAt: null, base: null, localOnly: true };
  await ctx.store.transaction(async (store) => {
    await store.putRecord(record);
    await linkRelationships(store, typeConfig, { type, id }, {}, resource.relationships ?? {});
    await store.enqueue({
      rootId,
      method: ctx.request.method,
      path: queuePath(ctx),
      body: ctx.request.body,
      base: null,
    });
    // The type's hook, inside the write's transaction: a throw rolls the write and the enqueue back.
    if (typeConfig?.afterLocalWrite) {
      await typeConfig.afterLocalWrite({
        store,
        module: typeConfig.module,
        id,
        method: "POST",
        resource,
        previous: null,
      });
    }
  });

  return singleAnswer(ctx.store, record, 201);
}

async function update(ctx: LocalAnswerContext, config: OfflineConfig, type: string): Promise<OfflineAnswer> {
  const id = ctx.params.id;
  const existing = await ctx.store.getRecord(type, id);
  if (!existing) return notOnDeviceAnswer(type, id);
  if (isRootWriteLocked(existing.rootId)) return needsConnectionAnswer("The root record is locked");

  const data = ctx.request.body?.data ?? {};
  const before = existing.resource ?? { type, id };
  const resource = mergeResource(before, { type, id }, data);
  // A record created on this device has no server version to merge against.
  const base = existing.localOnly ? null : (existing.base ?? before);

  const typeConfig = typeConfigOf(config, type);
  const method = ctx.request.method === "PATCH" ? "PATCH" : "PUT";
  const record: StoredRecord = { ...existing, resource, base, localOnly: existing.localOnly };
  await ctx.store.transaction(async (store) => {
    await store.putRecord(record);
    await linkRelationships(store, typeConfig, { type, id }, before.relationships ?? {}, data.relationships ?? {});
    await store.enqueue({
      rootId: existing.rootId,
      method: ctx.request.method,
      path: queuePath(ctx),
      body: ctx.request.body,
      recordType: type,
      recordId: id,
      base,
    });
    if (typeConfig?.afterLocalWrite) {
      await typeConfig.afterLocalWrite({ store, module: typeConfig.module, id, method, resource, previous: before });
    }
  });

  return singleAnswer(ctx.store, record);
}

async function remove(ctx: LocalAnswerContext, config: OfflineConfig, type: string): Promise<OfflineAnswer> {
  const id = ctx.params.id;
  const existing = await ctx.store.getRecord(type, id);
  if (!existing) return notOnDeviceAnswer(type, id);
  if (isRootWriteLocked(existing.rootId)) return needsConnectionAnswer("The root record is locked");

  const base = existing.localOnly ? null : (existing.base ?? existing.resource);

  await ctx.store.transaction(async (store) => {
    const links = [...(await store.linksFrom(id)), ...(await store.linksTo(id))];
    for (const link of links) await store.deleteLink({ fromId: link.fromId, toId: link.toId, kind: link.kind });
    await store.deleteRecord(type, id);
    await store.enqueue({
      rootId: existing.rootId,
      method: "DELETE",
      path: queuePath(ctx),
      recordType: type,
      recordId: id,
      base,
    });
    const typeConfig = typeConfigOf(config, type);
    if (typeConfig?.afterLocalWrite) {
      await typeConfig.afterLocalWrite({
        store,
        module: typeConfig.module,
        id,
        method: "DELETE",
        resource: null,
        previous: existing.resource,
      });
    }
  });

  return { status: 204, body: undefined };
}

/** The request path as `EndpointCreator` built it, query string included. */
export function queuePath(ctx: Pick<LocalAnswerContext, "request">): string {
  const query = ctx.request.query.toString();
  return query ? `${ctx.request.path}?${query}` : ctx.request.path;
}

// ---------------------------------------------------------------------------------------------
// The generic route list
// ---------------------------------------------------------------------------------------------

function readOnlyGuard(typeConfig: OfflineTypeConfig, answer: (ctx: LocalAnswerContext) => Promise<OfflineAnswer>) {
  return async (ctx: LocalAnswerContext): Promise<OfflineAnswer> =>
    typeConfig.readOnly ? needsConnectionAnswer(`${typeConfig.module.name} is read-only offline`) : answer(ctx);
}

/**
 * One set of routes per configured type, in matching order: the root record list before the
 * related list (both are `x/:id/<type>`), the related list last. These generic routes are not
 * queued by the layer: each write answer queues itself, with its base.
 */
export function buildGenericRoutes(config: OfflineConfig): OfflineRoute[] {
  const routes: OfflineRoute[] = [];
  const route = (method: OfflineMethod, pattern: OfflineRoute["pattern"], answer: OfflineRoute["answer"]) =>
    routes.push({ method, pattern, answer, queue: false });

  for (const typeConfig of config.types) {
    const type = typeConfig.module.name;
    route("GET", [typeConfig.module, ":id"], (ctx) => getOne(ctx, type));
    for (const kind of rootKinds(config)) {
      route("GET", [kind.module, ":rootId", typeConfig.module], (ctx) => rootList(ctx, kind, typeConfig));
    }
    route(
      "POST",
      [typeConfig.module],
      readOnlyGuard(typeConfig, (ctx) => create(ctx, config, type)),
    );
    route(
      "PUT",
      [typeConfig.module, ":id"],
      readOnlyGuard(typeConfig, (ctx) => update(ctx, config, type)),
    );
    route(
      "PATCH",
      [typeConfig.module, ":id"],
      readOnlyGuard(typeConfig, (ctx) => update(ctx, config, type)),
    );
    route(
      "DELETE",
      [typeConfig.module, ":id"],
      readOnlyGuard(typeConfig, (ctx) => remove(ctx, config, type)),
    );
  }
  for (const typeConfig of config.types) {
    route("GET", [":parentType", ":parentId", typeConfig.module], (ctx) => relatedList(ctx, config, typeConfig));
  }

  return routes;
}
