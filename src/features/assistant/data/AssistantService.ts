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

  /**
   * Lists threads. `boundType`/`boundId` narrow the list to the threads bound
   * to one resource (e.g. a campaign), so a scoped surface never shows the
   * user's unrelated threads.
   */
  static async findMany(
    params: { fetchAll?: boolean; boundType?: string; boundId?: string } = {},
  ): Promise<AssistantInterface[]> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Assistant });
    if (params.fetchAll) endpoint.addAdditionalParam("fetchAll", "true");
    if (params.boundType) endpoint.addAdditionalParam("boundType", params.boundType);
    if (params.boundId) endpoint.addAdditionalParam("boundId", params.boundId);
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
   * Creates an assistant whose first turn runs on the operator engine
   * (durable checkpointing + approval gates). Mirrors `create()` against the
   * standalone operator module's create route (`POST operator`).
   */
  static async createOperator(params: AssistantInput): Promise<AssistantInterface> {
    return this.callApi({
      type: Modules.Assistant,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: "operator" }).generate(),
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
    /** BlockNote document. Serialised by the model into `content`; never its own attribute. */
    contentBlocks?: unknown[];
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
        contentBlocks: params.contentBlocks,
      }),
      overridesJsonApiCreation: true,
    });
  }

  /**
   * Operator-engine variant of `appendMessage()`. Targets
   * `POST operator/:assistantId/assistant-messages`; the turn may freeze on a
   * destructive tool call, in which case the returned list ends with an
   * `approval-request` assistant message linked to a pending AssistantAction.
   */
  static async appendMessageOperator(params: {
    assistantId: string;
    content: string;
    /** BlockNote document. Serialised by the model into `content`; never its own attribute. */
    contentBlocks?: unknown[];
  }): Promise<AssistantMessageInterface[]> {
    const message = new AssistantMessage();
    return this.callApi<AssistantMessageInterface[]>({
      type: Modules.AssistantMessage,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: "operator",
        id: params.assistantId,
        childEndpoint: Modules.AssistantMessage,
      }).generate(),
      input: message.createAppendMessageJsonApi({
        content: params.content,
        contentBlocks: params.contentBlocks,
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
