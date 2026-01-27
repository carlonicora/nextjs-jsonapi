import { ApiDataInterface } from "../../../core";

export interface TwoFactorChallengeInterface extends ApiDataInterface {
  get pendingToken(): string;
  get availableMethods(): ("totp" | "passkey" | "backup")[];
  get expiresAt(): Date;
}
