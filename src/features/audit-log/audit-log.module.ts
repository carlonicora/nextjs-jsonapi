import { ModuleFactory } from "../../permissions";
import { AuditLog } from "./data";

export const AuditLogModule = (factory: ModuleFactory) =>
  factory({
    name: "audit-logs",
    pageUrl: "/audit-logs",
    model: AuditLog,
    moduleId: "b7e2f4a1-9c3d-4e8b-a6d5-2f1c8e7b3a90",
  });
