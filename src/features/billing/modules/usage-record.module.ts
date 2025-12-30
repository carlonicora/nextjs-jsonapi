import { ModuleFactory } from "../../../permissions";
import { UsageRecord } from "../data/UsageRecord";

export const UsageRecordModule = (factory: ModuleFactory) =>
  factory({
    name: "usage-records",
    model: UsageRecord,
    moduleId: "c2e9f4a6-1d7b-4e3a-8f5c-9b2d6a1e7f3c",
  });
