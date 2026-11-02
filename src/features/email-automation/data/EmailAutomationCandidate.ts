import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import {
  EmailAutomationCandidateInterface,
  EmailAutomationCandidateReason,
  EmailAutomationRecipientType,
} from "./EmailAutomationCandidateInterface";

export class EmailAutomationCandidate extends AbstractApiData implements EmailAutomationCandidateInterface {
  private _recipientType: EmailAutomationRecipientType = "user";
  private _recipientId?: string;
  private _email?: string;
  private _name?: string;
  private _addable?: boolean;
  private _reason?: EmailAutomationCandidateReason;

  get recipientType(): EmailAutomationRecipientType {
    return this._recipientType;
  }

  get recipientId(): string {
    return this._recipientId ?? "";
  }

  get email(): string {
    return this._email ?? "";
  }

  get name(): string | undefined {
    return this._name;
  }

  get addable(): boolean {
    return this._addable ?? false;
  }

  get reason(): EmailAutomationCandidateReason | undefined {
    return this._reason;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;
    this._recipientType = attributes.recipientType === "waitlist" ? "waitlist" : "user";
    this._recipientId = attributes.recipientId;
    this._email = attributes.email;
    this._name = attributes.name ?? undefined;
    this._addable = attributes.addable === true;
    this._reason = attributes.reason ?? undefined;

    return this;
  }

  /**
   * The API computes candidates and never accepts one as a request body; this
   * only identifies the resource.
   */
  createJsonApi(data: { id: string }) {
    return {
      data: {
        type: Modules.EmailAutomationCandidate.name,
        id: data.id,
      },
    };
  }
}
