import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { JsonApiHydratedDataInterface } from "../../../core/interfaces/JsonApiHydratedDataInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { Skill } from "./Skill";

// createJsonApi reads Modules.Skill.name (resolved lazily via ModuleRegistry),
// so the module must be registered before the model serialises — mirrors the
// HowTo.spec setup convention in this package.
const skillModule: ApiRequestDataTypeInterface = {
  name: "skills",
  model: Skill,
} as any;

beforeAll(() => {
  ModuleRegistry.register("Skill", skillModule);
});

const hydrated = (attributes: Record<string, any>): JsonApiHydratedDataInterface =>
  ({
    jsonApi: { type: "skills", id: "s1", attributes, relationships: {} },
    included: [],
  }) as any;

describe("Skill.rehydrate", () => {
  it("reads every attribute", () => {
    const skill = new Skill().rehydrate(
      hydrated({
        name: "quote",
        description: "Write a quote",
        instructions: "Do it like this",
        isActive: true,
        isGlobal: true,
        origin: "copy",
        isEnabled: true,
        isHidden: true,
        canRestore: true,
      }),
    );

    expect(skill.name).toBe("quote");
    expect(skill.description).toBe("Write a quote");
    expect(skill.instructions).toBe("Do it like this");
    expect(skill.isActive).toBe(true);
    expect(skill.isGlobal).toBe(true);
    expect(skill.origin).toBe("copy");
    expect(skill.isEnabled).toBe(true);
    expect(skill.isHidden).toBe(true);
    expect(skill.canRestore).toBe(true);
  });

  it("defaults absent values: instructions empty, booleans false, origin company", () => {
    const skill = new Skill().rehydrate(hydrated({ name: "quote", description: "d" }));

    expect(skill.instructions).toBe("");
    expect(skill.isActive).toBe(false);
    expect(skill.isGlobal).toBe(false);
    expect(skill.isEnabled).toBe(false);
    expect(skill.isHidden).toBe(false);
    expect(skill.canRestore).toBe(false);
    expect(skill.origin).toBe("company");
  });
});

describe("Skill.createJsonApi", () => {
  it("sends the four writable attributes and nothing the server owns", () => {
    const res = new Skill().createJsonApi({
      id: "s1",
      name: "quote",
      description: "d",
      instructions: "i",
      isActive: true,
    });

    expect(res.data.type).toBe("skills");
    expect(res.data.id).toBe("s1");
    expect(res.data.attributes).toEqual({ name: "quote", description: "d", instructions: "i", isActive: true });
    for (const key of ["isGlobal", "origin", "isEnabled", "isHidden", "canRestore"]) {
      expect(key in res.data.attributes).toBe(false);
    }
    expect(res.data.relationships.original).toBeUndefined();
  });

  it("adds the original relationship when making a copy", () => {
    const res = new Skill().createJsonApi({ id: "s2", originalId: "x" });

    expect(res.data.relationships.original).toEqual({ data: { type: "skills", id: "x" } });
  });

  it("does not send an attribute left undefined", () => {
    const res = new Skill().createJsonApi({ id: "s1", name: "quote", description: undefined, isActive: false });

    expect(res.data.attributes).toEqual({ name: "quote", isActive: false });
    expect("description" in res.data.attributes).toBe(false);
    expect("instructions" in res.data.attributes).toBe(false);
  });
});
