import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { configureI18n } from "../../../../i18n";
import { AnalyticsAdminService } from "../../data/AnalyticsAdminService";
import { AnalyticsAdminPageContainer } from "../AnalyticsAdminPageContainer";
import { AnalyticsJourneyPageContainer } from "../AnalyticsJourneyPageContainer";

vi.mock("../../data/AnalyticsAdminService", () => ({
  AnalyticsAdminService: {
    getSummary: vi.fn(),
    getTimeline: vi.fn(),
    getBreakdown: vi.fn(),
    getSessions: vi.fn(),
    getSession: vi.fn(),
    getSessionPageViews: vi.fn(),
    next: vi.fn(),
  },
}));

// The real page chrome needs the whole app shell (header, sidebar, navigation
// contexts); the page content is what is under test here.
vi.mock("../../../../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../components")>();
  return {
    ...actual,
    RoundPageContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  };
});

// The containers pass Modules.AnalyticsSummary / AnalyticsSession for the
// header icon; no app bootstrap registers modules here, so the registry lookup
// would throw.
vi.mock("../../../../core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../core")>();
  return {
    ...actual,
    Modules: new Proxy({}, { get: () => undefined }),
  };
});

beforeAll(() => {
  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    usePathname: () => "/",
    Link: ({
      href,
      children,
      prefetch: _prefetch,
      ...rest
    }: {
      href: string;
      children: React.ReactNode;
      [key: string]: any;
    }) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  });
});

const session = (id: string, startedAt: string) =>
  ({
    id,
    visitorId: "visitor-0000-0000-abc123",
    consented: true,
    startedAt: new Date(startedAt),
    lastSeenAt: new Date(startedAt),
    pageViews: 3,
    section: "public",
    landingRoute: "/pricing",
    referrerHost: "linkedin.com",
    utmSource: "linkedin",
    deviceType: "desktop",
  }) as any;

const follows = (a: Node, b: Node) => Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("AnalyticsAdminPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AnalyticsAdminService.getSummary).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getTimeline).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getBreakdown).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getSessions).mockResolvedValue([session("s1", "2026-10-01T10:00:00.000Z")]);
  });

  it("renders the visitors tab panels in order", async () => {
    render(<AnalyticsAdminPageContainer />);

    const panel = await screen.findByTestId("analytics-panel-visitors");
    await within(panel).findByTestId("analytics-tile-visitors");
    expect(screen.getByTestId("analytics-audience-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("analytics-tab-visitors")).toHaveTextContent("analytics.admin.tabs.visitors");
    expect(screen.getByTestId("analytics-tab-users")).toHaveTextContent("analytics.admin.tabs.users");

    const ordered = [
      within(panel).getByTestId("analytics-tile-visitors"),
      within(panel).getByText("analytics.admin.panels.over_time"),
      within(panel).getByTestId("analytics-page-list-top-pages"),
      within(panel).getByTestId("analytics-page-list-entry-pages"),
      within(panel).getByTestId("analytics-page-list-exit-pages"),
      within(panel).getByText("analytics.admin.panels.breakdown"),
      within(panel).getByText("analytics.admin.panels.sessions"),
    ];
    for (let i = 1; i < ordered.length; i += 1) {
      expect(follows(ordered[i - 1], ordered[i])).toBe(true);
    }
    expect(within(panel).getByTestId("analytics-page-list-top-pages")).toHaveTextContent(
      "analytics.admin.panels.top_pages",
    );
    expect(within(panel).queryByTestId("analytics-page-list-most-used-pages")).not.toBeInTheDocument();
  });

  it("the users tab shows the most-used pages card and no Breakdown", async () => {
    render(<AnalyticsAdminPageContainer />);

    await screen.findByTestId("analytics-tile-visitors");
    fireEvent.click(screen.getByTestId("analytics-tab-users"));

    const panel = await screen.findByTestId("analytics-panel-users");
    const mostUsed = await within(panel).findByTestId("analytics-page-list-most-used-pages");
    expect(mostUsed).toHaveTextContent("analytics.admin.panels.most_used_pages");
    expect(within(panel).getByTestId("analytics-tile-visitors")).toHaveTextContent("analytics.admin.tiles.users");
    expect(screen.queryByText("analytics.admin.panels.breakdown")).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-page-list-top-pages")).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-page-list-entry-pages")).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-page-list-exit-pages")).not.toBeInTheDocument();
    expect(follows(within(panel).getByText("analytics.admin.panels.over_time"), mostUsed)).toBe(true);
    expect(follows(mostUsed, within(panel).getByText("analytics.admin.panels.sessions"))).toBe(true);
  });

  it("loads the dashboard and links each session under the given sessionPageUrl", async () => {
    render(<AnalyticsAdminPageContainer sessionPageUrl="/admin/stats/sessions" />);

    expect(await screen.findByTestId("analytics-session-link-s1")).toHaveAttribute("href", "/admin/stats/sessions/s1");
    expect(AnalyticsAdminService.getSummary).toHaveBeenCalledTimes(1);
  });

  it("falls back to the provider's default routes", async () => {
    render(<AnalyticsAdminPageContainer />);

    expect(await screen.findByTestId("analytics-session-link-s1")).toHaveAttribute(
      "href",
      "/administration/analytics/sessions/s1",
    );
  });
});

describe("AnalyticsJourneyPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AnalyticsAdminService.getSession).mockResolvedValue(session("s1", "2026-10-01T10:00:00.000Z"));
    vi.mocked(AnalyticsAdminService.getSessionPageViews).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getSessions).mockResolvedValue([
      session("s1", "2026-10-01T10:00:00.000Z"),
      session("s9", "2026-09-20T08:00:00.000Z"),
    ]);
  });

  it("loads the given session and links the other sessions under pageUrl", async () => {
    render(<AnalyticsJourneyPageContainer sessionId="s1" pageUrl="/admin/stats" />);

    await waitFor(() => expect(AnalyticsAdminService.getSession).toHaveBeenCalledWith({ id: "s1" }));
    expect(await screen.findByTestId("analytics-session-link-s9")).toHaveAttribute("href", "/admin/stats/sessions/s9");
  });
});
