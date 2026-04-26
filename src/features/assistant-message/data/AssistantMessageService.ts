import { AbstractService, EndpointCreator, HttpMethod, Modules, NextRef } from "../../../core";
import { AssistantMessageInterface } from "./AssistantMessageInterface";

export class AssistantMessageService extends AbstractService {
  static async findByAssistant(params: { assistantId: string; next?: NextRef }): Promise<AssistantMessageInterface[]> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.Assistant,
      id: params.assistantId,
      childEndpoint: Modules.AssistantMessage,
    });
    if (Modules.AssistantMessage.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.AssistantMessage.inclusions.lists.fields);
    if (Modules.AssistantMessage.inclusions?.lists?.types)
      endpoint.limitToType(Modules.AssistantMessage.inclusions.lists.types);
    return this.callApi({
      type: Modules.AssistantMessage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
      next: params.next,
    });
  }

  static async findOne(params: { id: string }): Promise<AssistantMessageInterface> {
    const endpoint = new EndpointCreator({
      endpoint: Modules.AssistantMessage,
      id: params.id,
    });
    if (Modules.AssistantMessage.inclusions?.lists?.fields)
      endpoint.limitToFields(Modules.AssistantMessage.inclusions.lists.fields);
    if (Modules.AssistantMessage.inclusions?.lists?.types)
      endpoint.limitToType(Modules.AssistantMessage.inclusions.lists.types);
    return this.callApi<AssistantMessageInterface>({
      type: Modules.AssistantMessage,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });
  }

  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.AssistantMessage,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({
        endpoint: Modules.AssistantMessage,
        id: params.id,
      }).generate(),
    });
  }
}
