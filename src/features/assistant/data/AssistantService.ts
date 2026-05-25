import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AssistantMessage } from "../../assistant-message/data/AssistantMessage";
import { AssistantMessageInterface } from "../../assistant-message/data/AssistantMessageInterface";
import { AssistantInput, AssistantInterface } from "./AssistantInterface";

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
   *
   * Uses the dedicated AssistantMessage.createAppendMessageJsonApi method to
   * build the JSON:API envelope; this is the architecture-compliant pairing
   * with `overridesJsonApiCreation: true`.
   */
  static async appendMessage(params: {
    assistantId: string;
    content: string;
    howToMode?: boolean;
    limitToHowToId?: string;
  }): Promise<AssistantMessageInterface[]> {
    const message = new AssistantMessage();
    return this.callApi<AssistantMessageInterface[]>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.Assistant,
        id: params.assistantId,
        childEndpoint: Modules.AssistantMessage,
      }).generate(),
      input: message.createAppendMessageJsonApi({
        content: params.content,
        howToMode: params.howToMode,
        limitToHowToId: params.limitToHowToId,
      }),
      overridesJsonApiCreation: true,
    });
  }

  static async rename(params: { id: string; title: string }): Promise<void> {
    await this.callApi({
      type: Modules.Assistant,
      method: HttpMethod.PATCH,
      endpoint: new EndpointCreator({ endpoint: Modules.Assistant, id: params.id }).generate(),
      input: {
        data: {
          type: Modules.Assistant.name,
          id: params.id,
          attributes: { title: params.title },
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
