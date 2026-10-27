import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { EmailBlastDeliveryInterface, EmailBlastDeliveryStatus } from "./EmailBlastDeliveryInterface";

/** JSON:API type of the POST email-blasts/unsubscribe/:token request body (not a module: nothing is stored). */
export const EMAIL_BLAST_UNSUBSCRIBE_TYPE = "email-blast-unsubscribes";

export class EmailBlastDelivery extends AbstractApiData implements EmailBlastDeliveryInterface {
  private _status: EmailBlastDeliveryStatus = "pending";

  get status(): EmailBlastDeliveryStatus {
    return this._status;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    this._status = data.jsonApi.attributes.status ?? "pending";

    return this;
  }

  createJsonApi(_data?: any): any {
    throw new Error("EmailBlastDelivery is created by the API and cannot be created from the client");
  }

  /**
   * Body of POST email-blasts/unsubscribe/:token.
   */
  createUnsubscribeJsonApi() {
    return {
      data: {
        type: EMAIL_BLAST_UNSUBSCRIBE_TYPE,
      },
    };
  }
}
