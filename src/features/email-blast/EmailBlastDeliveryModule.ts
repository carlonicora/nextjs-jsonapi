import { MailIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { EmailBlastDelivery } from "./data/EmailBlastDelivery";

export const EmailBlastDeliveryModule = (factory: ModuleFactory) =>
  factory({
    moduleId: "c47e9b1d-2a5f-4c83-9e60-1b7d4a3f8e25",
    pageUrl: undefined,
    name: "email-blast-deliveries",
    model: EmailBlastDelivery,
    icon: MailIcon,
  });
