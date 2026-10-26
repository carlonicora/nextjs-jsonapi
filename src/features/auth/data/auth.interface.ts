import { ApiDataInterface } from "../../../core";
import { SignupSource } from "../../signup-source/signup-source";
import { UserInterface } from "../../user";

export type AuthInput = {
  id?: string;
  email?: string | undefined | null;
  password?: string | undefined;
  name?: string;
  companyName?: string;
  partitaIva?: string;
  codiceFiscale?: string;
  termsAcceptedAt?: string;
  marketingConsent?: boolean;
  marketingConsentAt?: string | null;
  inviteCode?: string;
  referralCode?: string;
  source?: SignupSource;
};

export type AuthQuery = {
  userId?: string;

  tokenCode?: string;
  refreshToken?: string;

  login?: boolean;
  forgot?: boolean;
  code?: string;
  activationCode?: string;
  checkUsername?: string;
};

export interface AuthInterface extends ApiDataInterface {
  get token(): string;
  get refreshToken(): string;
  get user(): UserInterface;
  /** True on the session created by the login that cancelled a pending account deletion. */
  get deletionCancelled(): boolean;
}
