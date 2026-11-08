import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DetailField } from "../DetailField";

describe("DetailField", () => {
  it("valueClassName lands on the value element", () => {
    render(<DetailField horizontal label="L" value="V" valueClassName="min-w-0 flex-1" />);
    const value = screen.getByText("V");
    expect(value.classList.contains("text-sm")).toBe(true);
    expect(value.classList.contains("min-w-0")).toBe(true);
    expect(value.classList.contains("flex-1")).toBe(true);
  });
});
