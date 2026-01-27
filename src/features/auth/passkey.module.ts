import { ModuleFactory } from "../../permissions";
import { Passkey } from "./data/passkey";

export const PasskeyModule = (factory: ModuleFactory) =>
  factory({
    name: "passkeys",
    pageUrl: "/passkeys",
    model: Passkey,
  });
