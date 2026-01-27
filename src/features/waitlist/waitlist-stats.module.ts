import { ModuleFactory } from "../../permissions";
import { WaitlistStats } from "./data/waitlist-stats";

export const WaitlistStatsModule = (factory: ModuleFactory) =>
  factory({
    name: "waitlist-stats",
    pageUrl: "/waitlist-stats",
    model: WaitlistStats,
  });
