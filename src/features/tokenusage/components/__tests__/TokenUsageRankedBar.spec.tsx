import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenUsageRankedBar } from "../TokenUsageRankedBar";

const row = (id: string, label: string, cost: number) =>
  ({ id, label, cost, credits: 0, tokensIn: 0, tokensOut: 0, cached: 0, calls: 1 }) as any;

describe("TokenUsageRankedBar", () => {
  it("direct-labels each row with its value and its share of the total", () => {
    render(
      <TokenUsageRankedBar
        rows={[row("a", "Studio Rossi", 6), row("b", "Studio Bianchi", 4)]}
        metric="cost"
        emptyLabel="nessun dato"
      />,
    );

    expect(screen.getByTestId("ranked-value-a")).toHaveTextContent("6,00");
    expect(screen.getByTestId("ranked-share-a")).toHaveTextContent("60");
    expect(screen.getByTestId("ranked-share-b")).toHaveTextContent("40");
  });

  it("renders the empty label when there are no rows", () => {
    render(<TokenUsageRankedBar rows={[]} metric="cost" emptyLabel="nessun dato" />);
    expect(screen.getByText("nessun dato")).toBeInTheDocument();
  });

  it("assigns colour by rank position from one ramp, so no two rows share an identity hue by accident", () => {
    render(
      <TokenUsageRankedBar
        rows={[row("a", "A", 3), row("b", "B", 2), row("c", "C", 1)]}
        metric="cost"
        emptyLabel="nessun dato"
      />,
    );

    const colours = ["a", "b", "c"].map((id) => screen.getByTestId(`ranked-fill-${id}`).getAttribute("data-ramp-step"));
    expect(new Set(colours).size).toBe(3);
    expect(colours).toEqual(["0", "1", "2"]);
  });
});
