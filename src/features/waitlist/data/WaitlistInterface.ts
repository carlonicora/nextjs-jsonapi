import { ApiDataInterface } from "../../../core";

export type WaitlistStatus = "pending" | "confirmed" | "invited" | "registered";

export type WaitlistInput = {
  id: string;
  email: string;
  gdprConsent: boolean;
  gdprConsentAt: string; // ISO timestamp when consent was given
  marketingConsent?: boolean;
  marketingConsentAt?: string; // ISO timestamp when marketing consent was given
  questionnaire?: Record<string, any>; // Object for form handling, will be JSON.stringify'd by service
};

export interface WaitlistInterface extends ApiDataInterface {
  get email(): string;
  get gdprConsent(): boolean;
  get gdprConsentAt(): string;
  get marketingConsent(): boolean | undefined;
  get marketingConsentAt(): string | undefined;
  get questionnaire(): string | undefined; // JSON string from backend
  get status(): WaitlistStatus;
  get confirmedAt(): string | undefined;
  get invitedAt(): string | undefined;
  get registeredAt(): string | undefined;
  // createdAt and updatedAt inherited from ApiDataInterface
}

export interface InviteValidation {
  email: string;
  valid: boolean;
}
