import { PublicKeyCredentialCreationOptionsJSON } from "@simplewebauthn/browser";
import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";

export type PasskeyRegistrationOptionsInput = {
  id: string;
  userName: string;
  userDisplayName?: string;
};

export interface PasskeyRegistrationOptionsInterface {
  pendingId: string;
  options: PublicKeyCredentialCreationOptionsJSON;
}

export class PasskeyRegistrationOptions extends AbstractApiData implements PasskeyRegistrationOptionsInterface {
  private _pendingId: string = "";
  private _options: PublicKeyCredentialCreationOptionsJSON = {} as PublicKeyCredentialCreationOptionsJSON;

  get pendingId(): string {
    return this._pendingId;
  }

  get options(): PublicKeyCredentialCreationOptionsJSON {
    return this._options;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._pendingId = data.jsonApi.attributes.pendingId ?? this.id;
    this._options = data.jsonApi.attributes.options ?? {};
    return this;
  }

  createJsonApi(data: PasskeyRegistrationOptionsInput) {
    return {
      data: {
        type: "passkeys",
        id: data.id,
        attributes: {
          userName: data.userName,
          userDisplayName: data.userDisplayName,
        },
      },
    };
  }
}
