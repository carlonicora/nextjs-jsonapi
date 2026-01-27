import { ModuleFactory } from "../../permissions";
import { TwoFactorEnable } from "./data/two-factor-enable";

export const TwoFactorEnableModule = (factory: ModuleFactory) =>
  factory({
    name: "two-factor-enable",
    pageUrl: "/two-factor-enable",
    model: TwoFactorEnable,
  });
