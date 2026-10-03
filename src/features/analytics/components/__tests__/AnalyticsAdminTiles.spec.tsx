import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsAdminTiles } from "../AnalyticsAdminTiles";

const row = (section: string, window: string, values: Partial<Record<string, number>>) =>
  ({
    id: `${section}|${window}`,
    section,
    window,
    visitors: 0,
    sessions: 0,
    pageViews: 0,
    pagesPerSession: 0,
    consentShare: 0,
    ...values,
  }) as any;

const summary = [
  row("total", "current", { visitors: 120, sessions: 150, pageViews: 600, pagesPerSession: 4, consentShare: 0.25 }),
  row("total", "previous", { visitors: 100 }),
];

describe("AnalyticsAdminTiles", () => {
  it("shows the current totals with the delta against the previous window", () => {
    render(<AnalyticsAdminTiles summary={summary} />);

    expect(screen.getByTestId("analytics-tile-visitors")).toHaveTextContent("120");
    expect(screen.getByTestId("analytics-tile-visitors-delta")).toHaveTextContent("+20%");
    expect(screen.getByTestId("analytics-tile-consent-share")).toHaveTextContent("25%");
    expect(screen.getByTestId("analytics-tile-pages-per-session")).toHaveTextContent("4.0");
  });

  it("suppresses the delta rather than showing Infinity when the previous window is zero", () => {
    render(<AnalyticsAdminTiles summary={summary} />);

    // sessions previous is 0
    expect(screen.getByTestId("analytics-tile-sessions-delta")).toHaveTextContent("—");
  });
});
