import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsTracker } from "../AnalyticsTracker";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  track: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("../../data/AnalyticsService", () => ({
  AnalyticsService: { track: mocks.track },
}));

// The cookie helpers come from Task 7. These stand-ins keep the same contract
// against jsdom's document.cookie so the assertions below read the real cookie jar.
vi.mock("../../lib/visitorCookie", () => {
  const NAME = "analytics_visitor";
  const readVisitorCookie = vi.fn(() => {
    const entry = document.cookie.split("; ").find((part) => part.startsWith(`${NAME}=`));
    return entry ? entry.slice(NAME.length + 1) : undefined;
  });
  return {
    ANALYTICS_VISITOR_COOKIE: NAME,
    readVisitorCookie,
    ensureVisitorCookie: vi.fn(() => {
      const existing = readVisitorCookie();
      if (existing) return existing;
      const id = crypto.randomUUID();
      document.cookie = `${NAME}=${id}; path=/; SameSite=Lax`;
      return id;
    }),
    clearVisitorCookie: vi.fn(() => {
      document.cookie = `${NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }),
  };
});

vi.mock("../../lib/utm", () => ({
  readUtm: vi.fn((search: string) => {
    const params = new URLSearchParams(search);
    const source = params.get("utm_source");
    return source ? { utmSource: source } : {};
  }),
}));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const publicSection = () => "public" as const;

const setReferrer = (value: string) => {
  Object.defineProperty(document, "referrer", { value, configurable: true });
};

const setWebdriver = (value: boolean) => {
  Object.defineProperty(window.navigator, "webdriver", { value, configurable: true });
};

const clearCookie = () => {
  document.cookie = "analytics_visitor=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

const eventAt = (index: number) => mocks.track.mock.calls[index][0];

describe("AnalyticsTracker", () => {
  beforeEach(() => {
    mocks.pathname = "/";
    mocks.track.mockReset();
    mocks.track.mockResolvedValue(undefined);
    setReferrer("");
    setWebdriver(false);
    clearCookie();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    clearCookie();
  });

  it("sends one event per pathname and none on re-render with the same pathname", () => {
    mocks.pathname = "/pricing";
    const { rerender } = render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);
    expect(mocks.track).toHaveBeenCalledTimes(1);

    mocks.pathname = "/about";
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);
    expect(mocks.track).toHaveBeenCalledTimes(2);
    expect(eventAt(1)).toEqual(expect.objectContaining({ path: "/about", section: "public" }));
  });

  it("first event carries referrer and UTM, later events do not", () => {
    setReferrer("https://www.linkedin.com/");
    window.history.replaceState(null, "", "/?utm_source=linkedin");
    mocks.pathname = "/";
    const { rerender } = render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    mocks.pathname = "/pricing";
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
    expect(eventAt(0)).toEqual(expect.objectContaining({ referrer: expect.any(String), utmSource: "linkedin" }));
    expect(eventAt(1).utmSource).toBeUndefined();
    expect(eventAt(1).referrer).toBeUndefined();
  });

  it("re-sends the first event's attribution when consent is granted", () => {
    setReferrer("https://www.linkedin.com/");
    window.history.replaceState(null, "", "/?utm_source=linkedin");
    mocks.pathname = "/";
    const { rerender } = render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    rerender(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);

    mocks.pathname = "/pricing";
    rerender(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);

    expect(mocks.track).toHaveBeenCalledTimes(3);
    expect(eventAt(1)).toEqual(
      expect.objectContaining({
        utmSource: "linkedin",
        referrer: eventAt(0).referrer,
        visitorId: expect.stringMatching(UUID),
      }),
    );
    expect(eventAt(1).referrer).toBe("https://www.linkedin.com/");
    expect(eventAt(2).utmSource).toBeUndefined();
    expect(eventAt(2).referrer).toBeUndefined();
  });

  it("drops a same-host referrer", () => {
    setReferrer(`${window.location.origin}/pricing`);
    mocks.pathname = "/about";
    render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    expect(eventAt(0).referrer).toBeUndefined();
  });

  it("keeps an external referrer", () => {
    setReferrer("https://news.ycombinator.com/item?id=1");
    mocks.pathname = "/about";
    render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    expect(eventAt(0).referrer).toBe("https://news.ycombinator.com/item?id=1");
  });

  it("masks segments under sensitive prefixes", () => {
    const prefixes = ["/reset", "/activation", "/invitation"];
    mocks.pathname = "/reset/abc123";
    const { rerender } = render(
      <AnalyticsTracker hasConsent={false} resolveSection={publicSection} sensitivePrefixes={prefixes} />,
    );

    mocks.pathname = "/invitation/abc123/def456";
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} sensitivePrefixes={prefixes} />);

    mocks.pathname = "/activation";
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} sensitivePrefixes={prefixes} />);

    expect(eventAt(0).path).toBe("/reset/:code");
    expect(eventAt(1).path).toBe("/invitation/:code/:code");
    expect(eventAt(2).path).toBe("/activation");
  });

  it("leaves other paths untouched", () => {
    const prefixes = ["/reset"];
    mocks.pathname = "/resets/abc123";
    const { rerender } = render(
      <AnalyticsTracker hasConsent={false} resolveSection={publicSection} sensitivePrefixes={prefixes} />,
    );

    mocks.pathname = "/rolls/abc123";
    rerender(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} sensitivePrefixes={prefixes} />);

    expect(eventAt(0).path).toBe("/resets/abc123");
    expect(eventAt(1).path).toBe("/rolls/abc123");
  });

  it("strips query and hash from path", () => {
    window.history.replaceState(null, "", "/pricing?x=1#plans");
    mocks.pathname = "/pricing";
    render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    expect(eventAt(0).path).toBe("/pricing");
  });

  it("sends the cookie id only with consent, and creates it", () => {
    mocks.pathname = "/pricing";
    render(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);

    expect(eventAt(0).visitorId).toMatch(UUID);
    expect(document.cookie).toContain(`analytics_visitor=${eventAt(0).visitorId}`);
  });

  it("sends no id and clears the cookie without consent", () => {
    document.cookie = "analytics_visitor=6f1c2d3e-0000-4000-8000-000000000001; path=/";
    mocks.pathname = "/pricing";
    render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);

    expect(eventAt(0).visitorId).toBeUndefined();
    expect(document.cookie).not.toContain("analytics_visitor");
  });

  it("switches to cookie id after consent", () => {
    mocks.pathname = "/pricing";
    const { rerender } = render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />);
    expect(eventAt(0).visitorId).toBeUndefined();

    rerender(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);

    expect(mocks.track).toHaveBeenCalledTimes(2);
    expect(eventAt(1)).toEqual(expect.objectContaining({ path: "/pricing", visitorId: expect.stringMatching(UUID) }));
  });

  it("skips automated browsers and the analytics admin pages", () => {
    setWebdriver(true);
    mocks.pathname = "/pricing";
    const { unmount } = render(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);
    expect(mocks.track).not.toHaveBeenCalled();
    unmount();

    setWebdriver(false);
    mocks.pathname = "/administration/analytics";
    render(<AnalyticsTracker hasConsent={true} resolveSection={publicSection} />);
    expect(mocks.track).not.toHaveBeenCalled();
  });

  it("passes the app's section", () => {
    const resolveSection = vi.fn(() => "app" as const);
    mocks.pathname = "/rolls";
    render(<AnalyticsTracker hasConsent={false} resolveSection={resolveSection} />);

    expect(resolveSection).toHaveBeenCalledWith("/rolls");
    expect(eventAt(0).section).toBe("app");
  });

  it("never throws when track rejects", async () => {
    mocks.track.mockRejectedValue(new Error("network down"));
    mocks.pathname = "/pricing";

    expect(() => render(<AnalyticsTracker hasConsent={false} resolveSection={publicSection} />)).not.toThrow();
    await Promise.resolve();
    expect(mocks.track).toHaveBeenCalledTimes(1);
  });
});
