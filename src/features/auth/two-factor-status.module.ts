import { ModuleFactory } from "../../permissions";
import { TwoFactorStatus } from "./data/two-factor-status";

export const TwoFactorStatusModule = (factory: ModuleFactory) =>
  factory({
    name: "two-factor-status",
    pageUrl: "/two-factor-status",
    model: TwoFactorStatus,
  });
