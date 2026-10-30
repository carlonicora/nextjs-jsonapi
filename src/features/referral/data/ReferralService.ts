import { AbstractService, HttpMethod } from "../../../core";
import { EndpointCreator } from "../../../core";
import { Modules } from "../../../core";

import { ReferralStatsInterface } from "../interfaces";

export class ReferralService extends AbstractService {
  /**
   * Get referral stats for the current company.
   * Returns deserialized attributes from JSON:API response.
   */
  static async getMyReferralStats(): Promise<ReferralStatsInterface> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Referral, id: "stats" });

    return this.callApi<ReferralStatsInterface>({
      type: Modules.ReferralStats,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  /**
   * Send a referral invitation email.
   * Uses overridesJsonApiCreation since the endpoint accepts a simple JSON body, not JSON:API format.
   * Returns 204 No Content on success.
   */
  static async sendReferralEmail(email: string): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Referral, id: "invite" });

    await this.callApi<void>({
      type: Modules.Referral,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: { email },
      overridesJsonApiCreation: true,
      // The widget turns the error code into a translated message; the global
      // handler would show the API's English text and swallow the failure.
      suppressGlobalError: true,
    });
  }

  /**
   * Count one visit to a referral link. Answers 204 whatever the code.
   */
  static async recordVisit(params: { referralCode: string }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.ReferralVisit });

    await this.callApi<void>({
      type: Modules.ReferralVisit,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      // The request layer builds the body through ReferralVisit.createJsonApi().
      input: { referralCode: params.referralCode },
      // A failed beacon must never show an error to a visitor.
      suppressGlobalError: true,
    });
  }
}
