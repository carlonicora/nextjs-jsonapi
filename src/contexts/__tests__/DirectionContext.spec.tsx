import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DirectionProvider, useDir } from "../DirectionContext";

function Probe() {
  return <span data-testid="dir">{useDir()}</span>;
}

describe("DirectionContext", () => {
  it("defaults to ltr without a provider", () => {
    render(<Probe />);
    expect(screen.getByTestId("dir").textContent).toBe("ltr");
  });
  it("provides rtl", () => {
    render(
      <DirectionProvider dir="rtl">
        <Probe />
      </DirectionProvider>,
    );
    expect(screen.getByTestId("dir").textContent).toBe("rtl");
  });
});
