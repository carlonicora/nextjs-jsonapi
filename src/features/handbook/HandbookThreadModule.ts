import { MessagesSquareIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HandbookThread } from "./data/HandbookThread";

/**
 * A persisted handbook conversation.
 *
 * It carries no `pageUrl`: a thread is selected inside the ask surface
 * (`/administration/handbook/chat`), never routed to on its own, and a
 * `pageUrl` here would add a phantom entry to the RBAC path map.
 *
 * `lists` deliberately narrows to the title — the sidebar renders nothing else,
 * and side-loading every message of every thread into the list payload is what
 * the single-resource endpoint is for.
 */
export const HandbookThreadModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "aea692c4-7163-49bd-9ddc-1052cc06fa14",
    name: "handbookthreads",
    model: HandbookThread,
    icon: MessagesSquareIcon,
    identifier: ["title"],
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion("handbookthreads", ["title"])],
      },
    },
  });
