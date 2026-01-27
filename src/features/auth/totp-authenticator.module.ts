import { ModuleFactory } from "../../permissions";
import { TotpAuthenticator } from "./data/totp-authenticator";

export const TotpAuthenticatorModule = (factory: ModuleFactory) =>
  factory({
    name: "totp-authenticators",
    pageUrl: "/totp-authenticators",
    model: TotpAuthenticator,
  });
