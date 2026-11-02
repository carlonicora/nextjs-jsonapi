import { ApiDataInterface } from "../../../core";
import { EmailPurpose } from "../../email-automation/data/EmailPurpose";

export type EmailBlastStatus = "draft" | "sending" | "sent";

export type EmailBlastInput = {
  id: string;
  subject: string;
  body: string;
  replyTo?: string;
  purpose?: EmailPurpose;
};

export interface EmailBlastInterface extends ApiDataInterface {
  get subject(): string;
  get body(): string;
  get replyTo(): string | undefined;
  get purpose(): EmailPurpose;
  get status(): EmailBlastStatus;
  get sentAt(): Date | undefined;
  get recipientCount(): number | undefined;
  get sentCount(): number;
  get failedCount(): number;
  get unsubscribedCount(): number;
}
