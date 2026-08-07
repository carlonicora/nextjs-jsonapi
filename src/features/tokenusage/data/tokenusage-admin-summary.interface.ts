import { ApiDataInterface } from "../../../core";

export interface TokenUsageAdminSummaryInterface extends ApiDataInterface {
  /** "customer" | "platform" | "total" */
  get scope(): string;
  /** "current" | "previous" */
  get window(): string;
  get cost(): number;
  get credits(): number;
  get tokensIn(): number;
  get tokensOut(): number;
  get cached(): number;
  get calls(): number;
}
