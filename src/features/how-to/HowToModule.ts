import { HowTo } from "@/features/essentials/how-to/data/HowTo";
import { createJsonApiInclusion } from "@carlonicora/nextjs-jsonapi/core";
import { ModuleFactory } from "@carlonicora/nextjs-jsonapi/core";
import { FileTextIcon } from "lucide-react";

export const HowToModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/howtos",
    name: "howTos",
    model: HowTo,
    moduleId: "f1a2b3c4-d5e6-7890-abcd-ef1234567890",
    icon: FileTextIcon,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("howtos", [`name`, `tldr`, `description`, `pages`, `aiStatus`]),
          createJsonApiInclusion("users", [`name`, `avatar`]),
        ],
      },
    },
  });
