import { ModuleFactory } from "../../permissions";
import { TotpSetup } from "./data/totp-setup";

export const TotpSetupModule = (factory: ModuleFactory) =>
  factory({
    name: "totp-setup",
    pageUrl: "/totp-setup",
    model: TotpSetup,
  });
