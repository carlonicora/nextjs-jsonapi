import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssistantEmptyState } from "../AssistantEmptyState";

describe("AssistantEmptyState", () => {
  it("renders the heading + 4 starter prompts", () => {
    render(<AssistantEmptyState onSend={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "features.assistant.empty_state.title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("features.assistant.empty_state.subtitle"),
    ).toBeInTheDocument();
    expect(screen.getByText("features.assistant.starters.a")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.starters.b")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.starters.c")).toBeInTheDocument();
    expect(screen.getByText("features.assistant.starters.d")).toBeInTheDocument();
  });

  it("clicking a starter fills the composer (does NOT auto-send)", async () => {
    const onSend = vi.fn();
    render(<AssistantEmptyState onSend={onSend} />);
    const firstStarter = screen.getByText("features.assistant.starters.a");
    await userEvent.click(firstStarter);
    const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;
    // The starter key text itself is what the composer should hold (since useTranslations returns keys)
    expect(textarea.value).toBe("features.assistant.starters.a");
    expect(onSend).not.toHaveBeenCalled();
  });
});
