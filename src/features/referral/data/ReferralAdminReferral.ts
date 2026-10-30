import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { ReferralAdminReferralInterface } from "../interfaces/referral-admin.interface";

/** One referral in the administrative list: the new account and who brought it. Read-only. */
export class ReferralAdminReferral extends AbstractApiData implements ReferralAdminReferralInterface {
  private _name?: string;
  private _email?: string;
  private _referrerName?: string;
  private _referrerEmail?: string;
  private _source?: string;
  private _status?: string;
  private _referredAt?: Date;
  private _completedAt?: Date;
  private _tokensAwarded?: number;

  get name(): string {
    return this._name ?? "";
  }
  get email(): string {
    return this._email ?? "";
  }
  get referrerName(): string {
    return this._referrerName ?? "";
  }
  get referrerEmail(): string {
    return this._referrerEmail ?? "";
  }
  get source(): string {
    return this._source ?? "";
  }
  get status(): string {
    return this._status ?? "";
  }
  get referredAt(): Date {
    return this._referredAt ?? new Date(0);
  }
  get completedAt(): Date | undefined {
    return this._completedAt;
  }
  get tokensAwarded(): number | undefined {
    return this._tokensAwarded;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._name = attrs.name;
    this._email = attrs.email;
    this._referrerName = attrs.referrerName;
    this._referrerEmail = attrs.referrerEmail;
    this._source = attrs.source;
    this._status = attrs.status;
    this._referredAt = attrs.referredAt ? new Date(attrs.referredAt) : undefined;
    this._completedAt = attrs.completedAt ? new Date(attrs.completedAt) : undefined;
    this._tokensAwarded = attrs.tokensAwarded ?? undefined;

    return this;
  }

  /** The resource is read-only: there are no attributes to send. */
  createJsonApi(data: { id: string }) {
    return { data: { type: Modules.ReferralAdminReferral.name, id: data.id, attributes: {} } };
  }
}
