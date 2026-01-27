import { AbstractApiData, JsonApiHydratedDataInterface } from "../../../core";
import { TwoFactorStatusInterface } from "./two-factor-status.interface";
import { TotpAuthenticatorInterface } from "./totp-authenticator.interface";
import { PasskeyInterface } from "./passkey.interface";

export class TwoFactorStatus extends AbstractApiData implements TwoFactorStatusInterface {
  private _isEnabled: boolean = false;
  private _preferredMethod?: "totp" | "passkey";
  private _totpAuthenticators: TotpAuthenticatorInterface[] = [];
  private _passkeys: PasskeyInterface[] = [];
  private _backupCodesCount: number = 0;

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  get preferredMethod(): "totp" | "passkey" | undefined {
    return this._preferredMethod;
  }

  get totpAuthenticators(): TotpAuthenticatorInterface[] {
    return this._totpAuthenticators;
  }

  get passkeys(): PasskeyInterface[] {
    return this._passkeys;
  }

  get backupCodesCount(): number {
    return this._backupCodesCount;
  }

  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this._isEnabled = data.jsonApi.attributes.isEnabled ?? false;
    this._preferredMethod = data.jsonApi.attributes.preferredMethod;
    this._backupCodesCount = data.jsonApi.attributes.backupCodesCount ?? 0;
    return this;
  }
}
