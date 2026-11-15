import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsBreakdownTable } from "../AnalyticsBreakdownTable";

const row = (dimension: string, key: string, visitors: number) =>
  ({ id: `${dimension}|${key}`, dimension, key, visitors, sessions: visitors, pageViews: visitors * 2 }) as any;

const breakdowns = {
  source: [row("source", "(none)", 5), row("source", "linkedin", 30), row("source", "google", 12)],
  medium: [],
  campaign: [],
  referrer: [row("referrer", "reddit.com", 9)],
  route: [row("route", "/rolls/:id", 9)],
  landing: [],
  exit: [],
} as any;

describe("AnalyticsBreakdownTable", () => {
  it("renders exactly the four attribution tabs", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
      "analytics.admin.dimensions.source",
      "analytics.admin.dimensions.medium",
      "analytics.admin.dimensions.campaign",
      "analytics.admin.dimensions.referrer",
    ]);
    expect(screen.queryByRole("tab", { name: "analytics.admin.dimensions.route" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "analytics.admin.dimensions.landing" })).not.toBeInTheDocument();
  });

  it("sorts rows by visitors descending and renders the (none) key as-is", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    const rows = screen.getAllByTestId(/^analytics-breakdown-row-/);
    expect(rows.map((r) => within(r).getAllByRole("cell")[0].textContent)).toEqual(["linkedin", "google", "(none)"]);
  });

  it("shows the selected dimension's rows when its tab is clicked", () => {
    render(<AnalyticsBreakdownTable breakdowns={breakdowns} />);

    fireEvent.click(screen.getByRole("tab", { name: "analytics.admin.dimensions.referrer" }));

    expect(screen.getByText("reddit.com")).toBeInTheDocument();
    expect(screen.queryByText("linkedin")).not.toBeInTheDocument();
  });
});
