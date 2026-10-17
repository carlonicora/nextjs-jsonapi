import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { User } from "../user";

// The model resolves its JSON:API types through the real ModuleRegistry, so every
// module it names in rehydrate()/createJsonApi() must be registered.
const modules: Record<string, ApiRequestDataTypeInterface> = {
  User: { name: "users", model: User } as any,
  Role: { name: "roles", model: class {} } as any,
  Company: { name: "companies", model: class {} } as any,
  Module: { name: "modules", model: class {} } as any,
};

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  for (const [key, module] of Object.entries(modules)) registerIfAbsent(key, module);
});

function makeHydratedData(attributeOverrides: Record<string, any> = {}) {
  return {
    jsonApi: {
      id: "user-1",
      type: "users",
      attributes: {
        name: "Carlo",
        email: "carlo@example.test",
        ...attributeOverrides,
      },
      meta: {},
      relationships: {},
    },
    included: [] as any[],
  };
}

describe("User.rehydrate", () => {
  it("exposes the saved language", () => {
    const user = new User().rehydrate(makeHydratedData({ language: "it" }));
    expect(user.language).toBe("it");
  });

  it("leaves language undefined when the user has not chosen one", () => {
    const user = new User().rehydrate(makeHydratedData());
    expect(user.language).toBeUndefined();
  });
});

describe("User.createJsonApi", () => {
  it("writes language when provided", () => {
    const payload = new User().createJsonApi({ id: "user-1", language: "it" });
    expect(payload.data.attributes.language).toBe("it");
  });

  it("omits language when undefined", () => {
    const payload = new User().createJsonApi({ id: "user-1", name: "Carlo" });
    expect(payload.data.attributes).not.toHaveProperty("language");
  });
});
