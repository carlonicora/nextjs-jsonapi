import type {
  Conflict,
  DeviceStore,
  QueueEntry,
  QueueStatus,
  SkippedRecord,
  StoredLink,
  StoredRecord,
  SyncState,
} from "./DeviceStore";
import { DEVICE_STORE_RESET, DEVICE_STORE_SCHEMA, DEVICE_STORE_SCHEMA_VERSION } from "./schema";

/** Runs one SQL statement with positional `?` binds and answers its rows as objects. */
export type ExecFn = (sql: string, bind?: unknown[]) => Promise<Record<string, unknown>[]>;

export type SqlDeviceStoreHooks = {
  /** Runs before a queue entry is written (the lifecycle marks the file as holding unsent changes). */
  beforeEnqueue?: () => Promise<void>;
  /** Runs after a committed change that can shrink the queue, with the number of entries left. */
  afterQueueChange?: (entries: number) => Promise<void>;
  /**
   * Runs each operation with exclusive use of the database across pages (the shared device copy:
   * several pages send statements to one database, and a transaction must not interleave).
   */
  exclusive?: <T>(fn: () => Promise<T>) => Promise<T>;
};

const toJson = (value: unknown): string | null =>
  value === undefined || value === null ? null : JSON.stringify(value);
const fromJson = (value: unknown): any => (value === null || value === undefined ? null : JSON.parse(String(value)));
const toIso = (value: Date | null | undefined): string | null => (value ? value.toISOString() : null);
const fromIso = (value: unknown): Date | null =>
  value === null || value === undefined ? null : new Date(String(value));

const newId = (): string =>
  typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

const rowToRecord = (row: Record<string, unknown>): StoredRecord => ({
  type: String(row.type),
  id: String(row.id),
  rootId: String(row.root_id),
  resource: fromJson(row.resource),
  updatedAt: fromIso(row.updated_at),
  base: fromJson(row.base),
  localOnly: Number(row.local_only) === 1,
});

const rowToLink = (row: Record<string, unknown>): StoredLink => ({
  fromType: String(row.from_type),
  fromId: String(row.from_id),
  toType: String(row.to_type),
  toId: String(row.to_id),
  kind: String(row.kind),
  props: fromJson(row.props) ?? {},
});

const rowToQueueEntry = (row: Record<string, unknown>): QueueEntry => {
  const request = fromJson(row.request) ?? {};
  const entry: QueueEntry = {
    seq: Number(row.seq),
    rootId: String(row.root_id),
    method: request.method,
    path: request.path,
    base: fromJson(row.base),
    createdAt: new Date(String(row.created_at)),
    status: String(row.status) as QueueStatus,
  };
  if (request.body !== undefined) entry.body = request.body;
  if (request.recordType !== undefined) entry.recordType = request.recordType;
  if (request.recordId !== undefined) entry.recordId = request.recordId;
  if (request.resolution !== undefined) entry.resolution = request.resolution;
  if (row.package_id !== null && row.package_id !== undefined) entry.packageId = String(row.package_id);
  return entry;
};

const rowToConflict = (row: Record<string, unknown>): Conflict => {
  const conflict: Conflict = {
    id: String(row.id),
    queueSeq: Number(row.queue_seq),
    kind: String(row.kind) as Conflict["kind"],
    mine: fromJson(row.mine),
    theirs: fromJson(row.theirs),
    base: fromJson(row.base),
    fields: fromJson(row.fields) ?? [],
  };
  if (row.record_type !== null && row.record_type !== undefined) conflict.recordType = String(row.record_type);
  if (row.record_id !== null && row.record_id !== undefined) conflict.recordId = String(row.record_id);
  const merged = fromJson(row.merged);
  if (merged !== null) conflict.merged = merged;
  const blocks = fromJson(row.blocks);
  if (blocks !== null) conflict.blocks = blocks;
  if (row.reason !== null && row.reason !== undefined) conflict.reason = String(row.reason);
  return conflict;
};

