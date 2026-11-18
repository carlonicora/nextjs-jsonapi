import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { createJsonApiInclusion } from "../../../../core/fields/FieldSelector";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { Skill } from "../Skill";
import { SkillService } from "../SkillService";

// ModuleRegistry is backed by a globalThis symbol shared across test files in a
// worker, hence the register-if-absent guard (same idiom as
// HandbookThreadService.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

const skillModule = {
  name: "skills",
  model: Skill,
  inclusions: { lists: { fields: [createJsonApiInclusion("skills", ["name", "description"])] } },
} as any;

beforeAll(() => {
  registerIfAbsent("Skill", skillModule);
});

type CallApiParams = {
  type: ApiRequestDataTypeInterface;
  method: string;
  endpoint: string;
  input?: unknown;
  next?: unknown;
  overridesJsonApiCreation?: boolean;
};
const callApi = () => vi.spyOn(AbstractService as any, "callApi");
const firstCall = (spy: ReturnType<typeof callApi>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;
const path = (endpoint: string) => endpoint.split("?")[0];

const expectCall = (call: CallApiParams, method: string, endpoint: string) => {
  expect(call.method).toBe(method);
  expect(path(call.endpoint)).toBe(endpoint);
  expect(call.type).toBe(ModuleRegistry.get("Skill" as any));
  expect(call.overridesJsonApiCreation).toBeUndefined();
};

const input = { id: "s1", name: "quote", description: "d", instructions: "i", isActive: true };

describe("SkillService company routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("findMany lists skills with search, the list field limit and the cursor", async () => {
    const spy = callApi().mockResolvedValue([]);

    await SkillService.findMany({ search: "qu", next: { next: "skills?page[cursor]=2" } });

    const call = firstCall(spy);
    expectCall(call, "GET", "skills");
    expect(call.endpoint).toContain("search=qu");
    expect(call.endpoint).toContain("fields[skills]=name,description");
    expect(call.next).toEqual({ next: "skills?page[cursor]=2" });
  });

  it("findActive reads skills/active", async () => {
    const spy = callApi().mockResolvedValue([]);
    await SkillService.findActive();
    expectCall(firstCall(spy), "GET", "skills/active");
  });

  it("findOne reads skills/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.findOne({ id: "1" });
    expectCall(firstCall(spy), "GET", "skills/1");
  });

  it("create posts the input to skills", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.create(input);
    const call = firstCall(spy);
    expectCall(call, "POST", "skills");
    expect(call.input).toEqual(input);
  });

  it("update puts the input to skills/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.update(input);
    const call = firstCall(spy);
    expectCall(call, "PUT", "skills/s1");
    expect(call.input).toEqual(input);
  });

  it("delete removes skills/:id", async () => {
    const spy = callApi().mockResolvedValue(undefined);
    await SkillService.delete({ id: "1" });
    expectCall(firstCall(spy), "DELETE", "skills/1");
  });

  it("enable posts skills/:id/enable and returns the skill", async () => {
    const skill = new Skill();
    const spy = callApi().mockResolvedValue(skill);
    await expect(SkillService.enable({ id: "1" })).resolves.toBe(skill);
    expectCall(firstCall(spy), "POST", "skills/1/enable");
  });

  it("disable posts skills/:id/disable and returns the skill", async () => {
    const skill = new Skill();
    const spy = callApi().mockResolvedValue(skill);
    await expect(SkillService.disable({ id: "1" })).resolves.toBe(skill);
    expectCall(firstCall(spy), "POST", "skills/1/disable");
  });
});

describe("SkillService global (Administrator) routes", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("findGlobal lists skills/global", async () => {
    const spy = callApi().mockResolvedValue([]);
    await SkillService.findGlobal({});
    const call = firstCall(spy);
    expectCall(call, "GET", "skills/global");
    expect(call.endpoint).toContain("fields[skills]=name,description");
  });

  it("findGlobal passes search", async () => {
    const spy = callApi().mockResolvedValue([]);
    await SkillService.findGlobal({ search: "qu" });
    expect(firstCall(spy).endpoint).toContain("search=qu");
  });

  it("findOneGlobal reads skills/global/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.findOneGlobal({ id: "1" });
    expectCall(firstCall(spy), "GET", "skills/global/1");
  });

  it("createGlobal posts the input to skills/global", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.createGlobal(input);
    const call = firstCall(spy);
    expectCall(call, "POST", "skills/global");
    expect(call.input).toEqual(input);
  });

  it("updateGlobal puts the input to skills/global/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.updateGlobal(input);
    const call = firstCall(spy);
    expectCall(call, "PUT", "skills/global/s1");
    expect(call.input).toEqual(input);
  });

  it("deleteGlobal removes skills/global/:id", async () => {
    const spy = callApi().mockResolvedValue(undefined);
    await SkillService.deleteGlobal({ id: "1" });
    expectCall(firstCall(spy), "DELETE", "skills/global/1");
  });

  it("enableGlobal posts skills/global/:id/enable", async () => {
    const spy = callApi().mockResolvedValue(new Skill());
    await SkillService.enableGlobal({ id: "1" });
    expectCall(firstCall(spy), "POST", "skills/global/1/enable");
  });

  it("disableGlobal posts skills/global/:id/disable", async () => {
    const spy = callApi().mockResolvedValue(new Skill());
    await SkillService.disableGlobal({ id: "1" });
    expectCall(firstCall(spy), "POST", "skills/global/1/disable");
  });
});

describe("SkillService company routes on a picked company (Administrator)", () => {
  beforeEach(() => vi.restoreAllMocks());

  const companyId = "c1";

  it("findMany lists skills/companies/:companyId with search, the list field limit and the cursor", async () => {
    const spy = callApi().mockResolvedValue([]);
    await SkillService.findMany({ search: "qu", companyId, next: { next: "x" } });
    const call = firstCall(spy);
    expectCall(call, "GET", "skills/companies/c1");
    expect(call.endpoint).toContain("search=qu");
    expect(call.endpoint).toContain("fields[skills]=name,description");
    expect(call.next).toEqual({ next: "x" });
  });

  it("findOne reads skills/companies/:companyId/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.findOne({ id: "1", companyId });
    expectCall(firstCall(spy), "GET", "skills/companies/c1/1");
  });

  it("create posts the input to skills/companies/:companyId", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.create(input, { companyId });
    const call = firstCall(spy);
    expectCall(call, "POST", "skills/companies/c1");
    expect(call.input).toEqual(input);
  });

  it("update puts the input to skills/companies/:companyId/:id", async () => {
    const spy = callApi().mockResolvedValue({});
    await SkillService.update(input, { companyId });
    const call = firstCall(spy);
    expectCall(call, "PUT", "skills/companies/c1/s1");
    expect(call.input).toEqual(input);
  });

  it("delete removes skills/companies/:companyId/:id", async () => {
    const spy = callApi().mockResolvedValue(undefined);
    await SkillService.delete({ id: "1", companyId });
    expectCall(firstCall(spy), "DELETE", "skills/companies/c1/1");
  });

  it("enable posts skills/companies/:companyId/:id/enable", async () => {
    const spy = callApi().mockResolvedValue(new Skill());
    await SkillService.enable({ id: "1", companyId });
    expectCall(firstCall(spy), "POST", "skills/companies/c1/1/enable");
  });

  it("disable posts skills/companies/:companyId/:id/disable", async () => {
    const spy = callApi().mockResolvedValue(new Skill());
    await SkillService.disable({ id: "1", companyId });
    expectCall(firstCall(spy), "POST", "skills/companies/c1/1/disable");
  });
});
