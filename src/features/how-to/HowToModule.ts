import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HowTo } from "./data/HowTo";

export const HowToModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/howtos",
    name: "howtos",
    model: HowTo,
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion("howtos", [`name`, `description`, `pages`])],
      },
    },
  });
