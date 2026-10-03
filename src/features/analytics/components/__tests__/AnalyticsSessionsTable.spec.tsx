import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "../../../../i18n";
import { AnalyticsSessionsTable } from "../AnalyticsSessionsTable";

beforeAll(() => {
  // The package Link resolves its inner component at runtime and throws if i18n
  // was never configured (src/i18n/config.ts).
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

const session = (id: string, extra: Record<string, unknown> = {}) =>
  ({
    id,
    visitorId: `visitor-0000-${id}-abc123`,
    consented: false,
    startedAt: new Date("2026-10-01T10:00:00.000Z"),
    lastSeenAt: new Date("2026-10-01T10:05:00.000Z"),
    pageViews: 3,
    section: "public",
    landingRoute: "/pricing",
    utmSource: "linkedin",
    utmMedium: "social",
    deviceType: "desktop",
    ...extra,
  }) as any;

const SESSION_PAGE_URL = "/administration/analytics/sessions";

describe("AnalyticsSessionsTable", () => {
  it("renders the linked user's name and email", () => {
    render(
      <AnalyticsSessionsTable
        rows={[session("s1", { user: { id: "u1", name: "Ada Lovelace", email: "ada@example.com" } })]}
        sessionPageUrl={SESSION_PAGE_URL}
        onLoadMore={vi.fn()}
        hasMore={false}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
    expect(screen.queryByText("analytics.admin.anonymous")).not.toBeInTheDocument();
  });

  it("renders an anonymous visitor with the last six characters of the visitor id", () => {
    render(
      <AnalyticsSessionsTable
        rows={[session("s2")]}
        sessionPageUrl={SESSION_PAGE_URL}
        onLoadMore={vi.fn()}
        hasMore={false}
      />,
    );

    expect(screen.getByText("analytics.admin.anonymous")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });

  it("links each row to its journey page", () => {
    render(
      <AnalyticsSessionsTable
        rows={[session("s3")]}
        sessionPageUrl={SESSION_PAGE_URL}
        onLoadMore={vi.fn()}
        hasMore={false}
      />,
    );

    expect(screen.getByTestId("analytics-session-link-s3")).toHaveAttribute("href", `${SESSION_PAGE_URL}/s3`);
  });

  it("shows the load-more button only when more sessions exist", () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <AnalyticsSessionsTable
        rows={[session("s4")]}
        sessionPageUrl={SESSION_PAGE_URL}
        onLoadMore={onLoadMore}
        hasMore={false}
      />,
    );
    expect(screen.queryByText("analytics.admin.load_more")).not.toBeInTheDocument();

    rerender(
      <AnalyticsSessionsTable
        rows={[session("s4")]}
        sessionPageUrl={SESSION_PAGE_URL}
        onLoadMore={onLoadMore}
        hasMore
      />,
    );
    fireEvent.click(screen.getByText("analytics.admin.load_more"));
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });
});
