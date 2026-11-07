import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { DiscordConnectConfirmation } from "../discord-connect-confirmation";
import { DiscordConnectIntent } from "../discord-connect-intent";
import { DiscordConnection } from "../discord-connection";

// createJsonApi() resolves Modules.X through the real ModuleRegistry,
// which is shared across test files in a worker: register only when absent.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("DiscordConnection", { name: "discord-connections", model: DiscordConnection } as any);
  registerIfAbsent("DiscordConnectIntent", { name: "discord-connect-intents", model: DiscordConnectIntent } as any);
  registerIfAbsent("DiscordConnectConfirmation", {
    name: "discord-connect-confirmations",
    model: DiscordConnectConfirmation,
  } as any);
});

describe("DiscordConnection", () => {
  it("rehydrates connected and discordName", () => {
    const model = new DiscordConnection().rehydrate({
      jsonApi: { type: "discord-connections", id: "u-1", attributes: { connected: true, discordName: "carlo" } },
      included: [],
    } as any);

    expect(model.id).toBe("u-1");
    expect(model.connected).toBe(true);
    expect(model.discordName).toBe("carlo");
  });

  it("defaults connected to false and discordName to undefined", () => {
    const model = new DiscordConnection().rehydrate({
      jsonApi: { type: "discord-connections", id: "u-1", attributes: {} },
      included: [],
    } as any);

    expect(model.connected).toBe(false);
    expect(model.discordName).toBeUndefined();
  });

  it("DiscordConnection createJsonApi has the canonical shape", () => {
    expect(new DiscordConnection().createJsonApi({ id: "u-1" })).toEqual({
      data: { type: "discord-connections", id: "u-1", attributes: {}, relationships: {} },
      included: [],
    });
  });
});

describe("DiscordConnectIntent", () => {
  it("rehydrates the intent returnPath and authorizeUrl", () => {
    const model = new DiscordConnectIntent().rehydrate({
      jsonApi: {
        type: "discord-connect-intents",
        id: "i-1",
        attributes: {
          returnPath: "/settings",
          authorizeUrl: "http://api.test/discord-connect-intents/i-1/authorize",
        },
      },
      included: [],
    } as any);

    expect(model.returnPath).toBe("/settings");
    expect(model.authorizeUrl).toBe("http://api.test/discord-connect-intents/i-1/authorize");
  });

  it("DiscordConnectIntent createJsonApi sends the returnPath", () => {
    expect(new DiscordConnectIntent().createJsonApi({ id: "i-1", returnPath: "/settings" })).toEqual({
      data: { type: "discord-connect-intents", id: "i-1", attributes: { returnPath: "/settings" }, relationships: {} },
      included: [],
    });
  });
});

describe("DiscordConnectConfirmation", () => {
  it("DiscordConnectConfirmation createJsonApi identifies the token", () => {
    expect(new DiscordConnectConfirmation().createJsonApi({ id: "t-1" })).toEqual({
      data: { type: "discord-connect-confirmations", id: "t-1", attributes: {}, relationships: {} },
      included: [],
    });
  });

  it("rehydrates result and discordName", () => {
    const model = new DiscordConnectConfirmation().rehydrate({
      jsonApi: {
        type: "discord-connect-confirmations",
        id: "t-1",
        attributes: { result: "connected", discordName: "carlo" },
      },
      included: [],
    } as any);

    expect(model.result).toBe("connected");
    expect(model.discordName).toBe("carlo");
  });

  it("defaults a missing result to failed", () => {
    const model = new DiscordConnectConfirmation().rehydrate({
      jsonApi: { type: "discord-connect-confirmations", id: "t-1", attributes: {} },
      included: [],
    } as any);

    expect(model.result).toBe("failed");
    expect(model.discordName).toBeUndefined();
  });
});
