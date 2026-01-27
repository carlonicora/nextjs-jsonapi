import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { PasskeyAuthenticationOptionsInterface } from "./passkey-authentication-options.interface";

export type PasskeyAuthenticationOptionsInput = {
  id: string;
};

export class PasskeyAuthenticationOptions extends AbstractApiData implements PasskeyAuthenticationOptionsInterface {
  private _pendingId: string = "";
  private _options: PublicKeyCredentialRequestOptionsJSON = {} as PublicKeyCredentialRequestOptionsJSON;

  get pendingId(): string {
    return this._pendingId;
  }

  get options(): PublicKeyCredentialRequestOptionsJSON {
    return this._options;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._pendingId = data.jsonApi.attributes.pendingId ?? this.id ?? "";
    this._options = data.jsonApi.attributes.options ?? {};
    return this;
  }

  createJsonApi(data: PasskeyAuthenticationOptionsInput) {
    return {
      data: {
        type: "passkey-authentication-options",
        id: data.id,
        attributes: {},
      },
    };
  }
}
