import { ApiDataInterface } from "../../../core";

export interface PendingRegistrationInterface extends ApiDataInterface {
  get name(): string;
  get email(): string;
  get avatar(): string | undefined;
  get provider(): string;
  get hasPass(): boolean;
  get emailInUse(): boolean;
}
