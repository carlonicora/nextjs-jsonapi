import { describe, expect, it } from "vitest";
import { Assistant } from "../Assistant";

describe("Assistant model", () => {
  it("rehydrates engine from attributes (operator thread)", () => {
    const assistant = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-1", attributes: { title: "T", engine: "operator" } },
      included: [],
    });
    expect(assistant.engine).toBe("operator");
    expect(assistant.title).toBe("T");
  });

  it("leaves engine undefined when the attribute is absent (responder thread)", () => {
    const assistant = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-2", attributes: { title: "T" } },
      included: [],
    });
    expect(assistant.engine).toBeUndefined();
  });

  it("preserves engine through dehydrate/rehydrate round-trips", () => {
    const original = new Assistant().rehydrate({
      jsonApi: { type: "assistants", id: "a-3", attributes: { title: "T", engine: "operator" } },
      included: [],
    });
    const roundTripped = new Assistant().rehydrate(original.dehydrate());
    expect(roundTripped.engine).toBe("operator");
  });
});
