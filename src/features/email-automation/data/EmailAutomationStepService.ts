import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { EmailAutomationStep } from "./EmailAutomationStep";
import { EmailAutomationStepInput, EmailAutomationStepInterface } from "./EmailAutomationStepInterface";

export class EmailAutomationStepService extends AbstractService {
  static async findByAutomation(params: { automationId: string }): Promise<EmailAutomationStepInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.EmailAutomation,
      id: params.automationId,
      childEndpoint: Modules.EmailAutomationStep,
    });

    endpoint.addAdditionalParam("fetchAll", "true");

    return this.callApi<EmailAutomationStepInterface[]>({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async create(params: EmailAutomationStepInput): Promise<EmailAutomationStepInterface> {
    return this.callApi<EmailAutomationStepInterface>({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomationStep }).generate(),
      input: params,
    });
  }

  static async update(params: EmailAutomationStepInput): Promise<EmailAutomationStepInterface> {
    return this.callApi<EmailAutomationStepInterface>({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomationStep, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomationStep, id: params.id }).generate(),
    });
  }

  /**
   * POST email-automation-steps/:stepId/next: continues the chain from stepId to nextStepId.
   */
  static async setNext(params: { stepId: string; nextStepId: string }): Promise<EmailAutomationStepInterface> {
    const step = new EmailAutomationStep();
    return this.callApi<EmailAutomationStepInterface>({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailAutomationStep,
        id: params.stepId,
        childEndpoint: "next",
      }).generate(),
      input: step.createNextJsonApi({ nextStepId: params.nextStepId }),
      overridesJsonApiCreation: true,
    });
  }

  /**
   * DELETE email-automation-steps/:stepId/next: the step becomes the end of the chain.
   */
  static async clearNext(params: { stepId: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailAutomationStep,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailAutomationStep,
        id: params.stepId,
        childEndpoint: "next",
      }).generate(),
    });
  }
}
