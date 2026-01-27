import { ApiDataInterface } from "../../../core";
import { TotpAuthenticatorInterface } from "./totp-authenticator.interface";
import { PasskeyInterface } from "./passkey.interface";

export interface TwoFactorStatusInterface extends ApiDataInterface {
  get isEnabled(): boolean;
  get preferredMethod(): "totp" | "passkey" | undefined;
  get totpAuthenticators(): TotpAuthenticatorInterface[];
  get passkeys(): PasskeyInterface[];
  get backupCodesCount(): number;
}
