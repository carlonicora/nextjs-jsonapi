import { SendIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { EmailBlast } from "./data/EmailBlast";

export const EmailBlastModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "8a1f4c2e-6b3d-4e9a-b7c5-2d0e9f1a6b48",
    pageUrl: "/administration/email-blasts",
    name: "email-blasts",
    model: EmailBlast,
    icon: SendIcon,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("email-blasts", [
            "subject",
            "status",
            "sentAt",
            "recipientCount",
            "sentCount",
            "failedCount",
            "unsubscribedCount",
          ]),
        ],
      },
    },
  });
