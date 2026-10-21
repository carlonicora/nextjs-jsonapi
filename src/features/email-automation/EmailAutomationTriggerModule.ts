import { ZapIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailAutomationTrigger } from "./data/EmailAutomationTrigger";

export const EmailAutomationTriggerModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: undefined,
    name: "email-automation-triggers",
    model: EmailAutomationTrigger,
    icon: ZapIcon,
  });
