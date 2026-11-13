import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AssistantBlockNoteComposer } from "../AssistantBlockNoteComposer";

// The real editor is a next/dynamic ssr:false import; assert on the props it receives.
vi.mock("../../../../../components/editors/BlockNoteEditorContainer", () => ({
  BlockNoteEditorContainer: ({ placeholder }: { placeholder?: string }) => (
    <div data-testid="composer-editor" data-placeholder={placeholder} />
  ),
}));

describe("AssistantBlockNoteComposer", () => {
  it("renders the given placeholder", () => {
    render(<AssistantBlockNoteComposer onSend={vi.fn()} placeholder="Type here" />);
    expect(screen.getByTestId("composer-editor")).toHaveAttribute("data-placeholder", "Type here");
  });

  it("falls back to the assistant placeholder", () => {
    render(<AssistantBlockNoteComposer onSend={vi.fn()} />);
    expect(screen.getByTestId("composer-editor")).toHaveAttribute(
      "data-placeholder",
      "features.assistant.composer_placeholder",
    );
  });
});
