import { AbstractService, EndpointCreator, HttpMethod, Modules } from "../../../core";
import {
  DiscordConnectConfirmationInput,
  DiscordConnectConfirmationInterface,
} from "./discord-connect-confirmation.interface";

export class DiscordConnectConfirmationService extends AbstractService {
  /**
   * POST the confirmation token from the Discord return address. Links Discord
   * only when the signed-in user created the intent; the result says what happened.
   */
  static async create(params: DiscordConnectConfirmationInput): Promise<DiscordConnectConfirmationInterface> {
    return this.callApi<DiscordConnectConfirmationInterface>({
      type: Modules.DiscordConnectConfirmation,
      method: HttpMethod.POST,
      endpoint: new EndpointCreator({ endpoint: Modules.DiscordConnectConfirmation }).generate(),
      input: params,
      suppressGlobalError: true,
    });
  }
}
