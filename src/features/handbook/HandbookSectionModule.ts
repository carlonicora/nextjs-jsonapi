import { LibraryIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HandbookSection } from "./data/HandbookSection";

/**
 * One top-level directory of the documentation tree. Like the thread message,
 * it has no `pageUrl` — a section has no page of its own; it is a heading on
 * the contents surface and nothing more.
 */
export const HandbookSectionModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "6b0a2f74-1c53-4a0e-9c1d-2e7b4a9d6f30",
    name: "handbooksections",
    model: HandbookSection,
    icon: LibraryIcon,
    inclusions: {
      lists: {
        // `HandbookSectionService.findMany` is the ONLY read of this resource and
        // it limits to these fields, so the translated halves have to be here:
        // without them every section heading on the contents page and in the
        // reader's navigator would stay English however good the translation is.
        fields: [
          createJsonApiInclusion("handbooksections", [
            "key",
            "title",
            "displayTitle",
            "summary",
            "displaySummary",
            "order",
          ]),
        ],
      },
    },
  });
