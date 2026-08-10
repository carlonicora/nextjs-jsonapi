import { ApiDataInterface } from "../../../core";

/**
 * Lifecycle of a destructive tool call the operator engine paused on.
 * Only `pending` is actionable from the UI.
 */
export type AssistantActionStatus = "pending" | "approved" | "denied" | "expired" | "executed" | "failed";

/**
 * The frontend never creates assistant actions — the operator engine does.
 * The input therefore carries the id alone, so `createJsonApi()` can emit a
 * well-formed (if minimal) JSON:API resource object.
 */
export type AssistantActionInput = {
  id: string;
};

export interface AssistantActionInterface extends ApiDataInterface {
  get status(): AssistantActionStatus;
  get toolName(): string;
  get summary(): string;
  get resolvedAt(): Date | undefined;
  get expiresAt(): Date | undefined;
}
