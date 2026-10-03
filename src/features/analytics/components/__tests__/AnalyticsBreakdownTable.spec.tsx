import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsBreakdownTable } from "../AnalyticsBreakdownTable";

const row = (dimension: string, key: string, visitors: number) =>
  ({ id: `${dimension}|${key}`, dimension, key, visitors, sessions: visitors, pageViews: visitors * 2 }) as any;

const breakdowns = {
  source: [row("source", "(none)", 5), row("source", "linkedin", 30), row("source", "google", 12)],
  medium: [],
  campaign: [],
  referrer: [],
  route: [row("route", "/rolls/:id", 9)],
  landing: [],
} as any;

describe("AnalyticsBreakdownTable", () => {
  it("renders one tab per dimension", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    expect(screen.getAllByRole("tab")).toHaveLength(6);
  });

  it("sorts rows by visitors descending and renders the (none) key as-is", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    const rows = screen.getAllByTestId(/^analytics-breakdown-row-/);
    expect(rows.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["linkedin", "google", "(none)"]);
  });

  it("shows the selected dimension's rows when its tab is clicked", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    fireEvent.click(screen.getByRole("tab", { name: "analytics.admin.dimensions.route" }));

    expect(screen.getByText("/rolls/:id")).toBeInTheDocument();
    expect(screen.queryByText("linkedin")).not.toBeInTheDocument();
  });
});
