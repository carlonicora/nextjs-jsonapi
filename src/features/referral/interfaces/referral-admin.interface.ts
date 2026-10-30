import { ApiDataInterface } from "../../../core";

/** Report window of the administrative referral page. */
export type ReferralAdminPeriod = "30d" | "90d" | "all";

/** The referrers ranking order the API allowlists. */
export type ReferralAdminSort = "paying" | "signups" | "invites" | "conversion" | "credits";

/** One window (`current` or `previous`) of the headline tiles. */
export interface ReferralAdminSummaryInterface extends ApiDataInterface {
  get window(): string;
  get visits(): number;
  get invitesSent(): number;
  get signups(): number;
  get paying(): number;
  get creditsGiven(): number;
  get sharingCompanies(): number;
  get eligibleCompanies(): number;
}

/** One referrer company in the ranking; the id is the company id. */
export interface ReferralAdminReferrerInterface extends ApiDataInterface {
  get name(): string;
  get email(): string;
  get visits(): number;
  get invitesSent(): number;
  get signupsLink(): number;
  get signupsDirect(): number;
  get paying(): number;
  get creditsEarned(): number;
  get lastInviteAt(): Date | undefined;
}

/** One referral (new account and who brought it); the id is the Referral id. */
export interface ReferralAdminReferralInterface extends ApiDataInterface {
  get name(): string;
  get email(): string;
  get referrerName(): string;
  get referrerEmail(): string;
  get source(): string;
  get status(): string;
  get referredAt(): Date;
  get completedAt(): Date | undefined;
  get tokensAwarded(): number | undefined;
}
