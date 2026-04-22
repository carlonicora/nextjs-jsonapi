import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantComposer } from "../AssistantComposer";

describe("AssistantComposer", () => {
  it("Enter submits non-empty content and clears the textarea", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    render(<AssistantComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("features.assistant.composer_placeholder");
    await userEvent.type(textarea, "hello");
    await userEvent.keyboard("{Enter}");
    expect(onSend).toHaveBeenCalledWith("hello");
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  it("Shift+Enter does NOT submit", async () => {
    const onSend = vi.fn();
    render(<AssistantComposer onSend={onSend} />);
    const textarea = screen.getByPlaceholderText("features.assistant.composer_placeholder");
    await userEvent.type(textarea, "multi");
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(onSend).not.toHaveBeenCalled();
  });

  it("Send is disabled on empty/whitespace", () => {
    render(<AssistantComposer onSend={vi.fn()} />);
    // "save" appears inside the ui.buttons.save key → button text matches /save/i
    const send = screen.getByRole("button", { name: /save/i });
    expect(send).toBeDisabled();
  });
});
