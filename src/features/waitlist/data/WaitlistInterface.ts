import { ApiDataInterface } from "../../../core";
import { SignupSource } from "../../signup-source/signup-source";

export type WaitlistStatus = "pending" | "confirmed" | "invited" | "registered";

export type WaitlistInput = {
  id: string;
  email: string;
  gdprConsent: boolean;
  gdprConsentAt: string; // ISO timestamp when consent was given
  marketingConsent?: boolean;
  marketingConsentAt?: string; // ISO timestamp when marketing consent was given
  questionnaire?: Record<string, any>; // Object for form handling, will be JSON.stringify'd by service
  source?: SignupSource;
};

export interface WaitlistInterface extends ApiDataInterface {
  get email(): string;
  get gdprConsent(): boolean;
  get gdprConsentAt(): string;
  get marketingConsent(): boolean | undefined;
  get marketingConsentAt(): string | undefined;
  get questionnaire(): Record<string, any> | undefined; // the API sends the answers already parsed
  get status(): WaitlistStatus;
  get confirmedAt(): string | undefined;
  get invitedAt(): string | undefined;
  get registeredAt(): string | undefined;
  get sourceRef(): string | undefined;
  get sourceUtmSource(): string | undefined;
  get sourceUtmMedium(): string | undefined;
  get sourceUtmCampaign(): string | undefined;
  get sourceReferrer(): string | undefined;
  get sourceLandingPath(): string | undefined;
  // createdAt and updatedAt inherited from ApiDataInterface
}

export interface InviteValidation {
  email: string;
  valid: boolean;
}
