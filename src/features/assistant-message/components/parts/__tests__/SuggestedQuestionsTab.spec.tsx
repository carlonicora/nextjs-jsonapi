import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestedQuestionsTab } from "../tabs/SuggestedQuestionsTab";

describe("SuggestedQuestionsTab", () => {
  it("renders enabled buttons that call onSelect with the question", async () => {
    const onSelect = vi.fn();
    render(<SuggestedQuestionsTab questions={["Why?", "How?"]} onSelect={onSelect} />);
    const button = screen.getByRole("button", { name: "Why?" });
    expect(button).toBeEnabled();
    await userEvent.setup().click(button);
    expect(onSelect).toHaveBeenCalledWith("Why?");
  });

  it("renders the buttons disabled when no onSelect is given (read-only)", () => {
    render(<SuggestedQuestionsTab questions={["Why?", "How?"]} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) expect(button).toBeDisabled();
  });
});
