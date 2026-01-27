import { ApiDataInterface } from "../../../core";

export interface TotpAuthenticatorInterface extends ApiDataInterface {
  get name(): string;
  get verified(): boolean;
  get lastUsedAt(): Date | undefined;
}
