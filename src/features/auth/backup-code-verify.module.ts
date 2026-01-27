import { ModuleFactory } from "../../permissions";
import { BackupCodeVerify } from "./data/backup-code-verify";

export const BackupCodeVerifyModule = (factory: ModuleFactory) =>
  factory({
    name: "backup-codes",
    pageUrl: "/backup-codes",
    model: BackupCodeVerify,
  });
