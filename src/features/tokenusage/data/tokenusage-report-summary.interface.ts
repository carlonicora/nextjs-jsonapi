import { ApiDataInterface } from "../../../core";

export interface TokenUsageReportSummaryInterface extends ApiDataInterface {
  /** "current" or "previous" — the equal-length preceding span. */
  get window(): string;
  get cost(): number;
  get credits(): number;
  get tokensIn(): number;
  get tokensOut(): number;
  get cached(): number;
  get calls(): number;
}
