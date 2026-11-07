import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { DiscordConnectIntentInput, DiscordConnectIntentInterface } from "./discord-connect-intent.interface";

export class DiscordConnectIntent extends AbstractApiData implements DiscordConnectIntentInterface {
  private _returnPath?: string;
  private _authorizeUrl?: string;

  get returnPath(): string {
    return this._returnPath ?? "/";
  }

  get authorizeUrl(): string | undefined {
    return this._authorizeUrl;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._returnPath = attributes.returnPath;
    this._authorizeUrl = attributes.authorizeUrl ?? undefined;

    return this;
  }

  createJsonApi(data: DiscordConnectIntentInput) {
    const response: any = {
      data: {
        type: Modules.DiscordConnectIntent.name,
        id: data.id,
        attributes: {
          returnPath: data.returnPath,
        },
        relationships: {},
      },
      included: [],
    };

    return response;
  }
}
