import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { EmailAutomationCandidateInterface } from "./EmailAutomationCandidateInterface";
import {
  EmailAutomationEnrollmentInput,
  EmailAutomationEnrollmentInterface,
} from "./EmailAutomationEnrollmentInterface";
import { EmailAutomationInput, EmailAutomationInterface } from "./EmailAutomationInterface";
import { EmailAutomationTriggerInterface } from "./EmailAutomationTriggerInterface";

export class EmailAutomationService extends AbstractService {
  static async findMany(params: { next?: NextRef; previous?: PreviousRef } = {}): Promise<EmailAutomationInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.EmailAutomation });

    if (Modules.EmailAutomation.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.EmailAutomation.inclusions.lists.fields);
    if (Modules.EmailAutomation.inclusions?.lists?.types)
      endpoint.limitToType(Modules.EmailAutomation.inclusions.lists.types);

    return this.callApi<EmailAutomationInterface[]>({
      type: Modules.EmailAutomation,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
      previous: params.previous,
    });
  }

  static async findOne(params: { id: string }): Promise<EmailAutomationInterface> {
    return this.callApi<EmailAutomationInterface>({
      type: Modules.EmailAutomation,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomation, id: params.id }).generate(),
    });
  }

  static async create(params: EmailAutomationInput): Promise<EmailAutomationInterface> {
    return this.callApi<EmailAutomationInterface>({
      type: Modules.EmailAutomation,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomation }).generate(),
      input: params,
    });
  }

  static async update(params: EmailAutomationInput): Promise<EmailAutomationInterface> {
    return this.callApi<EmailAutomationInterface>({
      type: Modules.EmailAutomation,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomation, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailAutomation,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomation, id: params.id }).generate(),
    });
  }

  /**
   * GET email-automations/triggers: the triggers the app declared to the API.
   */
  static async findTriggers(): Promise<EmailAutomationTriggerInterface[]> {
    return this.callApi<EmailAutomationTriggerInterface[]>({
      type: Modules.EmailAutomationTrigger,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailAutomation, id: "triggers" }).generate(),
    });
  }

  /**
   * POST email-automations/:id/tidy: clears every manual step position. Replies 204.
   */
  static async tidy(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailAutomation,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailAutomation,
        id: params.id,
        childEndpoint: "tidy",
      }).generate(),
    });
  }

  static async findEnrollments(params: {
    automationId: string;
    status?: string;
    next?: NextRef;
    previous?: PreviousRef;
  }): Promise<EmailAutomationEnrollmentInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.EmailAutomation,
      id: params.automationId,
      childEndpoint: Modules.EmailAutomationEnrollment,
    });

    if (params.status) endpoint.addAdditionalParam("status", params.status);

    return this.callApi<EmailAutomationEnrollmentInterface[]>({
      type: Modules.EmailAutomationEnrollment,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
      previous: params.previous,
    });
  }

  /**
   * GET email-automations/:id/email-automation-candidates: users and waitlist
   * entries matching the search, each flagged addable or not by the API. Paged:
   * read through useDataListRetriever, which passes the next/previous refs.
   */
  static async findCandidates(params: {
    automationId: string;
    search?: string;
    next?: NextRef;
    previous?: PreviousRef;
  }): Promise<EmailAutomationCandidateInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.EmailAutomation,
      id: params.automationId,
      childEndpoint: Modules.EmailAutomationCandidate,
    });

    if (params.search) endpoint.addAdditionalParam("search", params.search);

    return this.callApi<EmailAutomationCandidateInterface[]>({
      type: Modules.EmailAutomationCandidate,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
      previous: params.previous,
    });
  }

  /**
   * POST email-automations/:id/email-automation-enrollments: adds one person by
   * hand. The API re-checks every rule and answers 400 with the reason.
   */
  static async addEnrollment(params: {
    automationId: string;
    input: EmailAutomationEnrollmentInput;
  }): Promise<EmailAutomationEnrollmentInterface> {
    return this.callApi<EmailAutomationEnrollmentInterface>({
      type: Modules.EmailAutomationEnrollment,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailAutomation,
        id: params.automationId,
        childEndpoint: Modules.EmailAutomationEnrollment,
      }).generate(),
      input: params.input,
    });
  }
}
