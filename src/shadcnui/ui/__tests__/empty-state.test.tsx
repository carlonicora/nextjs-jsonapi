// packages/nextjs-jsonapi/src/shadcnui/ui/__tests__/empty-state.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { InboxIcon } from "lucide-react";
import { EmptyState } from "../empty-state";

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        icon={InboxIcon}
        title="No games yet"
        description="Create your first game."
        action={<button type="button">New game</button>}
      />,
    );
    expect(screen.getByText("No games yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first game.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New game" })).toBeInTheDocument();
  });

  it("renders without optional parts", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByText("Empty")).toBeInTheDocument();
  });
});
