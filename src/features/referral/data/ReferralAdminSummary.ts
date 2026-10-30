import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { ReferralAdminSummaryInterface } from "../interfaces/referral-admin.interface";

/** One window of the referral report tiles: `current` or `previous`. Read-only. */
export class ReferralAdminSummary extends AbstractApiData implements ReferralAdminSummaryInterface {
  private _window?: string;
  private _visits?: number;
  private _invitesSent?: number;
  private _signups?: number;
  private _paying?: number;
  private _creditsGiven?: number;
  private _sharingCompanies?: number;
  private _eligibleCompanies?: number;

  get window(): string {
    return this._window ?? "";
  }
  get visits(): number {
    return this._visits ?? 0;
  }
  get invitesSent(): number {
    return this._invitesSent ?? 0;
  }
  get signups(): number {
    return this._signups ?? 0;
  }
  get paying(): number {
    return this._paying ?? 0;
  }
  get creditsGiven(): number {
    return this._creditsGiven ?? 0;
  }
  get sharingCompanies(): number {
    return this._sharingCompanies ?? 0;
  }
  get eligibleCompanies(): number {
    return this._eligibleCompanies ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attrs = data.jsonApi.attributes;
    this._window = attrs.window;
    this._visits = attrs.visits;
    this._invitesSent = attrs.invitesSent;
    this._signups = attrs.signups;
    this._paying = attrs.paying;
    this._creditsGiven = attrs.creditsGiven;
    this._sharingCompanies = attrs.sharingCompanies;
    this._eligibleCompanies = attrs.eligibleCompanies;

    return this;
  }

  /** The resource is read-only: there are no attributes to send. */
  createJsonApi(data: { id: string }) {
    return { data: { type: Modules.ReferralAdminSummary.name, id: data.id, attributes: {} } };
  }
}
