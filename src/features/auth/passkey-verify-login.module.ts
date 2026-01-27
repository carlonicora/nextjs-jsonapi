import { ModuleFactory } from "../../permissions";
import { PasskeyVerifyLogin } from "./data/passkey-verify-login";

export const PasskeyVerifyLoginModule = (factory: ModuleFactory) =>
  factory({
    name: "passkey-verify-login",
    pageUrl: "/passkeys",
    model: PasskeyVerifyLogin,
  });
