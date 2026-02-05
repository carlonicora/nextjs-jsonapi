import { ModuleFactory } from "../../permissions";
import { ReferralService } from "./data/ReferralService";

export const ReferralModule = (factory: ModuleFactory) =>
  factory({
    name: "referrals",
    pageUrl: "/referrals",
    model: ReferralService,
  });
