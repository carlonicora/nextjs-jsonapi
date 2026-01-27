import { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";
import { ApiDataInterface } from "../../../core";

export interface PasskeyAuthenticationOptionsInterface extends ApiDataInterface {
  get pendingId(): string;
  get options(): PublicKeyCredentialRequestOptionsJSON;
}
