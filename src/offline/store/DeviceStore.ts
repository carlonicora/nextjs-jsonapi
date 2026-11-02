import type { OfflineChangeResolution } from "../sync/models/OfflineChangeSetInterface";
import type { OfflineMethod } from "../types";

export type StoredRecord = {
  type: string;
  id: string;
  rootId: string;
  resource: any;
  updatedAt: Date | null;
  base: any | null;
  localOnly: boolean;
};

export type StoredLink = {
  fromType: string;
  fromId: string;
  toType: string;
  toId: string;
  kind: string;
  props: Record<string, unknown>;
};

export type QueueStatus = "pending" | "sending" | "conflict" | "failed";

/** The `resolution` of a server-side `OfflineChange` (C1b): kind, per-field choices, merged body. */
export type QueueResolution = OfflineChangeResolution;

export type QueueEntry = {
  seq: number;
  rootId: string;
  method: OfflineMethod;
  path: string;
  body?: any;
  recordType?: string;
  recordId?: string;
  base: any | null;
  resolution?: QueueResolution;
  createdAt: Date;
  status: QueueStatus;
  /**
   * The id of the package (`offline-change-sets`) the entry was last sent in, kept until the
   * server answers for it: a package that never got its answer is sent again with the same id,
   * so the server applies it once.
   */
  packageId?: string;
};

export type ConflictKind = "fields" | "deleted-on-server" | "changed-on-server" | "could-not-apply";

export type Conflict = {
  id: string;
  queueSeq: number;
  kind: ConflictKind;
  recordType?: string;
  recordId?: string;
  mine: any;
  theirs: any;
  base: any;
  /** The merge the server settled, as a resource: its current resource with the merged attributes. */
  merged?: any;
  fields: string[];
  blocks?: Record<string, string[]>;
  reason?: string;
};

export type SyncState = { serverTime: Date | null; locked: boolean; lockedFrom: Date | null };

/** A record a sync could not read (403/404, or absent from the answer), with its `updatedAt` then. */
export type SkippedRecord = { type: string; id: string; updatedAt: Date };

export interface DeviceStore {
  getRecord(type: string, id: string): Promise<StoredRecord | undefined>;
  /** With `rootId`: every record that root record uses, shared records included. */
  listRecords(filter: { type: string; rootId?: string; ids?: string[] }): Promise<StoredRecord[]>;
  putRecord(
    record: Omit<StoredRecord, "base" | "localOnly"> & { base?: any | null; localOnly?: boolean },
  ): Promise<void>;
  /** Removes the record (every root record's copy) and every link from or to it. */
  deleteRecord(type: string, id: string): Promise<void>;
  /**
   * The record leaves `rootId`. A shared record (an artwork, a template) that another
   * root record still uses is kept for that root record; it is deleted only when no root record keeps it.
   */
  removeRecordFromRoot(type: string, id: string, rootId: string): Promise<void>;
  linksFrom(fromId: string, kind?: string): Promise<StoredLink[]>;
  linksTo(toId: string, kind?: string): Promise<StoredLink[]>;
  replaceRootLinks(rootId: string, links: StoredLink[]): Promise<void>;
  putLink(link: StoredLink): Promise<void>;
  deleteLink(link: Pick<StoredLink, "fromId" | "toId" | "kind">): Promise<void>;
  enqueue(entry: Omit<QueueEntry, "seq" | "createdAt" | "status">): Promise<number>;
  queue(filter?: { status?: QueueStatus }): Promise<QueueEntry[]>;
  setQueueStatus(seq: number, status: QueueStatus): Promise<void>;
  /** Stores (or with `null` clears) the package id of the given entries. */
  setQueuePackage(seqs: number[], packageId: string | null): Promise<void>;
  removeQueueEntry(seq: number): Promise<void>;
  addConflict(c: Omit<Conflict, "id">): Promise<string>;
  conflicts(): Promise<Conflict[]>;
  removeConflict(id: string): Promise<void>;
  getSyncState(rootId: string): Promise<SyncState>;
  /** The store writes ISO strings and parses them back with `new Date`. */
  setSyncState(rootId: string, s: SyncState): Promise<void>;
  /** The records the last sync of `rootId` skipped: asked for again only once they change. */
  skippedRecords(rootId: string): Promise<SkippedRecord[]>;
  /** Replaces the skipped records of `rootId`. */
  setSkippedRecords(rootId: string, records: SkippedRecord[]): Promise<void>;
  /**
   * Records, links, queue, conflicts, sync_state, skipped records — kept only when its queue is empty. A shared
   * record another root record still uses is kept for that root record.
   */
  removeRoot(rootId: string): Promise<void>;
  transaction<T>(fn: (store: DeviceStore) => Promise<T>): Promise<T>;
}
