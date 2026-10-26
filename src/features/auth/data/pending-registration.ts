import { AbstractApiData, JsonApiHydratedDataInterface, Modules } from "../../../core";
import { PendingRegistrationInterface } from "./pending-registration.interface";

export class PendingRegistration extends AbstractApiData implements PendingRegistrationInterface {
  private _name?: string;
  private _email?: string;
  private _avatar?: string;
  private _provider?: string;
  private _hasPass?: boolean;
  private _emailInUse?: boolean;

  get name(): string {
    return this._name ?? "";
  }

  get email(): string {
    return this._email ?? "";
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get provider(): string {
    return this._provider ?? "";
  }

  get hasPass(): boolean {
    return this._hasPass ?? false;
  }

  get emailInUse(): boolean {
    return this._emailInUse ?? false;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._name = data.jsonApi.attributes.name;
    this._email = data.jsonApi.attributes.email;
    this._avatar = data.jsonApi.attributes.avatar ?? undefined;
    this._provider = data.jsonApi.attributes.provider;
    this._hasPass = data.jsonApi.attributes.hasPass ?? false;
    this._emailInUse = data.jsonApi.attributes.emailInUse ?? false;
    return this;
  }

  /** Read-only resource: the payload only identifies it. */
  createJsonApi(data: { id: string }) {
    return {
      data: {
        type: Modules.PendingRegistration.name,
        id: data.id,
        attributes: {},
      },
    };
  }
}
