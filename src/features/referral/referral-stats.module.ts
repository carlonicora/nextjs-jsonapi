import { ModuleFactory } from "../../permissions";
import { ReferralStats } from "./data/ReferralStats";

export const ReferralStatsModule = (factory: ModuleFactory) =>
  factory({
    name: "referral-stats",
    pageUrl: "/referral-stats",
    model: ReferralStats,
  });
