import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantActionInterface } from "./AssistantActionInterface";

export class AssistantActionService extends AbstractService {
  /**
   * GET single assistant action by ID
   */
  static async findOne(params: { id: string }): Promise<AssistantActionInterface> {
    return this.callApi<AssistantActionInterface>({
      type: Modules.AssistantAction,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({
        endpoint: Modules.AssistantAction,
        id: params.id,
      }).generate(),
    });
  }

  /**
   * POST approve action — resumes the paused run and returns the resumed
   * assistant message. Body-less, unless `edits` holds at least one changed
   * field of a create proposal: then the AssistantAction model builds the
   * body (`attributes.edits`).
   */
  static async approve(params: { id: string; edits?: Record<string, string> }): Promise<AssistantMessageInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.AssistantAction,
      id: params.id,
      childEndpoint: "approve",
    }).generate();

    if (params.edits && Object.keys(params.edits).length > 0)
      return this.callApi<AssistantMessageInterface>({
        type: Modules.AssistantAction,
        method: HttpMethod.POST,
        endpoint,
        input: { id: params.id, edits: params.edits },
        responseType: Modules.AssistantMessage,
      });

    return this.callApi<AssistantMessageInterface>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint,
    });
  }

  /**
   * POST (body-less) deny action — resumes the paused run with a denial and
   * returns the resumed assistant message.
   */
  static async deny(params: { id: string }): Promise<AssistantMessageInterface> {
    return this.callApi<AssistantMessageInterface>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.AssistantAction,
        id: params.id,
        childEndpoint: "deny",
      }).generate(),
    });
  }
}
