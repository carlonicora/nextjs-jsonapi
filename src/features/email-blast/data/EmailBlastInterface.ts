import { ApiDataInterface } from "../../../core";

export type EmailBlastStatus = "draft" | "sending" | "sent";

export type EmailBlastInput = {
  id: string;
  subject: string;
  body: string;
  replyTo?: string;
};

export interface EmailBlastInterface extends ApiDataInterface {
  get subject(): string;
  get body(): string;
  get replyTo(): string | undefined;
  get status(): EmailBlastStatus;
  get sentAt(): Date | undefined;
  get recipientCount(): number | undefined;
  get sentCount(): number;
  get failedCount(): number;
  get unsubscribedCount(): number;
}
