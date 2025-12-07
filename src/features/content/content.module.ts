import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { Content } from ".";

export const ContentModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/contents",
    name: "contents",
    model: Content,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("content", [`name`, `tldr`, `abstract`, `aiStatus`, `relevance`]),
          createJsonApiInclusion("users", [`name`, `avatar`]),
          createJsonApiInclusion("topics", [`name`]),
          createJsonApiInclusion("expertises", [`name`]),
        ],
      },
    },
  });
