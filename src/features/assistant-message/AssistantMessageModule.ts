import { MessageSquareIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { AssistantMessage } from "./data/AssistantMessage";

export const AssistantMessageModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/assistant-messages",
    name: "assistant-messages",
    model: AssistantMessage,
    moduleId: "5b2e10e4-3a01-4a59-9f0f-3c4a6c6a8e11",
    icon: MessageSquareIcon,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("assistant-messages", [
            `role`,
            `content`,
            `position`,
            `suggestedQuestions`,
            `inputTokens`,
            `outputTokens`,
            `references`,
          ]),
        ],
      },
    },
  });
