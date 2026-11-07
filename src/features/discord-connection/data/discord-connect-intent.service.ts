import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import { DiscordConnectIntentInput, DiscordConnectIntentInterface } from "./discord-connect-intent.interface";

export class DiscordConnectIntentService extends AbstractService {
  /**
   * POST a Connect Discord intent for the signed-in user. Sent with
   * `credentials: "include"` so the browser stores the API's HttpOnly
   * `discord_connect` cookie that binds the intent to this browser.
   */
  static async create(params: DiscordConnectIntentInput): Promise<DiscordConnectIntentInterface> {
    return this.callApi<DiscordConnectIntentInterface>({
      type: Modules.DiscordConnectIntent,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.DiscordConnectIntent }).generate(),
      input: params,
      credentials: "include",
      suppressGlobalError: true,
    });
  }
}
