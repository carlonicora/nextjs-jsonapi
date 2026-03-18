import { LifeBuoyIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HowTo } from "./data/HowTo";

export const HowToModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "6f975207-0df3-4c0d-b541-ed5dc04487b2",
    pageUrl: "/administration/howtos",
    name: "howtos",
    model: HowTo,
    icon: LifeBuoyIcon,
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion("howtos", [`name`, `description`, `pages`])],
      },
    },
  });
