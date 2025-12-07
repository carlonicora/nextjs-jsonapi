import { ModuleFactory } from "../../permissions";
import { Role } from "./data/role";

export const RoleModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/roles",
    name: "roles",
    model: Role,
    moduleId: "9f6416e6-7b9b-4e1a-a99f-833191eca8a9",
  });
