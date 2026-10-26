import { ModuleFactory } from "../../permissions";
import { PendingRegistration } from "./data/pending-registration";

export const PendingRegistrationModule = (factory: ModuleFactory) =>
  factory({
    name: "pending-registrations",
    pageUrl: "/auth/consent",
    model: PendingRegistration,
  });
