import { AbstractService, HttpMethod } from "../../../core";
import { EndpointCreator } from "../../../core";
import { Modules } from "../../../core";

export class PushService extends AbstractService {
  static async register(params: { data: any }): Promise<void> {
    const endpoint = new EndpointCreator({ endpoint: Modules.Push });

    await this.callApi({
      type: Modules.Push,
      method: HttpMethod.POST,
      endpoint: endpoint.generate(),
      input: params.data,
      overridesJsonApiCreation: true,
    });
  }
}
