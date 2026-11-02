import { ApiDataInterface } from "../../../core";

export type EmailAutomationRecipientType = "user" | "waitlist";

export type EmailAutomationCandidateReason = "already_enrolled" | "opted_out" | "no_consent";

/**
 * A person the administrator may add to an automation by hand. The API decides
 * whether they can be added (`addable`) and why not (`reason`); the browser only
 * displays it.
 */
export interface EmailAutomationCandidateInterface extends ApiDataInterface {
  get recipientType(): EmailAutomationRecipientType;
  get recipientId(): string;
  get email(): string;
  get name(): string | undefined;
  get addable(): boolean;
  get reason(): EmailAutomationCandidateReason | undefined;
}
