import { ApiDataInterface } from "../../../core";

export interface AnalyticsPageViewInterface extends ApiDataInterface {
  /** Backend declares this `type: "datetime"`, so it is a Date in memory. */
  get createdAt(): Date;
  get path(): string;
  get route(): string;
  get section(): string;
}
