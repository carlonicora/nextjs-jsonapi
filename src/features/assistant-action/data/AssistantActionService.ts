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
   * POST (body-less) approve action — resumes the paused run and
   * returns the resumed assistant message.
   */
  static async approve(params: { id: string }): Promise<AssistantMessageInterface> {
    return this.callApi<AssistantMessageInterface>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.AssistantAction,
        id: params.id,
        childEndpoint: "approve",
      }).generate(),
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
