import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnalyticsTimelineChart } from "../AnalyticsTimelineChart";

const row = (bucket: string, section: string, visitors: number, pageViews: number) =>
  ({
    id: `${bucket}|${section}`,
    bucket: new Date(bucket),
    section,
    visitors,
    sessions: visitors,
    pageViews,
  }) as any;

describe("AnalyticsTimelineChart", () => {
  it("pivots flat rows into one entry per bucket with visitors and pageViews", () => {
    render(
      <AnalyticsTimelineChart
        rows={[row("2026-10-01", "public", 3, 10), row("2026-10-01", "app", 2, 5), row("2026-10-02", "public", 4, 8)]}
      />,
    );

    const data = JSON.parse(screen.getByTestId("analytics-timeline-data").textContent!);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ bucket: "2026-10-01", visitors: 5, pageViews: 15 });
    expect(data[1]).toMatchObject({ bucket: "2026-10-02", visitors: 4, pageViews: 8 });
  });

  it("renders the empty state without a data node when there are no rows", () => {
    render(<AnalyticsTimelineChart rows={[]} />);

    expect(screen.queryByTestId("analytics-timeline-data")).not.toBeInTheDocument();
    expect(screen.getByText("analytics.admin.no_data")).toBeInTheDocument();
  });
});
