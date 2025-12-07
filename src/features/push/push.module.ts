import { ModuleFactory } from "../../permissions";
import { Push } from "./data/push";

export const PushModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/push",
    name: "push",
    model: Push,
    moduleId: "",
  });
