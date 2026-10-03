import { ApiDataInterface } from "../../../core";

export interface AnalyticsBreakdownInterface extends ApiDataInterface {
  get dimension(): string;
  get key(): string;
  get visitors(): number;
  get sessions(): number;
  get pageViews(): number;
}
