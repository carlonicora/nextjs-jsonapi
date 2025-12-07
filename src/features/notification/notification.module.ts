import { ModuleFactory } from "../../permissions";
import { Notification } from "./data/notification";

export const NotificationModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/notifications",
    name: "notifications",
    model: Notification,
    moduleId: "9259d704-c670-4e77-a3a1-a728ffc5be3d",
  });
