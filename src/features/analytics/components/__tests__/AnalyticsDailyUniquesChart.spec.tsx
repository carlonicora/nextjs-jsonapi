import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsDailyUniquesChart, buildDailyUniquesSeries } from "../AnalyticsDailyUniquesChart";

const row = (day: string, visitors: number) =>
  ({
    id: day,
    bucket: new Date(day),
    section: "visitors",
    visitors,
    sessions: visitors,
    pageViews: visitors,
  }) as any;

const FROM = "2026-11-01T10:00:00.000Z";
const TO = "2026-11-04T10:00:00.000Z";

/** 2026-11-02 has no row: nobody came that day. */
const ROWS = [row("2026-11-01", 5), row("2026-11-03", 0), row("2026-11-04", 4)];

describe("AnalyticsDailyUniquesChart", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes one visitors point per day of the range, in order, a missing day as 0", () => {
    render(<AnalyticsDailyUniquesChart rows={ROWS} from={FROM} to={TO} metric="visitors" />);

    const data = JSON.parse(screen.getByTestId("analytics-daily-visitors-data").textContent!);
    expect(data).toEqual([
      { day: "2026-11-01", value: 5 },
      { day: "2026-11-02", value: 0 },
      { day: "2026-11-03", value: 0 },
      { day: "2026-11-04", value: 4 },
    ]);
  });

  it("exposes the users points under the users testid", () => {
    render(<AnalyticsDailyUniquesChart rows={[row("2026-11-03", 2)]} from={FROM} to={TO} metric="users" />);

    const data = JSON.parse(screen.getByTestId("analytics-daily-users-data").textContent!);
    expect(data).toEqual([
      { day: "2026-11-01", value: 0 },
      { day: "2026-11-02", value: 0 },
      { day: "2026-11-03", value: 2 },
      { day: "2026-11-04", value: 0 },
    ]);
  });

  it("draws the chart, not the empty state, when there are no rows", () => {
    render(<AnalyticsDailyUniquesChart rows={[]} from={FROM} to={TO} metric="visitors" />);

    expect(screen.getByTestId("analytics-daily-visitors-data")).toBeInTheDocument();
    expect(screen.queryByText("analytics.admin.no_data")).not.toBeInTheDocument();
  });

  it("renders the empty state without a data node when the range has no day", () => {
    render(<AnalyticsDailyUniquesChart rows={[]} from={TO} to={FROM} metric="visitors" />);

    expect(screen.queryByTestId("analytics-daily-visitors-data")).not.toBeInTheDocument();
    expect(screen.getByText("analytics.admin.no_data")).toBeInTheDocument();
  });
});

describe("buildDailyUniquesSeries", () => {
  it("moves the yesterday-to-today segment onto the dotted series", () => {
    const series = buildDailyUniquesSeries(ROWS, FROM, TO, "2026-11-04");

    expect(series.map((entry) => entry.line)).toEqual([5, 0, 0, null]);
    expect(series.map((entry) => entry.todayLine)).toEqual([null, null, 0, 4]);
    expect(series.map((entry) => entry.isToday)).toEqual([false, false, false, true]);
  });

  it("spans the days picked in the browser, so a one-day pick is one point in any timezone", () => {
    // What the filter bar sends for a one-day pick: local midnight to local end of day.
    const from = new Date(2026, 10, 11, 0, 0, 0, 0).toISOString();
    const to = new Date(2026, 10, 11, 23, 59, 59, 999).toISOString();

    const series = buildDailyUniquesSeries([], from, to, "2026-11-20");

    expect(series.map((entry) => entry.day)).toEqual(["2026-11-11"]);
  });

  it("draws no dotted segment when the range ends before today", () => {
    const series = buildDailyUniquesSeries(ROWS, FROM, "2026-11-03T10:00:00.000Z", "2026-11-04");

    expect(series.map((entry) => entry.line)).toEqual([5, 0, 0]);
    expect(series.every((entry) => entry.todayLine === null && !entry.isToday)).toBe(true);
  });
});
