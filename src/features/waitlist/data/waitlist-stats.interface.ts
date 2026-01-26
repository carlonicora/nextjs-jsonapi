import { ApiDataInterface } from "../../../core";

export interface WaitlistStatsInterface extends ApiDataInterface {
  get pending(): number;
  get confirmed(): number;
  get invited(): number;
  get registered(): number;
  get total(): number;
}
