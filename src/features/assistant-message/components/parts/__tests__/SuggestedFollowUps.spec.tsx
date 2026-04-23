import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestedFollowUps } from "../SuggestedFollowUps";

describe("SuggestedFollowUps", () => {
  it("is collapsed by default; toggling reveals the buttons", async () => {
    render(<SuggestedFollowUps questions={["q1", "q2", "q3"]} onSelect={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "q1" })).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /show_suggestions/ });
    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "q1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "q2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "q3" })).toBeInTheDocument();
  });

  it("clicking a question calls onSelect immediately", async () => {
    const onSelect = vi.fn();
    render(<SuggestedFollowUps questions={["q1"]} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: /show_suggestions/ }));
    await userEvent.click(screen.getByRole("button", { name: "q1" }));
    expect(onSelect).toHaveBeenCalledWith("q1");
  });

  it("renders nothing for empty list", () => {
    const { container } = render(<SuggestedFollowUps questions={[]} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });
});
