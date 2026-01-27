import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { TotpSetupInterface } from "./totp-setup.interface";

export type TotpSetupInput = {
  id: string;
  name: string;
  accountName: string;
};

export class TotpSetup extends AbstractApiData implements TotpSetupInterface {
  private _qrCodeUri: string = "";
  private _secret: string = "";
  private _authenticatorId: string = "";

  get qrCodeUri(): string {
    return this._qrCodeUri;
  }

  get secret(): string {
    return this._secret;
  }

  get authenticatorId(): string {
    return this._authenticatorId;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._qrCodeUri = data.jsonApi.attributes.qrCodeUri ?? "";
    this._secret = data.jsonApi.attributes.secret ?? "";
    // authenticatorId is the entity ID, not an attribute
    this._authenticatorId = data.jsonApi.id ?? "";
    return this;
  }

  createJsonApi(data: TotpSetupInput) {
    return {
      data: {
        type: "totp-authenticators",
        id: data.id,
        attributes: {
          name: data.name,
          accountName: data.accountName,
        },
      },
    };
  }
}
