import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { ReferralAdminReferrerInterface } from "../interfaces/referral-admin.interface";

/** One referrer company in the referral ranking. Read-only. */
export class ReferralAdminReferrer extends AbstractApiData implements ReferralAdminReferrerInterface {
  private _name?: string;
  private _email?: string;
  private _visits?: number;
  private _invitesSent?: number;
  private _signupsLink?: number;
  private _signupsDirect?: number;
  private _paying?: number;
  private _creditsEarned?: number;
  private _lastInviteAt?: Date;

  get name(): string {
    return this._name ?? "";
  }
  get email(): string {
    return this._email ?? "";
  }
  get visits(): number {
    return this._visits ?? 0;
  }
  get invitesSent(): number {
    return this._invitesSent ?? 0;
  }
  get signupsLink(): number {
    return this._signupsLink ?? 0;
  }
  get signupsDirect(): number {
    return this._signupsDirect ?? 0;
  }
  get paying(): number {
    return this._paying ?? 0;
  }
  get creditsEarned(): number {
    return this._creditsEarned ?? 0;
  }
  get lastInviteAt(): Date | undefined {
    return this._lastInviteAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._name = attrs.name;
    this._email = attrs.email;
    this._visits = attrs.visits;
    this._invitesSent = attrs.invitesSent;
    this._signupsLink = attrs.signupsLink;
    this._signupsDirect = attrs.signupsDirect;
    this._paying = attrs.paying;
    this._creditsEarned = attrs.creditsEarned;
    this._lastInviteAt = attrs.lastInviteAt ? new Date(attrs.lastInviteAt) : undefined;

    return this;
  }

  /** The resource is read-only: there are no attributes to send. */
  createJsonApi(data: { id: string }) {
    return { data: { type: Modules.ReferralAdminReferrer.name, id: data.id, attributes: {} } };
  }
}
