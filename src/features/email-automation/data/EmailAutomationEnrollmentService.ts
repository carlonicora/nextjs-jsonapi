import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { EmailAutomationEnrollment } from "./EmailAutomationEnrollment";
import { EmailAutomationEnrollmentInterface } from "./EmailAutomationEnrollmentInterface";

export class EmailAutomationEnrollmentService extends AbstractService {
  /**
   * POST email-automations/unsubscribe/:token (public). The scope travels both as
   * a query parameter and in the body, as the API reads either.
   */
  static async unsubscribe(params: {
    token: string;
    scope: "automation" | "all";
  }): Promise<EmailAutomationEnrollmentInterface> {
    const enrollment = new EmailAutomationEnrollment();
    const endpoint = new EndpointCreator({
      endpoint: Modules.EmailAutomation,
      childEndpoint: "unsubscribe",
      childId: params.token,
    });

    endpoint.addAdditionalParam("scope", params.scope);

    return this.callApi<EmailAutomationEnrollmentInterface>({
      type: Modules.EmailAutomationEnrollment,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: enrollment.createUnsubscribeJsonApi({ scope: params.scope }),
      overridesJsonApiCreation: true,
    });
  }
}
