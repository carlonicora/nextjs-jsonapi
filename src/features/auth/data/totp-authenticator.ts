import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { TotpAuthenticatorInterface } from "./totp-authenticator.interface";

export class TotpAuthenticator extends AbstractApiData implements TotpAuthenticatorInterface {
  private _name: string = "";
  private _verified: boolean = false;
  private _lastUsedAt?: Date;

  get name(): string {
    return this._name;
  }

  get verified(): boolean {
    return this._verified;
  }

  get lastUsedAt(): Date | undefined {
    return this._lastUsedAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._name = data.jsonApi.attributes.name ?? "";
    this._verified = data.jsonApi.attributes.verified ?? false;
    this._lastUsedAt = data.jsonApi.attributes.lastUsedAt ? new Date(data.jsonApi.attributes.lastUsedAt) : undefined;
    return this;
  }
}
