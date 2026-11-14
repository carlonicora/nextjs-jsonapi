import type { ApiRequestDataTypeInterface } from "../core/interfaces/ApiRequestDataTypeInterface";
import type { DeviceStore, StoredRecord } from "./store/DeviceStore";

/** Header of a request the server runs as an offline replay. Never answered locally. */
export const OFFLINE_REPLAY_HEADER = "x-offline-replay";

export type OfflineMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** A Module (matched by its endpoint), a ":param" capture, or a literal segment ("playing", "merge"). */
export type PatternSegment = ApiRequestDataTypeInterface | string;

/** `url` (beyond the contract, optional): the absolute URL the request was made to, for the `links` of a list. */
export type OfflineRequest = { method: OfflineMethod; path: string; query: URLSearchParams; body?: any; url?: string };

/** `body` is a JSON:API document, `undefined` for a 204. */
export type OfflineAnswer = { status: number; body: any };

export type LocalAnswerContext = { request: OfflineRequest; params: Record<string, string>; store: DeviceStore };

export type LocalAnswer = (ctx: LocalAnswerContext) => Promise<OfflineAnswer>;

export type OfflineRoute = { method: OfflineMethod; pattern: PatternSegment[]; answer: LocalAnswer; queue: boolean };

/**
 * A type the API reads only as a list per target record: each changed record's target is the
 * other end of its sync link of `linkKind` (from the record to the target), and `endpoint`
 * builds that target's list path with `EndpointCreator`.
 */
export type OfflineLinkedListFetch = {
  linkKind: string;
  endpoint: (rootId: string, target: { type: string; id: string }) => string;
};

/** One more kind of root record beside `rootModule` (e.g. a notebook). Optional. */
export type OfflineRootKind = {
  /** The module of the root records of this kind. Sync reads `{module}/:rootId/sync`. */
  module: ApiRequestDataTypeInterface;
  /** The ids of the roots of this kind to keep on the device. Throw to keep the device copy unchanged. */
  listSyncRoots: () => Promise<string[]>;
  /**
   * Per record type, the full list endpoint (query string included) that downloads every record of
   * that type under one root of this kind, built from the stored root record. Replaces the type's
   * `fetch` mode under this kind only. Never given `updatedSince`.
   */
  typeEndpoints?: {
    module: ApiRequestDataTypeInterface;
    endpoint: (root: { id: string; resource: StoredRecord["resource"] }) => string;
  }[];
  /** The module whose model reads this kind's sync answer. Default: the library's `RootSync` module (`root-syncs`). */
  syncModule?: ApiRequestDataTypeInterface;
};

type LocalWriteBase = { store: DeviceStore; module: ApiRequestDataTypeInterface; id: string }; // store = the write's transaction

/** What a generic local write (`afterLocalWrite`) did, inside its transaction. */
export type OfflineLocalWriteContext =
  | (LocalWriteBase & { method: "POST"; resource: StoredRecord["resource"]; previous: null })
  | (LocalWriteBase & {
      method: "PUT" | "PATCH";
      resource: StoredRecord["resource"];
      previous: StoredRecord["resource"];
    })
  | (LocalWriteBase & { method: "DELETE"; resource: null; previous: StoredRecord["resource"] });

export type OfflineTypeConfig = {
  module: ApiRequestDataTypeInterface;
  /**
   * How the sync fetches the type's changed records: the root record's list (`root-list`), one
   * GET per record (`by-id`), or (`linked-list`) the list of each record's target, found through
   * the sync answer's links of `linkedList.linkKind` (e.g. player notes, read per target only).
   */
  fetch: "root-list" | "by-id" | "linked-list";
  /** Required with `fetch: "linked-list"`. */
  linkedList?: OfflineLinkedListFetch;
  readOnly: boolean;
  serverOwnedFields: string[];
  /**
   * Relationship name → Neo4j relationship type (`faction` → `MEMBER_OF`). A link the device
   * writes from a request's relationships carries the mapped type, the kind synced links carry;
   * an unmapped name is stored as the name itself.
   */
  relationshipKinds?: Record<string, string>;
  /** The string attributes the server's fulltext index covers (default: every string attribute). */
  searchFields?: string[];
  /** The server's order with no `orderBy` (default `updatedAt DESC`). */
  defaultOrderBy?: string;
  /** `sort` fields ordered by rank (value → index in its tuple, unset after every rank), as the server's code-authored rank expressions. */
  sortRanks?: Record<string, readonly string[]>;
  /** The fields `sort` may name on the type's lists (default: any identifier); any other answers 400 "Invalid sort". */
  sortFields?: readonly string[];
  /**
   * Called by the generic POST/PUT/PATCH/DELETE local answers inside the same transaction as the
   * write and the enqueue (a throw rolls both back). Never called by sync or write-through.
   */
  afterLocalWrite?: (ctx: OfflineLocalWriteContext) => Promise<void>;
};

export type OfflineConfig = {
  getUserId: () => string | undefined;
  /**
   * Offline mode is off on each device until the user turns it on (`turnOnOffline`), stored per
   * user per device. Default (undefined/false): always on, every device keeps the copy.
   */
  requireOptIn?: boolean;
  /** The module whose records own every other record (in Wyrdli, Modules.Campaign). */
  rootModule: ApiRequestDataTypeInterface;
  types: OfflineTypeConfig[];
  routes: OfflineRoute[];
  /** Ids of the root records to keep on the device. */
  listSyncRoots: () => Promise<string[]>;
  /** More kinds of root records beside `rootModule`, each synced and kept on its own (optional). */
  extraRootKinds?: OfflineRootKind[];
  shellPath: (locale: string) => string;
  syncIntervalMs: number;
  /**
   * Where the device worker loads SQLite from at run time (default `/offline-sqlite/index.mjs`).
   * SQLite is never bundled: its own helper worker uses a computed URL that app bundlers refuse.
   * The app serves the files of `dist/offline/sqlite/` at this URL's folder.
   */
  sqliteModuleUrl?: string;
  /**
   * Where the device-copy worker is started from (default `/offline-sqlite/device-worker.mjs`).
   * It is a standalone file in `dist/offline/sqlite/`, never bundled by the app.
   */
  deviceWorkerUrl?: string;
};

export const DEFAULT_SQLITE_MODULE_URL = "/offline-sqlite/index.mjs";
export const DEVICE_WORKER_FILE = "device-worker.mjs";
export const DEFAULT_DEVICE_WORKER_URL = `/offline-sqlite/${DEVICE_WORKER_FILE}`;

/**
 * The files of `dist/offline/sqlite/` the app serves: the device worker and the SQLite files
 * copied from @sqlite.org/sqlite-wasm.
 */
export const OFFLINE_SQLITE_FILES = [
  DEVICE_WORKER_FILE,
  "index.mjs",
  "sqlite3.wasm",
  "sqlite3-opfs-async-proxy.js",
] as const;

/** Thrown by a local answer for something that only the server can do. Answered as a 503 "needs-connection". */
export class NeedsConnectionError extends Error {
  readonly status = 503;
  readonly code = "needs-connection";

  constructor(message: string = "Needs a connection") {
    super(message);
    this.name = "NeedsConnectionError";
  }
}

/** Segments joined with "/", modules by their endpoint. */
export function patternToString(pattern: PatternSegment[]): string {
  return pattern.map((segment) => (typeof segment === "string" ? segment : segment.name)).join("/");
}
