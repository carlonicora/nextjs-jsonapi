import { AbstractApiData } from "../../../core";
import { JsonApiHydratedDataInterface } from "../../../core/interfaces/JsonApiHydratedDataInterface";
import { ReferralStatsInterface } from "../interfaces";

export class ReferralStats extends AbstractApiData implements ReferralStatsInterface {
  private _referralCode?: string;
  private _completedReferrals?: number;
  private _totalTokensEarned?: number;

  get referralCode(): string {
    return this._referralCode ?? "";
  }
  get completedReferrals(): number {
    return this._completedReferrals ?? 0;
  }
  get totalTokensEarned(): number {
    return this._totalTokensEarned ?? 0;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._referralCode = data.jsonApi.attributes.referralCode;
    this._completedReferrals = data.jsonApi.attributes.completedReferrals;
    this._totalTokensEarned = data.jsonApi.attributes.totalTokensEarned;
    return this;
  }

  createJsonApi() {
    return {};
  }
}
