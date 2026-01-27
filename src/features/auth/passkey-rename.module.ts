import { ModuleFactory } from "../../permissions";
import { PasskeyRename } from "./data/passkey-rename";

export const PasskeyRenameModule = (factory: ModuleFactory) =>
  factory({
    name: "passkey-rename",
    pageUrl: "/passkeys-rename",
    model: PasskeyRename,
  });
