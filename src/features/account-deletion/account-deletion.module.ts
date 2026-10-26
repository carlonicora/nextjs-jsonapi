import { ModuleFactory } from "../../permissions";
import { AccountDeletion } from "./data/account-deletion";

/**
 * Opt-in: an app that turns on `accountDeletion` in its API adds
 * `AccountDeletion: AccountDeletionModule(moduleFactory)` to its bootstrapper.
 */
export const AccountDeletionModule = (factory: ModuleFactory) =>
  factory({
    name: "account-deletions",
    pageUrl: "/account-deletions",
    model: AccountDeletion,
  });