/** The statements of every store operation, run over an exec that is already serialised. */
const createOperations = (exec: ExecFn, hooks: SqlDeviceStoreHooks) => {
  const insertLink = async (link: StoredLink, rootId: string | null) => {
    await exec(
      `INSERT OR REPLACE INTO links (from_id, from_type, to_id, to_type, kind, props, root_id) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [link.fromId, link.fromType, link.toId, link.toType, link.kind, JSON.stringify(link.props ?? {}), rootId],
    );
  };

  const deleteRecordEverywhere = async (type: string, id: string) => {
    await exec(`DELETE FROM records WHERE type = ? AND id = ?`, [type, id]);
    await exec(`DELETE FROM record_roots WHERE type = ? AND id = ?`, [type, id]);
    await exec(`DELETE FROM links WHERE from_id = ? OR to_id = ?`, [id, id]);
  };

  return {
    async getRecord(type: string, id: string): Promise<StoredRecord | undefined> {
      const rows = await exec(`SELECT * FROM records WHERE type = ? AND id = ?`, [type, id]);
      return rows[0] ? rowToRecord(rows[0]) : undefined;
    },

    async listRecords(filter: { type: string; rootId?: string; ids?: string[] }): Promise<StoredRecord[]> {
      if (filter.ids && filter.ids.length === 0) return [];
      const where = ["type = ?"];
      const bind: unknown[] = [filter.type];
      if (filter.rootId !== undefined) {
        where.push(
          "EXISTS (SELECT 1 FROM record_roots rc WHERE rc.type = records.type AND rc.id = records.id AND rc.root_id = ?)",
        );
        bind.push(filter.rootId);
      }
      if (filter.ids) {
        where.push(`id IN (${filter.ids.map(() => "?").join(", ")})`);
        bind.push(...filter.ids);
      }
      const rows = await exec(`SELECT * FROM records WHERE ${where.join(" AND ")} ORDER BY rowid`, bind);
      return rows.map(rowToRecord);
    },

    async putRecord(
      record: Omit<StoredRecord, "base" | "localOnly"> & { base?: any | null; localOnly?: boolean },
    ): Promise<void> {
      // A record already stored keeps its first root record; the new one is added to its memberships.
      await exec(
        `INSERT INTO records (type, id, root_id, resource, updated_at, base, local_only) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (type, id) DO UPDATE SET resource = excluded.resource, updated_at = excluded.updated_at,
           base = excluded.base, local_only = excluded.local_only`,
        [
          record.type,
          record.id,
          record.rootId,
          JSON.stringify(record.resource),
          toIso(record.updatedAt),
          toJson(record.base),
          record.localOnly ? 1 : 0,
        ],
      );
      await exec(`INSERT OR IGNORE INTO record_roots (type, id, root_id) VALUES (?, ?, ?)`, [
        record.type,
        record.id,
        record.rootId,
      ]);
    },

    async deleteRecord(type: string, id: string): Promise<void> {
      await deleteRecordEverywhere(type, id);
    },

    async removeRecordFromRoot(type: string, id: string, rootId: string): Promise<void> {
      await exec(`DELETE FROM record_roots WHERE type = ? AND id = ? AND root_id = ?`, [type, id, rootId]);
      const left = await exec(`SELECT root_id FROM record_roots WHERE type = ? AND id = ? ORDER BY root_id`, [
        type,
        id,
      ]);
      if (left.length === 0) {
        await deleteRecordEverywhere(type, id);
        return;
      }
      await exec(`UPDATE records SET root_id = ? WHERE type = ? AND id = ? AND root_id = ?`, [
        String(left[0].root_id),
        type,
        id,
        rootId,
      ]);
    },

    async linksFrom(fromId: string, kind?: string): Promise<StoredLink[]> {
      const rows =
        kind === undefined
          ? await exec(`SELECT * FROM links WHERE from_id = ? ORDER BY rowid`, [fromId])
          : await exec(`SELECT * FROM links WHERE from_id = ? AND kind = ? ORDER BY rowid`, [fromId, kind]);
      return rows.map(rowToLink);
    },

    async linksTo(toId: string, kind?: string): Promise<StoredLink[]> {
      const rows =
        kind === undefined
          ? await exec(`SELECT * FROM links WHERE to_id = ? ORDER BY rowid`, [toId])
          : await exec(`SELECT * FROM links WHERE to_id = ? AND kind = ? ORDER BY rowid`, [toId, kind]);
      return rows.map(rowToLink);
    },

    async replaceRootLinks(rootId: string, links: StoredLink[]): Promise<void> {
      await exec(`DELETE FROM links WHERE root_id = ?`, [rootId]);
      for (const link of links) await insertLink(link, rootId);
    },

    async putLink(link: StoredLink): Promise<void> {
      // A link belongs to the root record of the record at either end, so a later
      // replaceRootLinks / removeRoot of that root record reaches it.
      const owner = await exec(`SELECT root_id FROM records WHERE id IN (?, ?) ORDER BY id = ? DESC LIMIT 1`, [
        link.fromId,
        link.toId,
        link.fromId,
      ]);
      await insertLink(link, owner[0] ? String(owner[0].root_id) : null);
    },

    async deleteLink(link: Pick<StoredLink, "fromId" | "toId" | "kind">): Promise<void> {
      await exec(`DELETE FROM links WHERE from_id = ? AND to_id = ? AND kind = ?`, [link.fromId, link.toId, link.kind]);
    },

    async enqueue(entry: Omit<QueueEntry, "seq" | "createdAt" | "status">): Promise<number> {
      if (hooks.beforeEnqueue) await hooks.beforeEnqueue();
      const request = {
        method: entry.method,
        path: entry.path,
        body: entry.body,
        recordType: entry.recordType,
        recordId: entry.recordId,
        resolution: entry.resolution,
      };
      const rows = await exec(
        `INSERT INTO queue (root_id, request, base, created_at, status) VALUES (?, ?, ?, ?, 'pending') RETURNING seq`,
        [entry.rootId, JSON.stringify(request), toJson(entry.base), new Date().toISOString()],
      );
      return Number(rows[0].seq);
    },

    async queue(filter?: { status?: QueueStatus }): Promise<QueueEntry[]> {
      const rows = filter?.status
        ? await exec(`SELECT * FROM queue WHERE status = ? ORDER BY seq`, [filter.status])
        : await exec(`SELECT * FROM queue ORDER BY seq`);
      return rows.map(rowToQueueEntry);
    },

    async setQueueStatus(seq: number, status: QueueStatus): Promise<void> {
      await exec(`UPDATE queue SET status = ? WHERE seq = ?`, [status, seq]);
    },

    async setQueuePackage(seqs: number[], packageId: string | null): Promise<void> {
      if (seqs.length === 0) return;
      await exec(`UPDATE queue SET package_id = ? WHERE seq IN (${seqs.map(() => "?").join(", ")})`, [
        packageId,
        ...seqs,
      ]);
    },

    async removeQueueEntry(seq: number): Promise<void> {
      await exec(`DELETE FROM queue WHERE seq = ?`, [seq]);
    },

    async addConflict(c: Omit<Conflict, "id">): Promise<string> {
      const id = newId();
      const owner = await exec(`SELECT root_id FROM queue WHERE seq = ?`, [c.queueSeq]);
      await exec(
        `INSERT INTO conflicts (id, queue_seq, root_id, kind, record_type, record_id, mine, theirs, base, merged, fields, blocks, reason)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          c.queueSeq,
          owner[0] ? String(owner[0].root_id) : null,
          c.kind,
          c.recordType ?? null,
          c.recordId ?? null,
          toJson(c.mine),
          toJson(c.theirs),
          toJson(c.base),
          toJson(c.merged),
          JSON.stringify(c.fields ?? []),
          toJson(c.blocks),
          c.reason ?? null,
        ],
      );
      return id;
    },

    async conflicts(): Promise<Conflict[]> {
      const rows = await exec(`SELECT * FROM conflicts ORDER BY queue_seq, rowid`);
      return rows.map(rowToConflict);
    },

    async removeConflict(id: string): Promise<void> {
      await exec(`DELETE FROM conflicts WHERE id = ?`, [id]);
    },

    async getSyncState(rootId: string): Promise<SyncState> {
      const rows = await exec(`SELECT * FROM sync_state WHERE root_id = ?`, [rootId]);
      if (!rows[0]) return { serverTime: null, locked: false, lockedFrom: null };
      return {
        serverTime: fromIso(rows[0].server_time),
        locked: Number(rows[0].locked) === 1,
        lockedFrom: fromIso(rows[0].locked_from),
      };
    },

    async setSyncState(rootId: string, s: SyncState): Promise<void> {
      await exec(`INSERT OR REPLACE INTO sync_state (root_id, server_time, locked, locked_from) VALUES (?, ?, ?, ?)`, [
        rootId,
        toIso(s.serverTime),
        s.locked ? 1 : 0,
        toIso(s.lockedFrom),
      ]);
    },

    async skippedRecords(rootId: string): Promise<SkippedRecord[]> {
      const rows = await exec(`SELECT * FROM skipped_records WHERE root_id = ? ORDER BY type, id`, [rootId]);
      return rows.map((row) => ({
        type: String(row.type),
        id: String(row.id),
        updatedAt: new Date(String(row.updated_at)),
      }));
    },

    async setSkippedRecords(rootId: string, records: SkippedRecord[]): Promise<void> {
      await exec(`DELETE FROM skipped_records WHERE root_id = ?`, [rootId]);
      for (const record of records) {
        await exec(`INSERT OR REPLACE INTO skipped_records (root_id, type, id, updated_at) VALUES (?, ?, ?, ?)`, [
          rootId,
          record.type,
          record.id,
          record.updatedAt.toISOString(),
        ]);
      }
    },

    async removeRoot(rootId: string): Promise<void> {
      // Waiting changes are never dropped: a root record with queue entries is kept whole.
      const waiting = await exec(`SELECT COUNT(*) AS n FROM queue WHERE root_id = ?`, [rootId]);
      if (Number(waiting[0]?.n ?? 0) > 0) return;
      // A shared record another root record still uses stays for that root record; every other
      // record of this root record goes, with its links.
      await exec(`DELETE FROM links WHERE root_id = ?`, [rootId]);
      await exec(`DELETE FROM record_roots WHERE root_id = ?`, [rootId]);
      const orphans = `SELECT id FROM records r WHERE NOT EXISTS (SELECT 1 FROM record_roots rc WHERE rc.type = r.type AND rc.id = r.id)`;
      await exec(`DELETE FROM links WHERE from_id IN (${orphans}) OR to_id IN (${orphans})`);
      await exec(
        `DELETE FROM records WHERE NOT EXISTS (SELECT 1 FROM record_roots rc WHERE rc.type = records.type AND rc.id = records.id)`,
      );
      await exec(
        `UPDATE records SET root_id = (SELECT MIN(rc.root_id) FROM record_roots rc WHERE rc.type = records.type AND rc.id = records.id) WHERE root_id = ?`,
        [rootId],
      );
      await exec(`DELETE FROM conflicts WHERE root_id = ?`, [rootId]);
      await exec(`DELETE FROM sync_state WHERE root_id = ?`, [rootId]);
      await exec(`DELETE FROM skipped_records WHERE root_id = ?`, [rootId]);
    },

    async queueSize(): Promise<number> {
      const rows = await exec(`SELECT COUNT(*) AS n FROM queue`);
      return Number(rows[0]?.n ?? 0);
    },
  };
};

