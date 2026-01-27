export interface TwoFactorChallengeInterface {
  get pendingToken(): string;
  get availableMethods(): ("totp" | "passkey" | "backup")[];
  get expiresAt(): Date;
}
