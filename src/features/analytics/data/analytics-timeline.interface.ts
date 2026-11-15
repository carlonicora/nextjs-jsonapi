import { ApiDataInterface } from "../../../core";
import { AnalyticsAudience } from "./analytics.types";

export interface AnalyticsTimelineInterface extends ApiDataInterface {
  /** Backend declares this `type: "date"`, so it is a Date in memory. */
  get bucket(): Date;
  /** The audience the row was counted for. */
  get section(): AnalyticsAudience;
  get visitors(): number;
  get sessions(): number;
  get pageViews(): number;
}
