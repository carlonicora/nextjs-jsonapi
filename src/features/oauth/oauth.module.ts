import { ModuleFactory } from "../../permissions";
import { OAuthClient } from "./data/oauth";

export const OAuthModule = (factory: ModuleFactory) =>
  factory({
    pageUrl: "/oauth",
    name: "oauth-clients",
    model: OAuthClient,
  });
