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
    });
  }
}
