import { UsersIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailBlastAudience } from "./data/EmailBlastAudience";

export const EmailBlastAudienceModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "e2b6d8f0-4c19-4a7e-8d35-6f9a0c2b7e14",
    pageUrl: undefined,
    name: "email-blast-audiences",
    model: EmailBlastAudience,
    icon: UsersIcon,
  });
