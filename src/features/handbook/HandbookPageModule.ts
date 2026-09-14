import { BookOpenIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HandbookPage } from "./data/HandbookPage";

export const HandbookPageModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "b1f1c2d6-6a0e-4e93-9b6d-3f5f4a2c81e7",
    pageUrl: "/administration/handbook",
    name: "handbookpages",
    model: HandbookPage,
    icon: BookOpenIcon,
    inclusions: {
      lists: {
        // `content` is deliberately omitted: the list renders titles and
        // status, and a thousand pages of markdown do not belong in a list
        // payload. `section`, `order` and `summary` are the index fields the
        // contents page groups, orders and describes pages by, so they are the
        // one part of the payload the list surface cannot do without.
        //
        // `displayTitle` and `displaySummary` are the translated halves of the
        // two strings the contents page prints, and a sparse fieldset that
        // omitted them would leave every row in English. `displayContent` is
        // NOT here for the same reason `content` is not: it is the whole
        // markdown body, and it belongs to the detail read alone.
        fields: [
          createJsonApiInclusion("handbookpages", [
            "path",
            "title",
            "displayTitle",
            "section",
            "order",
            "summary",
            "displaySummary",
            "wordCount",
            "aiStatus",
          ]),
        ],
      },
    },
  });
