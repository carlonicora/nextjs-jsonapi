import { ApiDataInterface } from "../../../core";

export interface PasskeyInterface extends ApiDataInterface {
  get name(): string;
  get credentialId(): string;
  get deviceType(): string;
  get backedUp(): boolean;
  get lastUsedAt(): Date | undefined;
}
