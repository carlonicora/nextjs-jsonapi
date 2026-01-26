import { ModuleFactory } from "../../permissions";
import { WaitlistStats } from "./data/waitlist-stats";

export const WaitlistStatsModule = (factory: ModuleFactory) =>
  factory({
    name: "waitlist-stats",
    model: WaitlistStats,
  });
