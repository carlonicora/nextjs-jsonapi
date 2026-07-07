import { ApiDataInterface } from "../../../core";
import { ChunkInterface, ChunkRelationshipMeta } from "../../chunk/data/ChunkInterface";

export type AssistantMessageRole = "user" | "assistant" | "system";

/**
 * "text" is the default chat message; "approval-request" marks the message
 * created while an operator run is frozen on a destructive tool call,
 * awaiting human approval (linked AssistantAction via the `action`
 * relationship).
 */
export type AssistantMessageType = "text" | "approval-request";

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
  get citations(): (ChunkInterface & ChunkRelationshipMeta)[];
  get isOptimistic(): boolean;
  get messageType(): AssistantMessageType;
  /**
   * Id of the AssistantAction linked through the `action` relationship.
   * Only present on `approval-request` messages. Exposed as a raw id (not a
   * hydrated model) because the AssistantAction module is registered by the
   * consuming app, not by this library.
   */
  get actionId(): string | undefined;
}
