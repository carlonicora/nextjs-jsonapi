import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import {
  ReferralAdminPeriod,
  ReferralAdminReferralInterface,
  ReferralAdminReferrerInterface,
  ReferralAdminSort,
  ReferralAdminSummaryInterface,
} from "../interfaces/referral-admin.interface";

/** Reads of the administrative referral report. Every route is administrator-only. */
export class ReferralAdminService extends AbstractService {
  /** Headline tiles: one row per window (`current`, plus `previous` unless the period is `all`). */
  static async getSummary(params: { period: ReferralAdminPeriod }): Promise<ReferralAdminSummaryInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.ReferralAdminSummary });
    endpoint.addAdditionalParam("period", params.period);

    return this.callApi<ReferralAdminSummaryInterface[]>({
      type: Modules.ReferralAdminSummary,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /** The referrers ranking, ordered by the allowlisted sort. */
  static async getReferrers(params: {
    period: ReferralAdminPeriod;
    sort: ReferralAdminSort;
  }): Promise<ReferralAdminReferrerInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.ReferralAdminReferrer });
    endpoint.addAdditionalParam("period", params.period);
    endpoint.addAdditionalParam("sort", params.sort);

    return this.callApi<ReferralAdminReferrerInterface[]>({
      type: Modules.ReferralAdminReferrer,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /** Every referral in the period, newest first. */
  static async getReferrals(params: { period: ReferralAdminPeriod }): Promise<ReferralAdminReferralInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.ReferralAdminReferral });
    endpoint.addAdditionalParam("period", params.period);

    return this.callApi<ReferralAdminReferralInterface[]>({
      type: Modules.ReferralAdminReferral,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }
}
