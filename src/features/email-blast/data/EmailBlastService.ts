import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef, PreviousRef } from "../../../core";
import { EMAIL_BLAST_SEGMENTS } from "./email-blast.segments";
import { EmailBlastAudienceInterface } from "./EmailBlastAudienceInterface";
import { EmailBlastInput, EmailBlastInterface } from "./EmailBlastInterface";

export class EmailBlastService extends AbstractService {
  static async findMany(params: { next?: NextRef; previous?: PreviousRef } = {}): Promise<EmailBlastInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.EmailBlast });

    if (Modules.EmailBlast.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.EmailBlast.inclusions.lists.fields);
    if (Modules.EmailBlast.inclusions?.lists?.types) endpoint.limitToType(Modules.EmailBlast.inclusions.lists.types);

    return this.callApi<EmailBlastInterface[]>({
      type: Modules.EmailBlast,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
      previous: params.previous,
    });
  }

  static async findOne(params: { id: string }): Promise<EmailBlastInterface> {
    return this.callApi<EmailBlastInterface>({
      type: Modules.EmailBlast,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailBlast, id: params.id }).generate(),
    });
  }

  static async create(params: EmailBlastInput): Promise<EmailBlastInterface> {
    return this.callApi<EmailBlastInterface>({
      type: Modules.EmailBlast,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailBlast }).generate(),
      input: params,
    });
  }

  static async update(params: EmailBlastInput): Promise<EmailBlastInterface> {
    return this.callApi<EmailBlastInterface>({
      type: Modules.EmailBlast,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailBlast, id: params.id }).generate(),
      input: params,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailBlast,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.EmailBlast, id: params.id }).generate(),
    });
  }

  /**
   * GET email-blasts/:id/recipient-count: how many people the blast would reach now.
   */
  static async findAudience(params: { id: string }): Promise<EmailBlastAudienceInterface> {
    return this.callApi<EmailBlastAudienceInterface>({
      type: Modules.EmailBlastAudience,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailBlast,
        id: params.id,
        childEndpoint: EMAIL_BLAST_SEGMENTS.audience,
      }).generate(),
    });
  }

  /**
   * POST email-blasts/:id/test: sends the draft to the calling administrator. Replies 204.
   */
  static async sendTest(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.EmailBlast,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailBlast,
        id: params.id,
        childEndpoint: EMAIL_BLAST_SEGMENTS.test,
      }).generate(),
    });
  }

  /**
   * POST email-blasts/:id/send: starts the send and returns the blast, now `sending`.
   */
  static async send(params: { id: string }): Promise<EmailBlastInterface> {
    return this.callApi<EmailBlastInterface>({
      type: Modules.EmailBlast,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.EmailBlast,
        id: params.id,
        childEndpoint: EMAIL_BLAST_SEGMENTS.send,
      }).generate(),
    });
  }
}
