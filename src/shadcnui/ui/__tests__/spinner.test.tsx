// packages/nextjs-jsonapi/src/shadcnui/ui/__tests__/spinner.test.tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "../spinner";

describe("Spinner", () => {
  it("renders a status indicator with animate-spin", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveClass("size-4");
  });

  it("applies the size variant", () => {
    render(<Spinner size="lg" />);
    expect(screen.getByRole("status")).toHaveClass("size-8");
  });
});
