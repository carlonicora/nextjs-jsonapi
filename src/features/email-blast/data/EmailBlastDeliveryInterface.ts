import { ApiDataInterface } from "../../../core";

export type EmailBlastDeliveryStatus = "pending" | "sending" | "sent" | "skipped" | "failed";

export interface EmailBlastDeliveryInterface extends ApiDataInterface {
  get status(): EmailBlastDeliveryStatus;
}
