import { ApiDataInterface } from "../../../core";

export interface TokenUsageAdminTimelineInterface extends ApiDataInterface {
  /** Backend declares this `type: "date"`, so it is a Date in memory. */
  get bucket(): Date;
  get series(): string;
  get cost(): number;
  get credits(): number;
  get tokensIn(): number;
  get tokensOut(): number;
  get cached(): number;
  get calls(): number;
}
