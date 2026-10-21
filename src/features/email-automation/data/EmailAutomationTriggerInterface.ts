import { ApiDataInterface } from "../../../core";

export interface EmailAutomationTriggerInterface extends ApiDataInterface {
  get key(): string;
  get label(): string;
}