type Operations = ReturnType<typeof createOperations>;

/** A store whose `transaction` runs `fn` directly: used inside an open transaction. */
const nestedStore = (ops: Operations): DeviceStore => {
  const { queueSize: _queueSize, ...rest } = ops;
  const store: DeviceStore = { ...rest, transaction: (fn) => fn(store) };
  return store;
};

/**
 * The device store over any SQLite `exec` (the worker's OPFS file, or an
 * in-memory database in tests). Every operation is serialised, so a
 * transaction never interleaves with another caller's statements.
 */
export async function createSqlDeviceStore(exec: ExecFn, hooks: SqlDeviceStoreHooks = {}): Promise<DeviceStore> {
  const exclusive = hooks.exclusive ?? (<T>(fn: () => Promise<T>) => fn());

  // A file of an older layout is recreated (pre-release: no migration of device files).
  await exclusive(async () => {
    const version = Number((await exec(`PRAGMA user_version`))[0]?.user_version ?? 0);
    if (version > 0 && version < DEVICE_STORE_SCHEMA_VERSION) {
      for (const statement of DEVICE_STORE_RESET) await exec(statement);
    }
    for (const statement of DEVICE_STORE_SCHEMA) await exec(statement);
  });

  const ops = createOperations(exec, hooks);
  let tail: Promise<unknown> = Promise.resolve();
  const serialised = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(
      () => exclusive(fn),
      () => exclusive(fn),
    );
    tail = run.catch(() => undefined);
    return run;
  };
  const settleQueue = async () => {
    if (hooks.afterQueueChange) await hooks.afterQueueChange(await ops.queueSize());
  };

  const store: DeviceStore = {
    getRecord: (type, id) => serialised(() => ops.getRecord(type, id)),
    listRecords: (filter) => serialised(() => ops.listRecords(filter)),
    putRecord: (record) => serialised(() => ops.putRecord(record)),
    deleteRecord: (type, id) => serialised(() => ops.deleteRecord(type, id)),
    removeRecordFromRoot: (type, id, rootId) => serialised(() => ops.removeRecordFromRoot(type, id, rootId)),
    linksFrom: (fromId, kind) => serialised(() => ops.linksFrom(fromId, kind)),
    linksTo: (toId, kind) => serialised(() => ops.linksTo(toId, kind)),
    replaceRootLinks: (rootId, links) =>
      serialised(async () => {
        await exec("BEGIN");
        try {
          await ops.replaceRootLinks(rootId, links);
          await exec("COMMIT");
        } catch (error) {
          await exec("ROLLBACK");
          throw error;
        }
      }),
    putLink: (link) => serialised(() => ops.putLink(link)),
    deleteLink: (link) => serialised(() => ops.deleteLink(link)),
    enqueue: (entry) => serialised(() => ops.enqueue(entry)),
    queue: (filter) => serialised(() => ops.queue(filter)),
    setQueueStatus: (seq, status) => serialised(() => ops.setQueueStatus(seq, status)),
    setQueuePackage: (seqs, packageId) => serialised(() => ops.setQueuePackage(seqs, packageId)),
    removeQueueEntry: (seq) =>
      serialised(async () => {
        await ops.removeQueueEntry(seq);
        await settleQueue();
      }),
    addConflict: (c) => serialised(() => ops.addConflict(c)),
    conflicts: () => serialised(() => ops.conflicts()),
    removeConflict: (id) => serialised(() => ops.removeConflict(id)),
    getSyncState: (rootId) => serialised(() => ops.getSyncState(rootId)),
    setSyncState: (rootId, s) => serialised(() => ops.setSyncState(rootId, s)),
    skippedRecords: (rootId) => serialised(() => ops.skippedRecords(rootId)),
    setSkippedRecords: (rootId, records) => serialised(() => ops.setSkippedRecords(rootId, records)),
    removeRoot: (rootId) =>
      serialised(async () => {
        await exec("BEGIN");
        try {
          await ops.removeRoot(rootId);
          await exec("COMMIT");
        } catch (error) {
          await exec("ROLLBACK");
          throw error;
        }
        await settleQueue();
      }),
    transaction: <T>(fn: (tx: DeviceStore) => Promise<T>) =>
      serialised(async () => {
        await exec("BEGIN");
        let result: T;
        try {
          result = await fn(nestedStore(ops));
          await exec("COMMIT");
        } catch (error) {
          await exec("ROLLBACK");
          await settleQueue();
          throw error;
        }
        await settleQueue();
        return result;
      }),
  };
  return store;
}
