import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PROPOSED_EDITABLE_TEXT_CLASS, PROPOSED_READ_ONLY_TEXT_CLASS, ProposedTextField } from "../ProposedTextField";

/** The editor stands in as a plain element; its last props are kept. */
const editor = vi.hoisted(() => ({ props: undefined as any }));

vi.mock("../BlockNoteEditorContainer", () => ({
  BlockNoteEditorContainer: (props: any) => {
    editor.props = props;
    return <div data-testid="editor" />;
  },
}));

const BLOCKS = [{ id: "b1", type: "paragraph", content: [{ type: "text", text: "Runs the docks" }] }];

describe("ProposedTextField", () => {
  beforeEach(() => {
    editor.props = undefined;
  });

  it("renders a short text as the one-line input and reports each change", () => {
    const onChange = vi.fn();
    render(
      <ProposedTextField
        id="name"
        variant="text"
        value="Marcus"
        onChange={onChange}
        aria-label="Name"
        data-testid="field-name"
        className="flex-1"
      />,
    );

    const input = screen.getByTestId("field-name") as HTMLInputElement;
    expect(input.tagName).toBe("INPUT");
    expect(input.value).toBe("Marcus");
    expect(input).toHaveAttribute("aria-label", "Name");
    expect(input.className).toContain("h-8");
    expect(input.className).toContain("font-medium");
    expect(input.className).toContain("flex-1");

    fireEvent.change(input, { target: { value: "Marco" } });
    expect(onChange).toHaveBeenCalledWith("Marco");
  });

  it("renders a multiline plain text as a text box", () => {
    render(<ProposedTextField id="d" variant="text" multiline value={"a\nb"} onChange={vi.fn()} data-testid="box" />);

    expect(screen.getByTestId("box").tagName).toBe("TEXTAREA");
  });

  it("renders an editable rich text as the bordered editor with mentions", () => {
    const onChange = vi.fn();
    const mentionSearchFn = vi.fn();
    const mentionSearchParams = { campaignId: "c1" };
    render(
      <ProposedTextField
        id="desc"
        variant="richtext"
        type="npcs"
        initialContent={BLOCKS}
        onChange={onChange}
        placeholder="Write it"
        data-testid="field-desc"
        mentionSearchFn={mentionSearchFn}
        mentionSearchParams={mentionSearchParams}
      />,
    );

    expect(screen.getByTestId("field-desc")).toContainElement(screen.getByTestId("editor"));
    expect(editor.props).toMatchObject({
      id: "desc",
      type: "npcs",
      initialContent: BLOCKS,
      placeholder: "Write it",
      bordered: true,
      disableUploads: true,
      className: PROPOSED_EDITABLE_TEXT_CLASS,
      enableMentions: true,
      mentionSearchFn,
      mentionSearchParams,
    });

    editor.props.onChange(BLOCKS, false, false);
    expect(onChange).toHaveBeenCalledWith(BLOCKS, false);
  });

  it("renders a read-only rich text without the field and without onChange", () => {
    render(
      <ProposedTextField id="desc" variant="richtext" type="npcs" initialContent={BLOCKS} readOnly data-testid="t" />,
    );

    expect(screen.getByTestId("t")).toContainElement(screen.getByTestId("editor"));
    expect(editor.props.className).toBe(PROPOSED_READ_ONLY_TEXT_CLASS);
    expect(editor.props.onChange).toBeUndefined();
    expect(editor.props.bordered).toBeUndefined();
    expect(editor.props.enableMentions).toBe(false);
  });
});
