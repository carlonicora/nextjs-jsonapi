import { ModuleFactory } from "../../permissions";
import { Waitlist } from "./data/Waitlist";

export const WaitlistModule = (factory: ModuleFactory) =>
  factory({
    name: "waitlists",
    pageUrl: "/waitlists",
    model: Waitlist,
  });
