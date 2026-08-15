import { ApiDataInterface } from "../../../core";

export interface TokenUsageReportBreakdownInterface extends ApiDataInterface {
  get label(): string;
  get sublabel(): string | undefined;
  get cost(): number;
  get credits(): number;
  get tokensIn(): number;
  get tokensOut(): number;
  get cached(): number;
  get calls(): number;
}
