import { ApiDataInterface } from "../../../core";

/**
 * Lifecycle of a destructive tool call the operator engine paused on.
 * Only `pending` is actionable from the UI.
 */
export type AssistantActionStatus = "pending" | "approved" | "denied" | "expired" | "executed" | "failed";

/**
 * The frontend never creates assistant actions — the operator engine does.
 * The input carries the id, plus the user's edits of a create proposal when
 * approving it, so `createJsonApi()` can emit a well-formed JSON:API resource
 * object.
 */
export type AssistantActionInput = {
  id: string;
  /**
   * Approve with edits: only the changed editable fields of a create
   * proposal, by attribute key. A rich-text value is `JSON.stringify(blocks)`.
   */
  edits?: Record<string, string>;
};

export interface AssistantActionInterface extends ApiDataInterface {
  get status(): AssistantActionStatus;
  get toolName(): string;
  /** Raw JSON string of the frozen tool call's arguments. Audit copy — never rendered. */
  get toolArgs(): string;
  /**
   * JSON string of the operator's presentation payload: the record being
   * written with every referenced id already resolved to a display name.
   * Empty when the action predates the payload (the card then falls back to
   * the attributes in `toolArgs`).
   */
  get proposal(): string;
  get summary(): string;
  get resolvedAt(): Date | undefined;
  get expiresAt(): Date | undefined;
}
