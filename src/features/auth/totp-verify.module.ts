import { ModuleFactory } from "../../permissions";
import { TotpVerify } from "./data/totp-verify";

export const TotpVerifyModule = (factory: ModuleFactory) =>
  factory({
    name: "totp-verify",
    pageUrl: "/totp-verify",
    model: TotpVerify,
  });
