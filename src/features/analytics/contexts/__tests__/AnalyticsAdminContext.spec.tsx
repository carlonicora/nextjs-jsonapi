import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { formatLocalDate } from "../../../../core";
import { AnalyticsAdminService } from "../../data/AnalyticsAdminService";
import { AnalyticsAdminProvider, useAnalyticsAdmin } from "../AnalyticsAdminContext";

vi.mock("../../data/AnalyticsAdminService", () => ({
  AnalyticsAdminService: {
    getSummary: vi.fn(async () => []),
    getTimeline: vi.fn(async () => []),
    getBreakdown: vi.fn(async () => []),
    getSessions: vi.fn(async () => []),
    getDailyUniques: vi.fn(async () => []),
    next: vi.fn(async () => []),
  },
}));

// The registry throws for modules nobody registered; the provider only needs
// the sessions module as the `type` of the load-more request.
vi.mock("../../../../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../core")>();
  return {
    ...actual,
    Modules: { AnalyticsSession: { name: "analytics/administration/sessions" } },
  };
});

function Probe() {
  const ctx = useAnalyticsAdmin();
  return (
    <div>
      <span data-testid="sessions">{ctx.sessions.map((s) => s.id).join(",")}</span>
      <span data-testid="has-more">{String(ctx.hasMoreSessions)}</span>
      <span data-testid="section">{ctx.filters.section}</span>
      <span data-testid="daily-uniques">{ctx.dailyUniques.map((d) => d.id).join(",")}</span>
      <span data-testid="error">{ctx.error ?? ""}</span>
      <button type="button" onClick={() => ctx.setFilters({ section: "app" })}>
        app
      </button>
      <button type="button" onClick={() => void ctx.loadMoreSessions()}>
        more
      </button>
    </div>
  );
}

function BreadcrumbProbe() {
  const { breadcrumbs } = useSharedContext();
  return <span data-testid="breadcrumbs">{JSON.stringify(breadcrumbs)}</span>;
}

describe("AnalyticsAdminContext", () => {
  // The mocked service is module-level, so its call counts survive across tests.
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when used outside its provider", () => {
    expect(() => render(<Probe />)).toThrow();
  });

  it("requests every panel on mount: summary, timeline, one breakdown per dimension and the sessions", async () => {
    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(AnalyticsAdminService.getSessions).toHaveBeenCalledTimes(1));

    expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1);
    expect(AnalyticsAdminService.getTimeline).toHaveBeenCalledWith(
      expect.objectContaining({ section: "all", granularity: "day" }),
    );

    const breakdowns = vi
      .mocked(AnalyticsAdminService.getBreakdown)
      .mock.calls.map(([args]) => [args.dimension, args.limit]);
    expect(breakdowns).toEqual(
      expect.arrayContaining([
        ["source", 20],
        ["medium", 20],
        ["campaign", 20],
        ["referrer", 20],
        ["route", 20],
        ["landing", 20],
      ]),
    );
    expect(breakdowns).toHaveLength(6);
  });

  it("requests the daily uniques once with the local calendar dates of the range and exposes them", async () => {
    vi.mocked(AnalyticsAdminService.getDailyUniques).mockResolvedValueOnce([
      { id: "2026-11-03" },
      { id: "2026-11-04" },
    ] as any);

    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("daily-uniques")).toHaveTextContent("2026-11-03,2026-11-04"));

    expect(AnalyticsAdminService.getDailyUniques).toHaveBeenCalledTimes(1);
    const { from, to } = vi.mocked(AnalyticsAdminService.getSummary).mock.calls[0][0];
    expect(AnalyticsAdminService.getDailyUniques).toHaveBeenCalledWith({
      fromDate: formatLocalDate(new Date(from)),
      toDate: formatLocalDate(new Date(to)),
    });
  });

  it("sets the page error when the daily uniques request fails", async () => {
    vi.mocked(AnalyticsAdminService.getDailyUniques).mockRejectedValueOnce(new Error("daily uniques failed"));

    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("daily uniques failed"));
  });

  it("defaults to the last 30 days", async () => {
    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalled());

    const { from, to } = vi.mocked(AnalyticsAdminService.getSummary).mock.calls[0][0];
    const days = (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBe(30);
  });

  it("refetches when a filter changes", async () => {
    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );
    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("app"));

    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(2));
    expect(AnalyticsAdminService.getSummary).toHaveBeenLastCalledWith(expect.objectContaining({ section: "app" }));
    expect(screen.getByTestId("section")).toHaveTextContent("app");
  });

  it("appends the next page of sessions on loadMoreSessions", async () => {
    vi.mocked(AnalyticsAdminService.getSessions).mockImplementationOnce(async (params: any) => {
      params.next.next = "https://api.example.com/analytics/administration/sessions?page[cursor]=2";
      return [{ id: "s1" }] as any;
    });
    vi.mocked(AnalyticsAdminService.next).mockResolvedValueOnce([{ id: "s2" }] as any);

    render(
      <AnalyticsAdminProvider>
        <Probe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1"));
    expect(screen.getByTestId("has-more")).toHaveTextContent("true");

    await act(async () => {
      fireEvent.click(screen.getByText("more"));
    });

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1,s2"));
    expect(AnalyticsAdminService.next).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "https://api.example.com/analytics/administration/sessions?page[cursor]=2",
      }),
    );
    expect(screen.getByTestId("has-more")).toHaveTextContent("false");
  });

  it("publishes the dashboard as an unlinked breadcrumb, since it is the current page", async () => {
    render(
      <AnalyticsAdminProvider>
        <BreadcrumbProbe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(AnalyticsAdminService.getSessions).toHaveBeenCalled());
    expect(screen.getByTestId("breadcrumbs")).toHaveTextContent(JSON.stringify([{ name: "analytics.admin.title" }]));
  });
});
