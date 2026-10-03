import { render, screen, waitFor } from "@testing-library/react";
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

describe("AnalyticsAdminPageContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AnalyticsAdminService.getSummary).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getTimeline).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getBreakdown).mockResolvedValue([]);
    vi.mocked(AnalyticsAdminService.getSessions).mockResolvedValue([session("s1", "2026-10-01T10:00:00.000Z")]);
  });

  it("loads the dashboard and links each session under the given sessionPageUrl", async () => {
    render(<AnalyticsAdminPageContainer pageUrl="/admin/stats" sessionPageUrl="/admin/stats/sessions" />);

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
