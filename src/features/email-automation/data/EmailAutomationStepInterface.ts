import { ApiDataInterface } from "../../../core";
import { EmailAutomationInterface } from "./EmailAutomationInterface";

export type EmailAutomationStepInput = {
  id: string;
  automationId: string;
  subject: string;
  body: string;
  delayHours?: number;
  positionX?: number;
  positionY?: number;
};

export interface EmailAutomationStepInterface extends ApiDataInterface {
  get subject(): string;
  get body(): string;
  get delayHours(): number;
  get positionX(): number | undefined;
  get positionY(): number | undefined;
  get sentCount(): number;
  get automation(): EmailAutomationInterface | undefined;
  get next(): EmailAutomationStepInterface | undefined;
}
