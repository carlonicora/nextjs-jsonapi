import { ModuleFactory } from "../../permissions";
import { PasskeyRegistrationOptions } from "./data/passkey-registration-options";

export const PasskeyRegistrationOptionsModule = (factory: ModuleFactory) =>
  factory({
    name: "passkey-registration-options",
    pageUrl: "/passkeys",
    model: PasskeyRegistrationOptions,
  });
