import { ApiDataInterface } from "../../../core";

/** Write-only resource: the tracker posts it, rehydrate reads the two attributes back. */
export interface AnalyticsEventInterface extends ApiDataInterface {
  get path(): string;
  get section(): string;
}
