import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { DiscordConnectionInterface } from "./discord-connection.interface";

export class DiscordConnectionService extends AbstractService {
  /**
   * GET whether the user has Discord attached. `params.id` must be the signed-in
   * user's id; any other id answers 404.
   */
  static async findById(params: { id: string }): Promise<DiscordConnectionInterface> {
    return this.callApi<DiscordConnectionInterface>({
      type: Modules.DiscordConnection,
      method: HttpMethod.GET,
      endpoint: new EndpointCreator({ endpoint: Modules.DiscordConnection, id: params.id }).generate(),
      suppressGlobalError: true,
    });
  }
}
