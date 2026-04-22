import { ApiDataInterface } from "../../../core";

export type AssistantInput = {
  firstMessage: string;
  title?: string;
};

export interface AssistantInterface extends ApiDataInterface {
  get title(): string;
  get messageCount(): number;
}
