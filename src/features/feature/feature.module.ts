import { ModuleFactory } from "../../permissions";
import { Feature } from "./data/feature";

export const FeatureModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/features",
    name: "features",
    model: Feature,
    moduleId: "025fdd23-2803-4360-9fd9-eaa3612c2e23",
  });
