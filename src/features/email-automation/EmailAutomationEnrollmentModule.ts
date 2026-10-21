import { UsersIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailAutomationEnrollment } from "./data/EmailAutomationEnrollment";

export const EmailAutomationEnrollmentModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: undefined,
    name: "email-automation-enrollments",
    model: EmailAutomationEnrollment,
    icon: UsersIcon,
  });
