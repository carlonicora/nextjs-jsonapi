import { fireEvent, render, screen } from "@testing-library/react";
import React, { useRef } from "react";
import { describe, expect, it } from "vitest";
import { BlockNoteEditorMentionHoverCard } from "../BlockNoteEditorMentionHoverCard";
import type { MentionResolveFn } from "../BlockNoteEditorMentionInlineContent";

function Harness({ fn }: { fn: MentionResolveFn }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}>
      <span data-mention-id="m1" data-mention-type="npcs" data-mention-alias="A">
        @A
      </span>
      <BlockNoteEditorMentionHoverCard containerRef={ref} mentionResolveFn={fn} />
    </div>
  );
}

const HoverContent = () => <div data-testid="hc" />;

function hoverAndGetPortal(fn: MentionResolveFn): HTMLElement {
  render(<Harness fn={fn} />);
  fireEvent.mouseOver(screen.getByText("@A"));
  return screen.getByTestId("hc").parentElement as HTMLElement;
}

describe("BlockNoteEditorMentionHoverCard", () => {
  it("keeps the framed popup by default", () => {
    const portal = hoverAndGetPortal(() => ({ name: "A", HoverContent }));
    expect(portal.classList.contains("bg-popover")).toBe(true);
    expect(portal.classList.contains("border")).toBe(true);
  });

  it("drops the frame and caps the height when hoverFrameless", () => {
    const portal = hoverAndGetPortal(() => ({ name: "A", HoverContent, hoverFrameless: true }));
    expect(portal.classList.contains("bg-popover")).toBe(false);
    expect(portal.classList.contains("border")).toBe(false);
    expect(portal.classList.contains("p-2.5")).toBe(false);
    expect(portal.style.overflowY).toBe("auto");
    expect(portal.style.maxHeight).toMatch(/^\d+(\.\d+)?px$/);
  });
});
