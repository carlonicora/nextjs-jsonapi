import { ApiDataInterface } from "../../../core";

export interface AnalyticsTimelineInterface extends ApiDataInterface {
  /** Backend declares this `type: "date"`, so it is a Date in memory. */
  get bucket(): Date;
  get section(): string;
  get visitors(): number;
  get sessions(): number;
  get pageViews(): number;
}
