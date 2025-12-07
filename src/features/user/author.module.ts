import { ModuleFactory } from "../../permissions";
import { User } from "./data";

export const AuthorModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/authors",
    name: "authors",
    model: User,
    moduleId: "04cfc677-0fd2-4f5e-adf4-2483a00c0277",
  });
