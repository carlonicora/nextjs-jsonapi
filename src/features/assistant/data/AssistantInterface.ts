import { ApiDataInterface } from "../../../core";

export type AssistantInput = {
  id: string;
  title?: string;
  firstMessage: string;
};

export interface AssistantInterface extends ApiDataInterface {
  get title(): string;
  get messageCount(): number;
}
