import { MessageCircleQuestionIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { HandbookThreadMessage } from "./data/HandbookThreadMessage";

/**
 * One turn of a handbook conversation. Like the thread, it has no `pageUrl` —
 * a message is only ever read as part of its thread.
 */
export const HandbookThreadMessageModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "bef354f2-70e1-4f4f-9953-10d3d74cad0c",
    name: "handbookthreadmessages",
    model: HandbookThreadMessage,
    icon: MessageCircleQuestionIcon,
    inclusions: {
      lists: {
        fields: [createJsonApiInclusion("handbookthreadmessages", ["role", "content", "position", "sources"])],
      },
    },
  });
