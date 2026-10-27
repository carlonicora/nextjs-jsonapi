import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { EmailBlastInput, EmailBlastInterface, EmailBlastStatus } from "./EmailBlastInterface";

export class EmailBlast extends AbstractApiData implements EmailBlastInterface {
  private _subject?: string;
  private _body?: string;
  private _replyTo?: string;
  private _status: EmailBlastStatus = "draft";
  private _sentAt?: Date;
  private _recipientCount?: number;
  private _sentCount?: number;
  private _failedCount?: number;
  private _unsubscribedCount?: number;

  get subject(): string {
    return this._subject ?? "";
  }

  get body(): string {
    return this._body ?? "";
  }

  get replyTo(): string | undefined {
    return this._replyTo;
  }

  get status(): EmailBlastStatus {
    return this._status;
  }

  get sentAt(): Date | undefined {
    return this._sentAt;
  }

  get recipientCount(): number | undefined {
    return this._recipientCount;
  }

  get sentCount(): number {
    return this._sentCount ?? 0;
  }

  get failedCount(): number {
    return this._failedCount ?? 0;
  }

  get unsubscribedCount(): number {
    return this._unsubscribedCount ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes;
    this._subject = attributes.subject;
    this._body = attributes.body;
    this._replyTo = attributes.replyTo ?? undefined;
    this._status = attributes.status ?? "draft";
    this._sentAt = attributes.sentAt ? new Date(attributes.sentAt) : undefined;
    this._recipientCount = attributes.recipientCount ?? undefined;
    this._sentCount = attributes.sentCount;
    this._failedCount = attributes.failedCount;
    this._unsubscribedCount = attributes.unsubscribedCount;

    return this;
  }

  /**
   * Only the editable text travels: status, counters and sentAt are set by the API.
   */
  createJsonApi(data: EmailBlastInput) {
    const response: any = {
      data: {
        type: Modules.EmailBlast.name,
        id: data.id,
        attributes: {},
        meta: {},
        relationships: {},
      },
      included: [],
    };

    if (data.subject !== undefined) response.data.attributes.subject = data.subject;
    if (data.body !== undefined) response.data.attributes.body = data.body;
    if (data.replyTo !== undefined) response.data.attributes.replyTo = data.replyTo;

    return response;
  }
}
