import { ApiDataInterface } from "../../../core";

export interface TokenUsageAdminBreakdownInterface extends ApiDataInterface {
  get label(): string;
  get sublabel(): string | undefined;
  get cost(): number;
  get credits(): number;
  get tokensIn(): number;
  get tokensOut(): number;
  get cached(): number;
  get calls(): number;
  /** Company dimension only. */
  get activeUsers(): number | undefined;
  /** Company dimension only. */
  get monthlyCredits(): number | undefined;
  /** Company dimension only. */
  get availableMonthlyCredits(): number | undefined;
}
