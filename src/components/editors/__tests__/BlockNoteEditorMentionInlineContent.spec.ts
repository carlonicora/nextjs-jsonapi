import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "@testing-library/react";

import { createMentionInlineContentSpec, parseMentionElement } from "../BlockNoteEditorMentionInlineContent";

vi.mock("@blocknote/react", () => ({
  createReactInlineContentSpec: (_config: unknown, implementation: unknown) => ({ implementation }),
}));

vi.mock("next/link", () => ({
  default: (props: Record<string, unknown>) => React.createElement("a", props),
}));

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

describe("createMentionInlineContentSpec — disabled mentions", () => {
  it("marks the link with data-mention-link so the app styles it as a mention, without data-mention-id", () => {
    const spec = createMentionInlineContentSpec((id) => ({ name: "A", url: `/npcs/${id}` }), true) as unknown as {
      implementation: { render: (p: { inlineContent: { props: Record<string, string> } }) => React.ReactElement };
    };

    const { container } = render(
      spec.implementation.render({ inlineContent: { props: { id: "m1", entityType: "npcs", alias: "A" } } }),
    );

    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    expect(anchor!.hasAttribute("data-mention-link")).toBe(true);
    expect(anchor!.hasAttribute("data-mention-id")).toBe(false);
    expect(anchor!.getAttribute("href")).toBe("/npcs/m1");
  });
});
