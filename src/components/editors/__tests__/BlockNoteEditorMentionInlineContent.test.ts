import { describe, it, expect } from "vitest";

import { parseMentionElement } from "../BlockNoteEditorMentionInlineContent";

describe("parseMentionElement", () => {
  const makeSpan = (attrs: Record<string, string>): HTMLElement => {
    const span = document.createElement("span");
    Object.entries(attrs).forEach(([k, v]) => span.setAttribute(k, v));
    return span;
  };

  it("returns the mention props when all three data attributes are present and non-empty", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-type": "type-x",
      "data-mention-alias": "Alias One",
    });

    expect(parseMentionElement(el)).toEqual({
      id: "id-1",
      entityType: "type-x",
      alias: "Alias One",
    });
  });

  it("returns undefined when data-mention-id is missing", () => {
    const el = makeSpan({
      "data-mention-type": "type-x",
      "data-mention-alias": "Alias One",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("returns undefined when data-mention-type is missing", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-alias": "Alias One",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("returns undefined when data-mention-alias is missing", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-type": "type-x",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("returns undefined when data-mention-id is an empty string", () => {
    const el = makeSpan({
      "data-mention-id": "",
      "data-mention-type": "type-x",
      "data-mention-alias": "Alias One",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("returns undefined when data-mention-type is an empty string", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-type": "",
      "data-mention-alias": "Alias One",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("returns undefined when data-mention-alias is an empty string", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-type": "type-x",
      "data-mention-alias": "",
    });

    expect(parseMentionElement(el)).toBeUndefined();
  });

  it("ignores unrelated data-* attributes", () => {
    const el = makeSpan({
      "data-mention-id": "id-1",
      "data-mention-type": "type-x",
      "data-mention-alias": "Alias One",
      "data-foo": "bar",
    });

    expect(parseMentionElement(el)).toEqual({
      id: "id-1",
      entityType: "type-x",
      alias: "Alias One",
    });
  });
});
