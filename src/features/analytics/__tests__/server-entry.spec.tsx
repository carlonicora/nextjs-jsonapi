import { beforeEach, describe, expect, it, vi } from "vitest";
import { AnalyticsAdminPageContainer, AnalyticsJourneyPageContainer } from "../index";
import { AnalyticsAdminPage, AnalyticsJourneyPage } from "../server-entry";

const mocks = vi.hoisted(() => ({
  hasRole: vi.fn(),
  redirect: vi.fn((url: string) => {
    // next/navigation's redirect throws to stop rendering; mirror that.
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

// ServerSession reads next/headers cookies, which only exist inside a request.
vi.mock("../../../server", () => ({
  ServerSession: { hasRole: mocks.hasRole },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

describe("analytics server entry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("AnalyticsAdminPage renders the admin container for the role holder", async () => {
    mocks.hasRole.mockResolvedValue(true);

    const element = await AnalyticsAdminPage({
      adminRoleId: "role-admin",
      pageUrl: "/admin/stats",
      sessionPageUrl: "/admin/stats/sessions",
    });

    expect(mocks.hasRole).toHaveBeenCalledWith("role-admin");
    expect(element.type).toBe(AnalyticsAdminPageContainer);
    expect(element.props).toEqual({ pageUrl: "/admin/stats", sessionPageUrl: "/admin/stats/sessions" });
  });

  it("AnalyticsAdminPage redirects to `/` by default without the role", async () => {
    mocks.hasRole.mockResolvedValue(false);

    await expect(AnalyticsAdminPage({ adminRoleId: "role-admin" })).rejects.toThrow("NEXT_REDIRECT:/");
    expect(mocks.redirect).toHaveBeenCalledWith("/");
  });

  it("AnalyticsJourneyPage renders the journey container for the role holder", async () => {
    mocks.hasRole.mockResolvedValue(true);

    const element = await AnalyticsJourneyPage({ adminRoleId: "role-admin", sessionId: "s1", pageUrl: "/admin/stats" });

    expect(element.type).toBe(AnalyticsJourneyPageContainer);
    expect(element.props).toEqual({ sessionId: "s1", pageUrl: "/admin/stats" });
  });

  it("AnalyticsJourneyPage redirects to deniedRedirect without the role", async () => {
    mocks.hasRole.mockResolvedValue(false);

    await expect(
      AnalyticsJourneyPage({ adminRoleId: "role-admin", sessionId: "s1", deniedRedirect: "/401" }),
    ).rejects.toThrow("NEXT_REDIRECT:/401");
  });
});
