import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TokenUsageTimelineChart } from "../TokenUsageTimelineChart";

const row = (bucket: string, series: string, cost: number) =>
  ({
    id: `${bucket}|${series}`,
    bucket: new Date(bucket),
    series,
    cost,
    credits: 0,
    tokensIn: 0,
    tokensOut: 0,
    cached: 0,
    calls: 1,
  }) as any;

describe("TokenUsageTimelineChart", () => {
  it("pivots flat rows into one entry per bucket with a key per series", () => {
    render(
      <TokenUsageTimelineChart
        rows={[row("2026-08-01", "customer", 1), row("2026-08-01", "platform", 2), row("2026-08-02", "customer", 3)]}
        metric="cost"
        stackBy="scope"
      />,
    );

    const data = JSON.parse(screen.getByTestId("timeline-data").textContent!);
    expect(data).toHaveLength(2);
    expect(data[0]).toMatchObject({ customer: 1, platform: 2 });
    expect(data[1]).toMatchObject({ customer: 3 });
  });

  it("folds series beyond the 7-colour ceiling into a single 'other' series", () => {
    const rows = Array.from({ length: 10 }, (_, i) => row("2026-08-01", `type${i}`, 10 - i));
    render(<TokenUsageTimelineChart rows={rows} metric="cost" stackBy="type" />);

    const series = JSON.parse(screen.getByTestId("timeline-series").textContent!);
    expect(series).toHaveLength(8);
    expect(series[7]).toBe("other");
  });

  it("renders the empty state without a chart when there are no rows", () => {
    render(<TokenUsageTimelineChart rows={[]} metric="cost" stackBy="scope" />);
    expect(screen.queryByTestId("timeline-data")).not.toBeInTheDocument();
  });
});
