import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSharedContext } from "../../../../contexts/SharedContext";
import { AnalyticsAdminService } from "../../data/AnalyticsAdminService";
import { AnalyticsAdminProvider, useAnalyticsAdmin } from "../AnalyticsAdminContext";

vi.mock("../../data/AnalyticsAdminService", () => ({
  AnalyticsAdminService: {
    getSummary: vi.fn(async () => []),
    getTimeline: vi.fn(async () => []),
    getBreakdown: vi.fn(async () => []),
    getSessions: vi.fn(async () => []),
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

const NEXT_PAGE = "https://api.example.com/analytics/administration/sessions?page[cursor]=2";

/** A promise the test settles by hand, to control when a response lands. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Every (audience, isLoading) pair the provider rendered, in order. */
let renders: { audience: string; isLoading: boolean }[] = [];

function Probe() {
  const ctx = useAnalyticsAdmin();
  renders.push({ audience: ctx.filters.audience, isLoading: ctx.isLoading });
  return (
    <div>
      <span data-testid="summary">{ctx.summary.map((s) => s.id).join(",")}</span>
      <span data-testid="timeline">{ctx.timeline.map((r) => r.id).join(",")}</span>
      <span data-testid="daily-timeline">{ctx.dailyTimeline.map((r) => r.id).join(",")}</span>
      <span data-testid="breakdown-source">{ctx.breakdowns.source.map((b) => b.id).join(",")}</span>
      <span data-testid="breakdown-route">{ctx.breakdowns.route.map((b) => b.id).join(",")}</span>
      <span data-testid="sessions">{ctx.sessions.map((s) => s.id).join(",")}</span>
      <span data-testid="has-more">{String(ctx.hasMoreSessions)}</span>
      <span data-testid="audience">{ctx.filters.audience}</span>
      <span data-testid="loading">{String(ctx.isLoading)}</span>
      <span data-testid="error">{ctx.error ?? ""}</span>
      <button type="button" onClick={() => ctx.setFilters({ audience: "users" })}>
        users
      </button>
      <button type="button" onClick={() => ctx.setFilters({ granularity: "week" })}>
        week
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

function TitleProbe() {
  const { title } = useSharedContext();
  return <div data-testid="title-functions">{title.functions}</div>;
}

const renderProvider = () =>
  render(
    <AnalyticsAdminProvider>
      <Probe />
    </AnalyticsAdminProvider>,
  );

/** The first sessions page reports a next page, so Load more has somewhere to go. */
const firstSessionsPageWithMore = () =>
  vi.mocked(AnalyticsAdminService.getSessions).mockImplementationOnce(async (params: any) => {
    params.next.next = NEXT_PAGE;
    return [{ id: "s1" }] as any;
  });

describe("AnalyticsAdminContext", () => {
  // The mocked service is module-level, so its call counts survive across tests.
  beforeEach(() => {
    vi.clearAllMocks();
    renders = [];
  });

  it("throws when used outside its provider", () => {
    expect(() => render(<Probe />)).toThrow();
  });

  it("requests the visitors tab on mount", async () => {
    renderProvider();

    await waitFor(() => expect(AnalyticsAdminService.getSessions).toHaveBeenCalledTimes(1));

    expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1);
    expect(AnalyticsAdminService.getSummary).toHaveBeenCalledWith(expect.objectContaining({ audience: "visitors" }));
    // Day is the default granularity: one day timeline serves Over time and the daily chart.
    expect(vi.mocked(AnalyticsAdminService.getTimeline).mock.calls.map(([args]) => args)).toEqual([
      expect.objectContaining({ audience: "visitors", granularity: "day" }),
    ]);
    expect(AnalyticsAdminService.getSessions).toHaveBeenCalledWith(expect.objectContaining({ audience: "visitors" }));

    const breakdowns = vi
      .mocked(AnalyticsAdminService.getBreakdown)
      .mock.calls.map(([args]) => [args.dimension, args.limit, args.audience]);
    expect(breakdowns).toEqual([
      ["source", 20, "visitors"],
      ["medium", 20, "visitors"],
      ["campaign", 20, "visitors"],
      ["referrer", 20, "visitors"],
      ["route", 10, "visitors"],
      ["landing", 10, "visitors"],
      ["exit", 10, "visitors"],
    ]);
  });

  it("switching to users requests only the users panels", async () => {
    vi.mocked(AnalyticsAdminService.getBreakdown).mockImplementation(
      async (params: any) => [{ id: `${params.audience}|${params.dimension}` }] as any,
    );

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("breakdown-source")).toHaveTextContent("visitors|source"));

    vi.mocked(AnalyticsAdminService.getBreakdown).mockClear();
    fireEvent.click(screen.getByText("users"));

    await waitFor(() => expect(screen.getByTestId("breakdown-route")).toHaveTextContent("users|route"));
    expect(vi.mocked(AnalyticsAdminService.getBreakdown).mock.calls.map(([args]) => args)).toEqual([
      expect.objectContaining({ dimension: "route", limit: 10, audience: "users" }),
    ]);
    expect(AnalyticsAdminService.getSummary).toHaveBeenLastCalledWith(expect.objectContaining({ audience: "users" }));
    expect(AnalyticsAdminService.getSessions).toHaveBeenLastCalledWith(expect.objectContaining({ audience: "users" }));
    expect(screen.getByTestId("breakdown-source")).toHaveTextContent("");

    vi.mocked(AnalyticsAdminService.getBreakdown).mockImplementation(async () => []);
  });

  it("switching tab empties the panel at once", async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

    // The users summary never answers, so every users render happens before any response.
    vi.mocked(AnalyticsAdminService.getSummary).mockImplementationOnce(() => new Promise(() => {}));
    fireEvent.click(screen.getByText("users"));

    expect(screen.getByTestId("audience")).toHaveTextContent("users");
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
    const usersRenders = renders.filter((r) => r.audience === "users");
    expect(usersRenders.length).toBeGreaterThan(0);
    expect(usersRenders.every((r) => r.isLoading)).toBe(true);
  });

  it("drops a response that arrives after the audience changed", async () => {
    const visitorsSummary = deferred<any>();
    vi.mocked(AnalyticsAdminService.getSummary)
      .mockImplementationOnce(() => visitorsSummary.promise)
      .mockImplementationOnce(async () => [{ id: "users-row" }] as any);

    renderProvider();
    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("users"));
    await waitFor(() => expect(screen.getByTestId("summary")).toHaveTextContent("users-row"));

    await act(async () => {
      visitorsSummary.resolve([{ id: "visitors-row" }]);
    });

    expect(screen.getByTestId("summary")).toHaveTextContent("users-row");
    expect(screen.getByTestId("summary")).not.toHaveTextContent("visitors-row");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  it("drops a Load more page that arrives after the audience changed", async () => {
    firstSessionsPageWithMore();
    vi.mocked(AnalyticsAdminService.getSessions).mockImplementationOnce(async () => [{ id: "u1" }] as any);
    const lateSessions = deferred<any>();
    vi.mocked(AnalyticsAdminService.next).mockImplementationOnce(() => lateSessions.promise);

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1"));

    fireEvent.click(screen.getByText("more"));
    await waitFor(() => expect(AnalyticsAdminService.next).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("users"));
    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("u1"));

    await act(async () => {
      lateSessions.resolve([{ id: "s2" }]);
    });

    expect(screen.getByTestId("sessions").textContent).toBe("u1");
  });

  it("a failed Load more only logs", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    firstSessionsPageWithMore();
    vi.mocked(AnalyticsAdminService.next).mockRejectedValueOnce(new Error("load more failed"));

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1"));

    await act(async () => {
      fireEvent.click(screen.getByText("more"));
    });

    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith("Failed to load more analytics sessions:", expect.any(Error)),
    );
    expect(screen.getByTestId("error").textContent).toBe("");
    expect(screen.getByTestId("sessions").textContent).toBe("s1");
    expect(screen.getByTestId("has-more")).toHaveTextContent("true");

    consoleError.mockRestore();
  });

  it("defaults to the last 30 days", async () => {
    renderProvider();

    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalled());

    const { from, to } = vi.mocked(AnalyticsAdminService.getSummary).mock.calls[0][0];
    const days = (Date.parse(to) - Date.parse(from)) / (24 * 60 * 60 * 1000);
    expect(Math.round(days)).toBe(30);
  });

  it("refetches when a filter changes", async () => {
    renderProvider();
    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByText("week"));

    await waitFor(() => expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(2));
    expect(AnalyticsAdminService.getSummary).toHaveBeenLastCalledWith(
      expect.objectContaining({ audience: "visitors" }),
    );
    const lastTwo = vi
      .mocked(AnalyticsAdminService.getTimeline)
      .mock.calls.slice(-2)
      .map(([args]) => args);
    expect(lastTwo).toEqual([
      expect.objectContaining({ audience: "visitors", granularity: "week" }),
      expect.objectContaining({ audience: "visitors", granularity: "day" }),
    ]);
  });

  it("keeps the daily timeline at day granularity whatever the granularity filter says", async () => {
    vi.mocked(AnalyticsAdminService.getTimeline).mockImplementation(
      async (params: any) => [{ id: `${params.audience}|${params.granularity}` }] as any,
    );

    renderProvider();
    await waitFor(() => expect(screen.getByTestId("daily-timeline")).toHaveTextContent("visitors|day"));

    fireEvent.click(screen.getByText("week"));
    await waitFor(() => expect(screen.getByTestId("timeline")).toHaveTextContent("visitors|week"));
    expect(screen.getByTestId("daily-timeline").textContent).toBe("visitors|day");

    fireEvent.click(screen.getByText("users"));
    await waitFor(() => expect(screen.getByTestId("daily-timeline")).toHaveTextContent("users|day"));
    expect(screen.getByTestId("timeline").textContent).toBe("users|week");

    vi.mocked(AnalyticsAdminService.getTimeline).mockImplementation(async () => []);
  });

  it("appends the next page of sessions on loadMoreSessions", async () => {
    firstSessionsPageWithMore();
    vi.mocked(AnalyticsAdminService.next).mockResolvedValueOnce([{ id: "s2" }] as any);

    renderProvider();

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1"));
    expect(screen.getByTestId("has-more")).toHaveTextContent("true");

    await act(async () => {
      fireEvent.click(screen.getByText("more"));
    });

    await waitFor(() => expect(screen.getByTestId("sessions")).toHaveTextContent("s1,s2"));
    expect(AnalyticsAdminService.next).toHaveBeenCalledWith(expect.objectContaining({ endpoint: NEXT_PAGE }));
    expect(screen.getByTestId("has-more")).toHaveTextContent("false");
  });

  it("publishes the filter bar without a section", async () => {
    render(
      <AnalyticsAdminProvider>
        <TitleProbe />
      </AnalyticsAdminProvider>,
    );

    await waitFor(() => expect(AnalyticsAdminService.getSessions).toHaveBeenCalled());
    const functions = screen.getByTestId("title-functions");
    expect(functions.querySelector('[role="group"][aria-label="analytics.admin.filter.granularity"]')).not.toBeNull();
    expect(functions.querySelector('[role="group"][aria-label="analytics.admin.filter.section"]')).toBeNull();
    expect(functions.querySelector('[role="group"][aria-label="Section"]')).toBeNull();
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
