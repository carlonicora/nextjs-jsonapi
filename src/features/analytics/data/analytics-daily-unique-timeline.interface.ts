import { ApiDataInterface } from "../../../core";

/** One calendar day of the unique visitors / unique users charts. */
export interface AnalyticsDailyUniqueTimelineInterface extends ApiDataInterface {
  /** Backend declares this `type: "date"`, so it is a Date in memory. */
  get day(): Date;
  /** null = unknown for that day (drawn as a gap). */
  get visitors(): number | null;
  /** null = unknown for that day (drawn as a gap). */
  get users(): number | null;
}
