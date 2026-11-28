import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlockNoteEditorContainer } from "../BlockNoteEditorContainer";
import { BlockNoteEditorPlaceholder } from "../BlockNoteEditorPlaceholder";

/** The editor code stands in as a plain element that loads like the real chunk: asynchronously. */
const loader = vi.hoisted(() => ({ release: undefined as undefined | (() => void) }));

vi.mock("../BlockNoteEditor", async () => {
  await new Promise<void>((resolve) => {
    loader.release = resolve;
  });
  return { default: (props: { id: string }) => <div data-testid="editor" data-id={props.id} /> };
});

const BLOCKS = [
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "The archive" }] },
  {
    type: "paragraph",
    content: [
      { type: "text", text: "Ask " },
      { type: "mention", props: { alias: "Marcus" } },
      { type: "text", text: " about it" },
    ],
  },
  { type: "bulletListItem", content: [{ type: "text", text: "a locked door" }] },
];

describe("BlockNoteEditorContainer", () => {
  it("shows the field's text in a placeholder until the editor code arrives, then the editor", async () => {
    render(<BlockNoteEditorContainer id="notes" type="notes" initialContent={BLOCKS as any} />);

    const placeholder = document.querySelector("[data-blocknote-placeholder]");
    expect(placeholder).not.toBeNull();
    expect(placeholder).toHaveAttribute("aria-busy", "true");
    expect(placeholder).toHaveTextContent("The archive");
    expect(screen.queryByTestId("editor")).toBeNull();

    // The load starts on mount; the stand-in chunk resolves only when released.
    await vi.waitFor(() => expect(loader.release).toBeDefined());
    loader.release?.();

    expect(await screen.findByTestId("editor")).toHaveAttribute("data-id", "notes");
    expect(document.querySelector("[data-blocknote-placeholder]")).toBeNull();
  });
});

describe("BlockNoteEditorPlaceholder", () => {
  it("renders each block's text, mention names and list markers", () => {
    const { container } = render(<BlockNoteEditorPlaceholder id="notes" type="notes" initialContent={BLOCKS as any} />);

    expect(container).toHaveTextContent("The archive");
    expect(container).toHaveTextContent("Ask Marcus about it");
    expect(container).toHaveTextContent("• a locked door");
  });

  it("an editable field gets the editor's padding; a read-only one does not", () => {
    const { container: editable } = render(
      <BlockNoteEditorPlaceholder id="a" type="notes" initialContent={BLOCKS as any} onChange={() => {}} bordered />,
    );
    const { container: readOnly } = render(
      <BlockNoteEditorPlaceholder id="b" type="notes" initialContent={BLOCKS as any} />,
    );

    expect(editable.firstElementChild).toHaveClass("p-4", "border");
    expect(readOnly.firstElementChild).not.toHaveClass("p-4");
  });

  it("an empty editable field shows its placeholder text", () => {
    const { container } = render(
      <BlockNoteEditorPlaceholder id="c" type="notes" onChange={() => {}} placeholder="Write something" />,
    );

    expect(container).toHaveTextContent("Write something");
  });

  it("markdown content is shown line by line", () => {
    const { container } = render(<BlockNoteEditorPlaceholder id="d" type="notes" markdownContent={"First\nSecond"} />);

    expect(container).toHaveTextContent("First");
    expect(container).toHaveTextContent("Second");
  });
});
