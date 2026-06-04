import { beforeAll, describe, it, expect } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { HowTo } from "./HowTo";

// createJsonApi reads Modules.HowTo.name (resolved lazily via ModuleRegistry),
// so the module must be registered before the model serialises — mirrors the
// AssistantMessage.spec setup convention in this package.
const howToModule: ApiRequestDataTypeInterface = {
  name: "howtos",
  model: HowTo,
} as any;

beforeAll(() => {
  ModuleRegistry.register("HowTo", howToModule);
});

describe("HowTo.createJsonApi", () => {
  it("serialises the new attributes", () => {
    const res = new HowTo().createJsonApi({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Add an NPC",
      authorId: "",
      description: [{ type: "paragraph", content: [] }],
      howToType: "how-to",
      slug: "add-an-npc",
      order: 30,
      summary: "Create a Non-Player Character.",
      tags: ["world"],
      contextualKeys: ["npc.editor"],
      draft: false,
    });
    const a = res.data.attributes;
    expect(a.howToType).toBe("how-to");
    expect(a.slug).toBe("add-an-npc");
    expect(a.order).toBe(30);
    expect(a.summary).toBe("Create a Non-Player Character.");
    expect(a.tags).toEqual(["world"]);
    expect(a.contextualKeys).toEqual(["npc.editor"]);
    expect(a.draft).toBe(false);
    expect(typeof a.description).toBe("string"); // existing: BlockNote JSON stringified
  });
});
