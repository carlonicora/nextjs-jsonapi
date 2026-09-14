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

const userModule: ApiRequestDataTypeInterface = {
  name: "users",
  model: HowTo,
} as any;

beforeAll(() => {
  ModuleRegistry.register("HowTo", howToModule);
  ModuleRegistry.register("User", userModule);
});

/** Collect every `id` value at any depth of a serialised payload. */
function collectIds(value: any, ids: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) collectIds(item, ids);
  } else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "id") ids.push(child as string);
      else collectIds(child, ids);
    }
  }
  return ids;
}

describe("HowTo.createJsonApi", () => {
  it("serialises the new attributes", () => {
    const res = new HowTo().createJsonApi({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Add an NPC",
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

  it("emits no author relationship when the how-to has no author", () => {
    // The backend HowTo descriptor declares `relationships: {}` — a how-to has no
    // author on the wire, so the editor must not invent one.
    const res = new HowTo().createJsonApi({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Add an NPC",
      description: [{ type: "paragraph", content: [] }],
    });

    expect(res.data.relationships).toEqual({});
    expect(res.data.relationships.author).toBeUndefined();
    expect("author" in res.data.relationships).toBe(false);
  });

  it("emits no empty-string id anywhere in the payload", () => {
    const res = new HowTo().createJsonApi({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Add an NPC",
      description: [{ type: "paragraph", content: [] }],
    });

    const ids = collectIds(res);
    expect(ids).toEqual(["11111111-1111-4111-8111-111111111111"]);
    expect(ids).not.toContain("");
    expect(JSON.stringify(res)).not.toContain('"id":""');
  });

  it("still emits the author relationship when a real author id is supplied", () => {
    // Guards the ContentInput widening: content types that DO carry an author
    // keep serialising it through Content.addContentInput.
    const res = new HowTo().createJsonApi({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Add an NPC",
      authorId: "22222222-2222-4222-8222-222222222222",
      description: [{ type: "paragraph", content: [] }],
    });

    expect(res.data.relationships.author).toEqual({
      data: { type: "users", id: "22222222-2222-4222-8222-222222222222" },
    });
  });
});
