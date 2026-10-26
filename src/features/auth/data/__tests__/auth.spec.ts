import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Auth } from "../auth";

// Auth.rehydrate() resolves Modules.User through the real ModuleRegistry (the
// argument of `_readIncluded`), so it must be registered even though these
// fixtures carry no included user.
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

const rehydrateWith = (attributes: Record<string, any>) =>
  new Auth().rehydrate({
    jsonApi: { type: "auth", id: "auth-1", attributes: { token: "t", refreshToken: "r", ...attributes } },
    included: [],
  } as any);

describe("Auth", () => {
  describe("rehydrate", () => {
    it("deletionCancelled true when the attribute is true, false otherwise", () => {
      expect(rehydrateWith({ deletionCancelled: true }).deletionCancelled).toBe(true);
      expect(rehydrateWith({ deletionCancelled: false }).deletionCancelled).toBe(false);
      expect(rehydrateWith({}).deletionCancelled).toBe(false);
    });
  });
});
