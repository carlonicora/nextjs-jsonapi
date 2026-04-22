import { BotIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { Assistant } from "./data/Assistant";

export const AssistantModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/assistants",
    name: "assistants",
    model: Assistant,
    moduleId: "2b39fd68-6a41-4f73-a2d0-4c8e8e3f9a42",
    icon: BotIcon,
    identifier: ["title"],
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion("assistants", [`title`])],
      },
    },
  });
