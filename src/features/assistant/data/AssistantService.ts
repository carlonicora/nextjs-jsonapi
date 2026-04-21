import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AssistantInput, AssistantInterface } from "./AssistantInterface";
import { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";

export class AssistantService extends AbstractService {
  static async findOne(params: { id: string }): Promise<AssistantInterface> {
    return this.callApi<AssistantInterface>({
      type: Modules.Assistant,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.Assistant, id: params.id }).generate(),
    });
  }

  static async findMany(params: { fetchAll?: boolean } = {}): Promise<AssistantInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Assistant });
    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    return this.callApi({
      type: Modules.Assistant,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async create(params: AssistantInput): Promise<AssistantInterface> {
    return this.callApi({
      type: Modules.Assistant,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.Assistant }).generate(),
      input: params,
    });
  }

  /**
   * Sends a new user message to an existing assistant thread. The agent turn
   * runs synchronously; the response is a two-element list: [user, assistant].
   */
  static async appendMessage(params: {
    assistantId: string;
    content: string;
  }): Promise<AssistantMessageInterface[]> {
    return this.callApi<AssistantMessageInterface[]>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Assistant,
        id: params.assistantId,
        childEndpoint: Modules.AssistantMessage,
      }).generate(),
      input: {
        data: {
          type: Modules.AssistantMessage.name,
          attributes: { content: params.content },
        },
      },
      overridesJsonApiCreation: true,
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.Assistant,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.Assistant, id: params.id }).generate(),
    });
  }
}
