import { ApiDataInterface } from "../../../core";
import { EmailAutomationInterface } from "./EmailAutomationInterface";

export type EmailAutomationEnrollmentStatus = "active" | "completed" | "unsubscribed" | "exited" | "failed";

/** Body of POST email-automations/:id/email-automation-enrollments (manual add). */
export type EmailAutomationEnrollmentInput = {
  id: string;
  recipientType: "user" | "waitlist";
  recipientId: string;
};

export interface EmailAutomationEnrollmentInterface extends ApiDataInterface {
  get email(): string;
  get name(): string | undefined;
  get status(): EmailAutomationEnrollmentStatus;
  get enrolledAt(): Date;
  get nextSendAt(): Date | undefined;
  get finishedAt(): Date | undefined;
  get attempts(): number;
  get lastError(): string | undefined;
  get currentStepSubject(): string | undefined;
  get sentCount(): number;
  get automation(): EmailAutomationInterface | undefined;
}
