import { ApiDataInterface } from "../../../core";

export type AssistantMessageRole = "user" | "assistant" | "system";

export type AssistantMessageInput = {
  id: string;
  role: AssistantMessageRole;
  content: string;
  position: number;
  assistantId: string;
};

export interface AssistantMessageInterface extends ApiDataInterface {
  get role(): AssistantMessageRole;
  get content(): string;
  get position(): number;
  get suggestedQuestions(): string[];
  get inputTokens(): number | undefined;
  get outputTokens(): number | undefined;
  get references(): ApiDataInterface[];
}
