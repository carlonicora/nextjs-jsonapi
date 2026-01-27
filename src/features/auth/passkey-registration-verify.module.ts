import { ModuleFactory } from "../../permissions";
import { PasskeyRegistrationVerify } from "./data/passkey-registration-verify";

export const PasskeyRegistrationVerifyModule = (factory: ModuleFactory) =>
  factory({
    name: "passkey-registration-verify",
    pageUrl: "/passkeys",
    model: PasskeyRegistrationVerify,
  });
