import { WandSparklesIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { Skill } from "./data/Skill";

export const SkillModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "ad3bdb3d-9472-4de8-b080-6046b25118d6",
    pageUrl: "/administration/skills",
    name: "skills",
    model: Skill,
    icon: WandSparklesIcon,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("skills", [
            "name",
            "description",
            "isActive",
            "isGlobal",
            "origin",
            "isEnabled",
            "isHidden",
            "canRestore",
          ]),
        ],
      },
    },
  });
