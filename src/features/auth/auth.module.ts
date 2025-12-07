import { ModuleFactory } from "../../permissions";
import { Auth } from ".";

export const AuthModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/auth",
    name: "auth",
    model: Auth,
  });
