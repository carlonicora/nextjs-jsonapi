import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { EMAIL_BLAST_SEGMENTS } from "./email-blast.segments";
import { EmailBlastDelivery } from "./EmailBlastDelivery";

export class EmailBlastDeliveryService extends AbstractService {
  /**
   * POST email-blasts/unsubscribe/:token (public). Replies 204: the token holder
   * receives nothing back.
   */
  static async unsubscribe(params: { token: string }): Promise<void> {
    const delivery = new EmailBlastDelivery();

    await this.callApi({
      type: Modules.EmailBlastDelivery,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailBlast,
        id: EMAIL_BLAST_SEGMENTS.unsubscribe,
        childEndpoint: params.token,
      }).generate(),
      input: delivery.createUnsubscribeJsonApi(),
      overridesJsonApiCreation: true,
    });
  }
}
