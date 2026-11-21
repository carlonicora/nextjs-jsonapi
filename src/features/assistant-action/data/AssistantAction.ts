import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { AssistantActionInput, AssistantActionInterface, AssistantActionStatus } from "./AssistantActionInterface";

export class AssistantAction extends AbstractApiData implements AssistantActionInterface {
  private _status?: AssistantActionStatus;
  private _toolName?: string;
  private _toolArgs?: string;
  private _proposal?: string;
  private _summary?: string;
  private _resolvedAt?: Date;
  private _expiresAt?: Date;

  get status(): AssistantActionStatus {
    // Fail-safe: a missing status must never render actionable Approve/Deny buttons, so default to the non-actionable "expired".
    return this._status ?? "expired";
  }

  get toolName(): string {
    return this._toolName ?? "";
  }

  get toolArgs(): string {
    return this._toolArgs ?? "";
  }

  get proposal(): string {
    return this._proposal ?? "";
  }

  get summary(): string {
    return this._summary ?? "";
  }

  get resolvedAt(): Date | undefined {
    return this._resolvedAt;
  }

  get expiresAt(): Date | undefined {
    return this._expiresAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._status = data.jsonApi.attributes.status;
    this._toolName = data.jsonApi.attributes.toolName;
    this._toolArgs = data.jsonApi.attributes.toolArgs;
    this._proposal = data.jsonApi.attributes.proposal;
    this._summary = data.jsonApi.attributes.summary;
    this._resolvedAt = data.jsonApi.attributes.resolvedAt ? new Date(data.jsonApi.attributes.resolvedAt) : undefined;
    this._expiresAt = data.jsonApi.attributes.expiresAt ? new Date(data.jsonApi.attributes.expiresAt) : undefined;

    return this;
  }

  /**
   * The frontend never creates assistant actions. The only body it sends is
   * an approve with edits: `attributes.edits` holds the changed fields of a
   * create proposal. Without edits the attributes stay empty (approve/deny
   * without edits are body-less POSTs handled by AssistantActionService).
   */
  createJsonApi(data: AssistantActionInput) {
    const attributes: Record<string, unknown> = {};
    if (data.edits !== undefined) attributes.edits = data.edits;
    return {
      data: {
        type: Modules.AssistantAction.name,
        id: data.id,
        attributes,
      },
      included: [],
    };
  }
}
