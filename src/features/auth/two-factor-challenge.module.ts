import { ModuleFactory } from "../../permissions";
import { TwoFactorChallenge } from "./data/two-factor-challenge";

export const TwoFactorChallengeModule = (factory: ModuleFactory) =>
  factory({
    name: "two-factor-challenge",
    pageUrl: "/two-factor-challenge",
    model: TwoFactorChallenge,
  });
