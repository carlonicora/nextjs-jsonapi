import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenUsageAdminTiles } from "../TokenUsageAdminTiles";

const row = (scope: string, window: string, cost: number, calls = 1) =>
  ({ id: `${scope}|${window}`, scope, window, cost, credits: 0, tokensIn: 0, tokensOut: 0, cached: 0, calls }) as any;

const summary = [
  row("customer", "current", 9.46, 2956),
  row("platform", "current", 9.47, 7681),
  row("total", "current", 18.93, 10637),
  row("customer", "previous", 8.0, 2000),
  row("platform", "previous", 10.0, 8000),
  row("total", "previous", 18.0, 10000),
];

describe("TokenUsageAdminTiles", () => {
  it("shows both cost centres with their deltas against the previous window", () => {
    render(<TokenUsageAdminTiles summary={summary} metric="cost" singleCustomerMode={false} />);

    expect(screen.getByTestId("tile-customer")).toHaveTextContent("9,46");
    expect(screen.getByTestId("tile-platform")).toHaveTextContent("9,47");
    // customer 9.46 vs 8.00 => +18%
    expect(screen.getByTestId("tile-customer-delta")).toHaveTextContent("18");
    // platform 9.47 vs 10.00 => -5%
    expect(screen.getByTestId("tile-platform-delta")).toHaveTextContent("5");
  });

  it("hides the platform tile in single-customer mode", () => {
    render(<TokenUsageAdminTiles summary={summary} metric="cost" singleCustomerMode />);

    expect(screen.getByTestId("tile-customer")).toBeInTheDocument();
    expect(screen.queryByTestId("tile-platform")).not.toBeInTheDocument();
  });

  it("suppresses the delta rather than showing Infinity when the previous window is zero", () => {
    const zeroPrev = summary.map((r) => (r.window === "previous" ? { ...r, cost: 0 } : r));
    render(<TokenUsageAdminTiles summary={zeroPrev as any} metric="cost" singleCustomerMode={false} />);

    expect(screen.getByTestId("tile-customer-delta")).toHaveTextContent("—");
  });
});
