import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsTimelineChart } from "../AnalyticsTimelineChart";

// recharts lays nothing out in jsdom (zero-size container), so the legend never
// renders here; the chart config the legend reads its labels from is exposed instead.
vi.mock("../../../../shadcnui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../shadcnui")>();
  return {
    ...actual,
    ChartContainer: ({ config }: { config: Record<string, { label?: string }> }) => (
      <div data-testid="chart-config">{JSON.stringify(config)}</div>
    ),
  };
});

const configLabels = () =>
  Object.values(JSON.parse(screen.getByTestId("chart-config").textContent!) as Record<string, { label: string }>).map(
    (entry) => entry.label,
  );

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

  it("uses firstSeriesLabel for the first series", () => {
    render(<AnalyticsTimelineChart rows={[row("2026-10-01", "users", 3, 10)]} firstSeriesLabel="Users" />);

    expect(configLabels()).toEqual(["Users", "analytics.admin.series.page_views"]);
  });

  it("defaults the first series label to visitors", () => {
    render(<AnalyticsTimelineChart rows={[row("2026-10-01", "visitors", 3, 10)]} />);

    expect(configLabels()).toEqual(["analytics.admin.series.visitors", "analytics.admin.series.page_views"]);
  });
});
