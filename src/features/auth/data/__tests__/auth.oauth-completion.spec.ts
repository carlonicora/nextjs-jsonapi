import { beforeAll, describe, expect, it } from "vitest";
import { Modules } from "../../../../core";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Auth } from "../auth";

// Auth.createJsonApi() reads Modules.Auth.name through the real ModuleRegistry,
// so it must be registered (same pattern as auth.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Auth", { name: "auth", model: Auth } as any);
  registerIfAbsent("User", { name: "users", model: class {} } as any);
});

describe("Auth.createJsonApi() for the OAuth completion", () => {
  it("an OAuth completion body carries the pending id and the given consent", () => {
    const body = new Auth().createJsonApi({
      id: "p1",
      termsAcceptedAt: "2026-11-09T00:00:00.000Z",
      marketingConsent: false,
    });

    expect(body).toEqual({
      data: {
        type: Modules.Auth.name,
        id: "p1",
        attributes: { termsAcceptedAt: "2026-11-09T00:00:00.000Z", marketingConsent: false },
      },
    });
  });

  it("an invite completion sends no consent attributes", () => {
    const body = new Auth().createJsonApi({ id: "p1" });

    expect(body).toEqual({ data: { type: Modules.Auth.name, id: "p1", attributes: {} } });
  });
});
