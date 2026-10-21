import { MailIcon } from "lucide-react";
import { createJsonApiInclusion } from "../../core";
import { ModuleFactory } from "../../permissions";
import { EmailAutomation } from "./data/EmailAutomation";

export const EmailAutomationModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "3f6c1a2e-7b94-4d1e-8c55-9a0b2e4f6d71",
    pageUrl: "/administration/email-automations",
    name: "email-automations",
    model: EmailAutomation,
    icon: MailIcon,
    inclusions: {
      lists: {
        fields: [
          createJsonApiInclusion("email-automations", [
            "name",
            "trigger",
            "exitTrigger",
            "replyTo",
            "isActive",
            "stepCount",
            "activeCount",
            "completedCount",
            "unsubscribedCount",
          ]),
        ],
      },
    },
  });
