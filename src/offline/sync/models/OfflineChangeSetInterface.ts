import { ApiDataInterface } from "../../../core/interfaces/ApiDataInterface";

/** One waiting change as the server reads it (C1b, `attributes.changes[]`). */
export type OfflineChange = {
  seq: number;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  /** Relative to the API base, as EndpointCreator built it. */
  path: string;
  /** The JSON:API document the model built when the GM saved. */
  body?: Record<string, unknown>;
  /** Set for an edit or delete of one record. */
  recordType?: string;
  recordId?: string;
  /** The record's JSON:API resource as of the last sync. */
  base?: Record<string, unknown> | null;
  /**
   * Set on a re-sent change after the GM resolved its conflict. The change keeps its original
   * `body` and `base`; the server runs the normal three-way merge and settles each conflicting
   * field by `choices` (kind "mine": every conflicting field is "mine").
   */
  resolution?: OfflineChangeResolution;
};

export type OfflineChangeResolution = {
  kind: "mine" | "merged";
  /** Per conflicting field: whose value wins. */
  choices?: Record<string, "mine" | "theirs" | "merged">;
  /** The model-built JSON:API document holding only the fields chosen "merged", with their hand-merged values. */
  mergedBody?: Record<string, unknown>;
};

/** The server's answer for one change (C1b, `attributes.results[]`). */
export type OfflineChangeResult = {
  seq: number;
  status: "applied" | "conflict" | "could-not-apply" | "waiting";
  conflict?: "fields" | "deleted-on-server" | "changed-on-server";
  /** JSON:API resource as it is now on the server. */
  current?: Record<string, unknown> | null;
  /** Attributes the merge settled (for the conflict screen). */
  merged?: Record<string, unknown>;
  conflictFields?: string[];
  /** Rich-text field → conflicting block ids. */
  conflictBlocks?: Record<string, string[]>;
  /** The server's reason for could-not-apply. */
  detail?: string;
  /** JSON:API document the route answered, when applied. */
  response?: Record<string, unknown>;
};

export type OfflineChangeSetInput = { id: string; changes: OfflineChange[] };

export interface OfflineChangeSetInterface extends ApiDataInterface {
  get results(): OfflineChangeResult[];
}
