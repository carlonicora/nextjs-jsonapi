import { ApiDataInterface } from "../../../core";

export interface AnalyticsSummaryInterface extends ApiDataInterface {
  get section(): "total";
  get window(): string;
  get visitors(): number;
  get sessions(): number;
  get pageViews(): number;
  get pagesPerSession(): number;
  get consentShare(): number;
}
