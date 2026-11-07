import { ModuleFactory } from "../../permissions";
import { DiscordConnectConfirmation } from "./data/discord-connect-confirmation";
import { DiscordConnectIntent } from "./data/discord-connect-intent";
import { DiscordConnection } from "./data/discord-connection";

// Bootstrapper key: `DiscordConnection: DiscordConnectionModule(moduleFactory)`.
export const DiscordConnectionModule = (factory: ModuleFactory) =>
  factory({
    name: "discord-connections",
    pageUrl: "/settings",
    model: DiscordConnection,
  });

// Bootstrapper key: `DiscordConnectIntent: DiscordConnectIntentModule(moduleFactory)`.
export const DiscordConnectIntentModule = (factory: ModuleFactory) =>
  factory({
    name: "discord-connect-intents",
    pageUrl: "/settings",
    model: DiscordConnectIntent,
  });

// Bootstrapper key: `DiscordConnectConfirmation: DiscordConnectConfirmationModule(moduleFactory)`.
export const DiscordConnectConfirmationModule = (factory: ModuleFactory) =>
  factory({
    name: "discord-connect-confirmations",
    pageUrl: "/settings",
    model: DiscordConnectConfirmation,
  });
