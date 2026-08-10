import { ShieldCheckIcon } from "lucide-react";
import { ModuleFactory } from "../../permissions";
import { AssistantAction } from "./data/AssistantAction";

export const AssistantActionModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/assistant-actions",
    name: "assistant-actions",
    model: AssistantAction,
    identifier: ["summary"],
    moduleId: "e3c27517-bac0-43cb-adff-cc20c4210c12",
    icon: ShieldCheckIcon,
  });
