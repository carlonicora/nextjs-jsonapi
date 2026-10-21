import { MailIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailAutomationStep } from "./data/EmailAutomationStep";

export const EmailAutomationStepModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: undefined,
    name: "email-automation-steps",
    model: EmailAutomationStep,
    icon: MailIcon,
  });
