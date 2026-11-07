import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { DiscordConnectionInterface } from "./discord-connection.interface";

export class DiscordConnection extends AbstractApiData implements DiscordConnectionInterface {
  private _connected: boolean = false;
  private _discordName?: string;

  get connected(): boolean {
    return this._connected;
  }

  get discordName(): string | undefined {
    return this._discordName;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);

    const attributes = data.jsonApi.attributes ?? {};

    this._connected = attributes.connected === true;
    this._discordName = attributes.discordName ?? undefined;

    return this;
  }

  /** Read-only resource: the body only identifies the user. */
  createJsonApi(data: { id: string }) {
    const response: any = {
      data: {
        type: Modules.DiscordConnection.name,
        id: data.id,
        attributes: {},
        relationships: {},
      },
      included: [],
    };

    return response;
  }
}
