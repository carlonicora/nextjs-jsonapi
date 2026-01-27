import { ModuleFactory } from "../../permissions";
import { PasskeyAuthenticationOptions } from "./data/passkey-authentication-options";

export const PasskeyAuthenticationOptionsModule = (factory: ModuleFactory) =>
  factory({
    name: "passkey-authentication-options",
    pageUrl: "/passkeys",
    model: PasskeyAuthenticationOptions,
  });
