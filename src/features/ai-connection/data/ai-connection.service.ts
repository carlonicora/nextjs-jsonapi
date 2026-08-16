import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { AiConnection } from "./ai-connection";
import {
  AiConnectionEnvDefaults,
  AiConnectionInput,
  AiConnectionInterface,
  AiProviderRegistry,
} from "./ai-connection.interface";

export class AiConnectionService extends AbstractService {
  /**
   * Full list plus the editor meta in one round-trip: the list endpoint carries
   * the provider registry and the `.env` defaults as top-level JSON:API `meta`.
   */
  static async listConnections(): Promise<{
    connections: AiConnectionInterface[];
    providerRegistry: AiProviderRegistry;
    envDefaults: AiConnectionEnvDefaults;
  }> {
    const endpoint = new EndpointCreator({ endpoint: Modules.AiConnection });
    endpoint.addAdditionalParam("fetchAll", "true");

    const { data, meta } = await this.callApiWithMeta<AiConnectionInterface[]>({
      type: Modules.AiConnection,
      method: HttpMethod.GET,
      endpoint: endpoint.generate(),
    });

    return {
      connections: data ?? [],
      providerRegistry: (meta?.providerRegistry ?? {}) as AiProviderRegistry,
      envDefaults: (meta?.envDefaults ?? {}) as AiConnectionEnvDefaults,
    };
  }

  /**
   * Create a connection. The optional `companyId` fixes its scope forever.
   */
  static async create(params: AiConnectionInput): Promise<AiConnectionInterface> {
    return this.callApi<AiConnectionInterface>({
      type: Modules.AiConnection,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.AiConnection }).generate(),
      input: params,
    });
  }

  /**
   * Update a connection. Blank/omitted secrets keep the stored values.
   */
  static async update(params: AiConnectionInput): Promise<AiConnectionInterface> {
    return this.callApi<AiConnectionInterface>({
      type: Modules.AiConnection,
      method: HttpMethod.PUT,
      endpoint: new EndpointCreator({ endpoint: Modules.AiConnection, id: params.id }).generate(),
      input: params,
    });
  }

  /**
   * Delete a connection.
   */
  static async delete(params: { id: string }): Promise<void> {
    await this.callApi({
      type: Modules.AiConnection,
      method: HttpMethod.DELETE,
      endpoint: new EndpointCreator({ endpoint: Modules.AiConnection, id: params.id }).generate(),
    });
  }

  /**
   * Reorder one chain: the ordered id list is renumbered 0..n-1 server-side.
   * Dedicated model method + `overridesJsonApiCreation` — the sanctioned
   * pairing, never a hand-built payload here.
   */
  static async reorder(params: { ids: string[] }): Promise<void> {
    const model = new AiConnection();

    await this.callApi({
      type: Modules.AiConnection,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({
        endpoint: Modules.AiConnection,
        childEndpoint: "reorder",
      }).generate(),
      input: model.createReorderJsonApi({ ids: params.ids }),
      overridesJsonApiCreation: true, // OK — the model method provides the structure
    });
  }
}
