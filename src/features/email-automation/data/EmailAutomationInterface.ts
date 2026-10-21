import { ApiDataInterface } from "../../../core";

export type EmailAutomationInput = {
  id: string;
  name: string;
  trigger?: string;
  exitTrigger?: string;
  replyTo?: string;
  isActive?: boolean;
};

export interface EmailAutomationInterface extends ApiDataInterface {
  get name(): string;
  get trigger(): string | undefined;
  get exitTrigger(): string | undefined;
  get replyTo(): string | undefined;
  get isActive(): boolean;
  get stepCount(): number;
  get activeCount(): number;
  get completedCount(): number;
  get unsubscribedCount(): number;
}
