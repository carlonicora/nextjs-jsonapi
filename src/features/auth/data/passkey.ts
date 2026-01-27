import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { PasskeyInterface } from "./passkey.interface";

export class Passkey extends AbstractApiData implements PasskeyInterface {
  private _name: string = "";
  private _credentialId: string = "";
  private _deviceType: string = "";
  private _backedUp: boolean = false;
  private _lastUsedAt?: Date;

  get name(): string {
    return this._name;
  }

  get credentialId(): string {
    return this._credentialId;
  }

  get deviceType(): string {
    return this._deviceType;
  }

  get backedUp(): boolean {
    return this._backedUp;
  }

  get lastUsedAt(): Date | undefined {
    return this._lastUsedAt;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._name = data.jsonApi.attributes.name ?? "";
    this._credentialId = data.jsonApi.attributes.credentialId ?? "";
    this._deviceType = data.jsonApi.attributes.deviceType ?? "";
    this._backedUp = data.jsonApi.attributes.backedUp ?? false;
    this._lastUsedAt = data.jsonApi.attributes.lastUsedAt ? new Date(data.jsonApi.attributes.lastUsedAt) : undefined;
    return this;
  }
}
