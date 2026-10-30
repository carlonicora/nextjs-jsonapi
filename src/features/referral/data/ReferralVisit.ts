import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";

/**
 * One visit to a referral link, posted once per browser when the referral
 * cookie is first set. The API answers 204, so there is nothing to read back.
 * The body carries no id: the server generates the visit id.
 */
export class ReferralVisit extends AbstractApiData {
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    return this;
  }

  createJsonApi(data: { referralCode: string }) {
    return {
      data: {
        type: Modules.ReferralVisit.name,
        attributes: { referralCode: data.referralCode },
      },
    };
  }
}
