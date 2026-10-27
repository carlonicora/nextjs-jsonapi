import { ApiDataInterface } from "../../../core";

export interface EmailBlastAudienceInterface extends ApiDataInterface {
  get recipientCount(): number;
}
