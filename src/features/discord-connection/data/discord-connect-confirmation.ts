import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import {
  DiscordConnectConfirmationInput,
  DiscordConnectConfirmationInterface,
  DiscordConnectResult,
} from "./discord-connect-confirmation.interface";

const RESULTS: readonly DiscordConnectResult[] = ["connected", "taken", "already", "failed"];

export class DiscordConnectConfirmation extends AbstractApiData implements DiscordConnectConfirmationInterface {
  private _result: DiscordConnectResult = "failed";
  private _discordName?: string;

  get result(): DiscordConnectResult {
    return this._result;
  }

  get discordName(): string | undefined {
    return this._discordName;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._result = RESULTS.includes(attributes.result) ? attributes.result : "failed";
    this._discordName = attributes.discordName ?? undefined;

    return this;
  }

  createJsonApi(data: DiscordConnectConfirmationInput) {
    const response: any = {
      data: {
        type: Modules.DiscordConnectConfirmation.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    return response;
  }
}
