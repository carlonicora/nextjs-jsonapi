import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { configureI18n } from "../../../../i18n";
import { AnalyticsAdminService } from "../../data/AnalyticsAdminService";
import { AnalyticsJourneyContainer } from "../AnalyticsJourneyContainer";

vi.mock("../../data/AnalyticsAdminService", () => ({
  AnalyticsAdminService: {
    getSession: vi.fn(),
    getSessionPageViews: vi.fn(),
    getSessions: vi.fn(),
  },
}));

// The real page chrome needs the whole app shell (header, sidebar, navigation
// contexts); the journey's own content is what is under test here.
vi.mock("../../../../components", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../../components")>();
  return {
    ...actual,
    RoundPageContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
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
    utmMedium: "social",
    utmCampaign: "launch",
    deviceType: "desktop",
  }) as any;

const pageView = (id: string, createdAt: string, path: string) =>
  ({ id, createdAt: new Date(createdAt), path, route: path, section: "public" }) as any;

describe("AnalyticsJourneyContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AnalyticsAdminService.getSession).mockResolvedValue(session("s1", "2026-10-01T10:00:00.000Z"));
    vi.mocked(AnalyticsAdminService.getSessionPageViews).mockResolvedValue([
      pageView("p1", "2026-10-01T10:00:00.000Z", "/pricing"),
      pageView("p2", "2026-10-01T10:02:00.000Z", "/features"),
      pageView("p3", "2026-10-01T10:02:30.000Z", "/register"),
    ]);
    vi.mocked(AnalyticsAdminService.getSessions).mockResolvedValue([
      session("s1", "2026-10-01T10:00:00.000Z"),
      session("s9", "2026-09-20T08:00:00.000Z"),
    ]);
  });

  it("renders the page views in order with the gap to the previous one", async () => {
    render(<AnalyticsJourneyContainer sessionId="s1" />);

    const rows = await screen.findAllByTestId(/^analytics-pageview-row-/);
    expect(rows.map((row) => within(row).getAllByRole("cell")[2].textContent)).toEqual([
      "/pricing",
      "/features",
      "/register",
    ]);
    expect(within(rows[1]).getByText("2 min")).toBeInTheDocument();
    expect(AnalyticsAdminService.getSessionPageViews).toHaveBeenCalledWith({ sessionId: "s1" });
  });

  it("renders the attribution header", async () => {
    render(<AnalyticsJourneyContainer sessionId="s1" />);

    const header = await screen.findByTestId("analytics-journey-attribution");
    expect(header).toHaveTextContent("linkedin");
    expect(header).toHaveTextContent("analytics.admin.consented");
  });

  it("lists the visitor's other sessions, excluding the current one", async () => {
    render(<AnalyticsJourneyContainer sessionId="s1" />);

    await waitFor(() =>
      expect(AnalyticsAdminService.getSessions).toHaveBeenCalledWith(
        expect.objectContaining({ visitorId: "visitor-0000-0000-abc123", section: "all" }),
      ),
    );
    expect(await screen.findByTestId("analytics-session-link-s9")).toHaveAttribute(
      "href",
      "/administration/analytics/sessions/s9",
    );
    expect(screen.queryByTestId("analytics-session-link-s1")).not.toBeInTheDocument();
  });
});
