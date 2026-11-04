import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsDailyUniquesChart, buildDailyUniquesSeries } from "../AnalyticsDailyUniquesChart";

const row = (day: string, visitors: number | null, users: number | null) =>
  ({
    id: day,
    day: new Date(day),
    visitors,
    users,
  }) as any;

const ROWS = [row("2026-11-01", 5, 2), row("2026-11-02", 3, null), row("2026-11-03", 0, 0), row("2026-11-04", 4, 1)];

describe("AnalyticsDailyUniquesChart", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes one visitors point per row, in order", () => {
    render(<AnalyticsDailyUniquesChart rows={ROWS} metric="visitors" />);

    const data = JSON.parse(screen.getByTestId("analytics-daily-visitors-data").textContent!);
    expect(data).toEqual([
      { day: "2026-11-01", value: 5 },
      { day: "2026-11-02", value: 3 },
      { day: "2026-11-03", value: 0 },
      { day: "2026-11-04", value: 4 },
    ]);
  });

  it("exposes one users point per row, keeping null as null and 0 as 0", () => {
    render(<AnalyticsDailyUniquesChart rows={ROWS} metric="users" />);

    const data = JSON.parse(screen.getByTestId("analytics-daily-users-data").textContent!);
    expect(data).toEqual([
      { day: "2026-11-01", value: 2 },
      { day: "2026-11-02", value: null },
      { day: "2026-11-03", value: 0 },
      { day: "2026-11-04", value: 1 },
    ]);
  });

  it("renders the empty state without a data node when there are no rows", () => {
    render(<AnalyticsDailyUniquesChart rows={[]} metric="visitors" />);

    expect(screen.queryByTestId("analytics-daily-visitors-data")).not.toBeInTheDocument();
    expect(screen.getByText("analytics.admin.no_data")).toBeInTheDocument();
  });

  it("draws the chart, not the empty state, when every day is zero", () => {
    render(<AnalyticsDailyUniquesChart rows={[row("2026-11-03", 0, 0), row("2026-11-04", 0, 0)]} metric="users" />);

    expect(screen.getByTestId("analytics-daily-users-data")).toBeInTheDocument();
    expect(screen.queryByText("analytics.admin.no_data")).not.toBeInTheDocument();
  });
});

describe("buildDailyUniquesSeries", () => {
  it("moves the yesterday-to-today segment onto the dotted series when both days have values", () => {
    const series = buildDailyUniquesSeries(ROWS, "visitors", "2026-11-04");

    expect(series.map((entry) => entry.line)).toEqual([5, 3, 0, null]);
    expect(series.map((entry) => entry.todayLine)).toEqual([null, null, 0, 4]);
    expect(series.map((entry) => entry.isToday)).toEqual([false, false, false, true]);
  });

  it("draws no dotted segment when yesterday is unknown, and leaves null days as gaps", () => {
    const rows = [row("2026-11-03", 2, null), row("2026-11-04", 4, 1)];
    const series = buildDailyUniquesSeries(rows, "users", "2026-11-04");

    expect(series.map((entry) => entry.line)).toEqual([null, 1]);
    expect(series.map((entry) => entry.todayLine)).toEqual([null, null]);
    expect(series[1].isToday).toBe(true);
  });

  it("draws no dotted segment when the range ends before today", () => {
    const series = buildDailyUniquesSeries(ROWS.slice(0, 3), "visitors", "2026-11-04");

    expect(series.map((entry) => entry.line)).toEqual([5, 3, 0]);
    expect(series.every((entry) => entry.todayLine === null && !entry.isToday)).toBe(true);
  });
});
