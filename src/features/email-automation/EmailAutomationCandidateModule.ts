import { UserPlusIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailAutomationCandidate } from "./data/EmailAutomationCandidate";

export const EmailAutomationCandidateModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "5c3e9a71-2b84-4f06-9d1e-7a4b6c8e0f25",
    pageUrl: undefined,
    name: "email-automation-candidates",
    model: EmailAutomationCandidate,
    icon: UserPlusIcon,
  });
