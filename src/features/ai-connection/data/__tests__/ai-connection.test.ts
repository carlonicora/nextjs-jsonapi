import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { AiConnection } from "../ai-connection";
import { AiConnectionInput } from "../ai-connection.interface";

// ---------------------------------------------------------------------------
// Setup — the model resolves its JSON:API types through the real
// ModuleRegistry, so both modules it names must be registered.
// ---------------------------------------------------------------------------
const aiConnectionModule: ApiRequestDataTypeInterface = {
  name: "ai-connections",
  model: AiConnection,
} as any;

const companyModule: ApiRequestDataTypeInterface = {
  name: "companies",
  model: class {},
} as any;

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("AiConnection", aiConnectionModule);
  registerIfAbsent("Company", companyModule);
});

function makeHydratedData(attributeOverrides: Record<string, any> = {}) {
  return {
    jsonApi: {
      id: "connection-1",
      type: "ai-connections",
      attributes: {
        name: "Primary OpenRouter",
        connectionType: "ai",
        provider: "openrouter",
        position: 0,
        enabled: true,
        model: "anthropic/claude-sonnet-4",
        url: "https://openrouter.ai/api/v1",
        region: "eu",
        instance: "my-instance",
        apiVersion: "2024-08-01",
        allowFallbacks: true,
        reasoningEffort: "medium",
        maxOutputTokens: 8192,
        dimensions: 1536,
        inputCostPer1MTokens: 3,
        outputCostPer1MTokens: 15,
        cachedInputCostPer1MTokens: 0.3,
        costPerMinute: 0.02,
        costPerPage: 0.05,
        directUrl: "https://example.test/audio",
        language: "en",
        directFormat: "json",
        directProvider: "groq",
        hasApiKey: true,
        hasGoogleCredentials: false,
        companyId: "company-1",
        ...attributeOverrides,
      },
      meta: {},
      relationships: {},
    },
    included: [] as any[],
  };
}

function makeInput(overrides: Partial<AiConnectionInput> = {}): AiConnectionInput {
  return {
    id: "connection-1",
    name: "Primary OpenRouter",
    connectionType: "ai",
    provider: "openrouter",
    position: 0,
    enabled: true,
    model: "anthropic/claude-sonnet-4",
    ...overrides,
  };
}

describe("AiConnection.rehydrate", () => {
  it("maps every serialized attribute, including the secret presence flags", () => {
    const connection = new AiConnection().rehydrate(makeHydratedData());

    expect(connection.id).toBe("connection-1");
    expect(connection.type).toBe("ai-connections");
    expect(connection.name).toBe("Primary OpenRouter");
    expect(connection.connectionType).toBe("ai");
    expect(connection.provider).toBe("openrouter");
    expect(connection.position).toBe(0);
    expect(connection.enabled).toBe(true);
    expect(connection.model).toBe("anthropic/claude-sonnet-4");
    expect(connection.url).toBe("https://openrouter.ai/api/v1");
    expect(connection.region).toBe("eu");
    expect(connection.instance).toBe("my-instance");
    expect(connection.apiVersion).toBe("2024-08-01");
    expect(connection.allowFallbacks).toBe(true);
    expect(connection.reasoningEffort).toBe("medium");
    expect(connection.maxOutputTokens).toBe(8192);
    expect(connection.dimensions).toBe(1536);
    expect(connection.inputCostPer1MTokens).toBe(3);
    expect(connection.outputCostPer1MTokens).toBe(15);
    expect(connection.cachedInputCostPer1MTokens).toBe(0.3);
    expect(connection.costPerMinute).toBe(0.02);
    expect(connection.costPerPage).toBe(0.05);
    expect(connection.directUrl).toBe("https://example.test/audio");
    expect(connection.language).toBe("en");
    expect(connection.directFormat).toBe("json");
    expect(connection.directProvider).toBe("groq");
    expect(connection.hasApiKey).toBe(true);
    expect(connection.hasGoogleCredentials).toBe(false);
    expect(connection.companyId).toBe("company-1");
  });

  it("treats a missing companyId as a global connection and defaults the flags", () => {
    const connection = new AiConnection().rehydrate(
      makeHydratedData({ companyId: undefined, hasApiKey: undefined, hasGoogleCredentials: undefined }),
    );

    expect(connection.companyId).toBeUndefined();
    expect(connection.hasApiKey).toBe(false);
    expect(connection.hasGoogleCredentials).toBe(false);
  });
});

describe("AiConnection.createJsonApi", () => {
  it("serializes the non-secret attributes under the ai-connections type", () => {
    const payload = new AiConnection().createJsonApi(makeInput());

    expect(payload.data.type).toBe("ai-connections");
    expect(payload.data.id).toBe("connection-1");
    expect(payload.data.attributes.name).toBe("Primary OpenRouter");
    expect(payload.data.attributes.connectionType).toBe("ai");
    expect(payload.data.attributes.provider).toBe("openrouter");
    expect(payload.data.attributes.position).toBe(0);
    expect(payload.data.attributes.enabled).toBe(true);
    expect(payload.data.attributes.model).toBe("anthropic/claude-sonnet-4");
    // Undefined optional attributes must not be emitted at all.
    expect("url" in payload.data.attributes).toBe(false);
  });

  it("omits the secrets when they are undefined", () => {
    const payload = new AiConnection().createJsonApi(makeInput());

    expect("apiKey" in payload.data.attributes).toBe(false);
    expect("googleCredentialsBase64" in payload.data.attributes).toBe(false);
  });

  it('omits the secrets when they are "" — blank means keep the stored value', () => {
    const payload = new AiConnection().createJsonApi(makeInput({ apiKey: "", googleCredentialsBase64: "" }));

    expect("apiKey" in payload.data.attributes).toBe(false);
    expect("googleCredentialsBase64" in payload.data.attributes).toBe(false);
  });

  it("includes the secrets when they carry a value", () => {
    const payload = new AiConnection().createJsonApi(
      makeInput({ apiKey: "sk-secret", googleCredentialsBase64: "Z29vZ2xl" }),
    );

    expect(payload.data.attributes.apiKey).toBe("sk-secret");
    expect(payload.data.attributes.googleCredentialsBase64).toBe("Z29vZ2xl");
  });

  it("sets the company relationship only when companyId is present", () => {
    const global = new AiConnection().createJsonApi(makeInput());
    expect(global.data.relationships.company).toBeUndefined();

    const scoped = new AiConnection().createJsonApi(makeInput({ companyId: "company-1" }));
    expect(scoped.data.relationships.company).toEqual({
      data: { type: "companies", id: "company-1" },
    });
  });

  it("keeps falsy-but-meaningful values", () => {
    const payload = new AiConnection().createJsonApi(makeInput({ enabled: false, position: 0, maxOutputTokens: 0 }));

    expect(payload.data.attributes.enabled).toBe(false);
    expect(payload.data.attributes.position).toBe(0);
    expect(payload.data.attributes.maxOutputTokens).toBe(0);
  });
});

describe("AiConnection.createReorderJsonApi", () => {
  it("produces the reorder body the backend expects", () => {
    const payload = new AiConnection().createReorderJsonApi({ ids: ["a", "b", "c"] });

    expect(payload).toEqual({
      data: {
        type: "ai-connections",
        ids: ["a", "b", "c"],
      },
    });
  });
});
