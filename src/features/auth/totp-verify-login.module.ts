import { ModuleFactory } from "../../permissions";
import { TotpVerifyLogin } from "./data/totp-verify-login";

export const TotpVerifyLoginModule = (factory: ModuleFactory) =>
  factory({
    name: "totp-verify-login",
    pageUrl: "/totp-verify-login",
    model: TotpVerifyLogin,
  });
