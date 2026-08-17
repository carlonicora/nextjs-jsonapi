import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { Company } from "./company";

// ---------------------------------------------------------------------------
// Setup — Company.rehydrate() resolves Modules.Feature / Modules.Module
// through the real ModuleRegistry (for `_readIncluded`), so both must be
// registered even though this suite's fixtures carry no included data.
// ---------------------------------------------------------------------------
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Company", { name: "companies", model: Company } as any);
  registerIfAbsent("Feature", { name: "features", model: class {} } as any);
  registerIfAbsent("Module", { name: "modules", model: class {} } as any);
});

describe("Company.aiEnabled", () => {
  it("defaults to true when the attribute is absent", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: {} } } as any);
    expect(company.aiEnabled).toBe(true);
  });

  it("is false only when explicitly false", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: { aiEnabled: false } } } as any);
    expect(company.aiEnabled).toBe(false);
  });

  it("is true when explicitly true", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: { aiEnabled: true } } } as any);
    expect(company.aiEnabled).toBe(true);
  });
});
