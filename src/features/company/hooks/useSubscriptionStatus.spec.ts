import { describe, it, expect, beforeEach, afterEach, afterAll, beforeAll, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// Mutable mocks the individual tests below configure per case, mirroring the
// vi.hoisted + vi.mock pattern used by NotificationContext.spec.tsx for the
// same CurrentUserContext dependency.
const userMock = vi.hoisted(() => ({ currentUser: null as any, company: null as any }));
const configMock = vi.hoisted(() => ({ stripeKey: "pk_test_123" as string | undefined }));

vi.mock("../../user/contexts/CurrentUserContext", () => ({
  useCurrentUserContext: () => userMock,
}));

vi.mock("../../../roles", () => ({
  isRolesConfigured: () => true,
  getRoleId: () => ({ Administrator: "admin-role-id" }),
}));

vi.mock("../../../client/config", () => ({
  getStripePublishableKey: () => configMock.stripeKey,
}));

import { useSubscriptionStatus } from "./useSubscriptionStatus";

const DAY_MS = 1000 * 60 * 60 * 24;

// Every date case runs on a frozen clock in a zone with DST. The window math
// used to follow the host's local calendar, so the result depended on the day
// the suite ran and on the machine's timezone; pinning both makes it repeatable.
const ORIGINAL_TZ = process.env.TZ;
const FIXED_NOW = new Date("2026-06-15T12:00:00+02:00"); // no DST change within 14 days

const daysAgo = (days: number, now: Date = FIXED_NOW) => new Date(now.getTime() - days * DAY_MS);

describe("useSubscriptionStatus", () => {
  beforeAll(() => {
    process.env.TZ = "Europe/Rome";
  });

  afterAll(() => {
    process.env.TZ = ORIGINAL_TZ;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    userMock.currentUser = null;
    userMock.company = null;
    configMock.stripeKey = "pk_test_123";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports loading while currentUser is still null", () => {
    userMock.currentUser = null;

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("loading");
    expect(result.current.isBlocked).toBe(false);
  });

  it("treats a missing Stripe key as an active subscription", () => {
    userMock.currentUser = { roles: [] };
    configMock.stripeKey = undefined;

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("active");
    expect(result.current.isBlocked).toBe(false);
  });

  it("never blocks an administrator", () => {
    userMock.currentUser = { roles: [{ id: "admin-role-id" }] };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("active");
    expect(result.current.isBlocked).toBe(false);
  });

  it("does not block when company is undefined after loading (an authentication fault, not a billing one)", () => {
    userMock.currentUser = { roles: [] };
    userMock.company = undefined;

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("expired");
    expect(result.current.isBlocked).toBe(false);
  });

  it("is never blocked when the company has an active subscription", () => {
    userMock.currentUser = { roles: [] };
    userMock.company = { isActiveSubscription: true, createdAt: FIXED_NOW };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("active");
    expect(result.current.isBlocked).toBe(false);
  });

  it("does NOT block an unsubscribed company that is still inside its trial window", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(1); // 1 day old — squarely inside the 14-day trial
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    // Regression guard. Blocking on the flag alone locked a zero-day-old company
    // out of its own trial, because TrialService can leave the Stripe
    // subscription at status "incomplete" and never write the flag at all.
    expect(result.current.status).toBe("trial");
    expect(result.current.isBlocked).toBe(false);
  });

  it("blocks once the trial window has elapsed with no active subscription", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(15); // past the 14-day trial
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("expired");
    expect(result.current.isBlocked).toBe(true);
  });

  it("keeps daysRemaining counting down from createdAt, unaffected by the isBlocked change (1 day old)", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(1);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(13);
    expect(result.current.isGracePeriod).toBe(false);
  });

  it("keeps isGracePeriod true once daysRemaining is inside GRACE_DAYS (12 days old)", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(12);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(2);
    expect(result.current.isGracePeriod).toBe(true);
  });

  // Regression: on 2026-10-12 in Europe/Rome the 1-day-old case reported 14.
  // The trial end (2026-10-25) falls on the day CEST ends, so adding 14 local
  // calendar days produced 14 days + 1 hour, and ceil(13.04) = 14.
  it("reports 13 days for a 1-day-old company when the trial end crosses the autumn DST change", () => {
    const now = new Date("2026-10-12T14:18:02+02:00");
    vi.setSystemTime(now);
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(1, now);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(13);
    expect(result.current.trialEndsAt?.getTime()).toBe(createdAt.getTime() + 14 * DAY_MS);
    expect(result.current.status).toBe("trial");
  });

  it("reports 13 days for a 1-day-old company when the trial end crosses the spring DST change", () => {
    const now = new Date("2027-03-20T12:00:00+01:00"); // trial ends after CET -> CEST on 2027-03-28
    vi.setSystemTime(now);
    userMock.currentUser = { roles: [] };
    const createdAt = daysAgo(1, now);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(13);
    expect(result.current.trialEndsAt?.getTime()).toBe(createdAt.getTime() + 14 * DAY_MS);
  });

  it("blocks exactly 14 x 24h after createdAt, even when the window spans a DST change", () => {
    const createdAt = new Date("2026-10-12T14:18:02+02:00");
    userMock.currentUser = { roles: [] };
    userMock.company = { isActiveSubscription: false, createdAt };

    vi.setSystemTime(createdAt.getTime() + 14 * DAY_MS - 1);
    const before = renderHook(() => useSubscriptionStatus());
    expect(before.result.current.isBlocked).toBe(false);
    expect(before.result.current.daysRemaining).toBe(1);

    vi.setSystemTime(createdAt.getTime() + 14 * DAY_MS);
    const after = renderHook(() => useSubscriptionStatus());
    expect(after.result.current.isBlocked).toBe(true);
    expect(after.result.current.status).toBe("expired");
  });
  describe("stored trialEndsAt", () => {
    const NOW = new Date("2026-10-26T10:00:00.000Z");

    beforeEach(() => {
      vi.setSystemTime(NOW);
      userMock.currentUser = { roles: [] };
    });

    it("not active, trialEndsAt in the future → trial, not blocked", () => {
      const trialEndsAt = new Date("2026-11-05T10:00:00.000Z");
      userMock.company = { isActiveSubscription: false, createdAt: daysAgo(60, NOW), trialEndsAt };

      const { result } = renderHook(() => useSubscriptionStatus());

      expect(result.current.status).toBe("trial");
      expect(result.current.daysRemaining).toBe(10);
      expect(result.current.isBlocked).toBe(false);
      expect(result.current.trialEndsAt?.getTime()).toBe(trialEndsAt.getTime());
    });

    it("not active, trialEndsAt in the past → expired, blocked", () => {
      userMock.company = {
        isActiveSubscription: false,
        createdAt: daysAgo(60, NOW),
        trialEndsAt: new Date("2026-10-20T10:00:00.000Z"),
      };

      const { result } = renderHook(() => useSubscriptionStatus());

      expect(result.current.status).toBe("expired");
      expect(result.current.isBlocked).toBe(true);
    });

    it("not active, no trialEndsAt → createdAt + 14 days (unchanged)", () => {
      const createdAt = daysAgo(4, NOW);
      userMock.company = { isActiveSubscription: false, createdAt, trialEndsAt: undefined };

      const { result } = renderHook(() => useSubscriptionStatus());

      expect(result.current.status).toBe("trial");
      expect(result.current.daysRemaining).toBe(10);
      expect(result.current.isBlocked).toBe(false);
      expect(result.current.trialEndsAt?.getTime()).toBe(createdAt.getTime() + 14 * DAY_MS);
    });

    it("active ignores trialEndsAt", () => {
      userMock.company = {
        isActiveSubscription: true,
        createdAt: daysAgo(60, NOW),
        trialEndsAt: new Date("2026-11-05T10:00:00.000Z"),
      };

      const { result } = renderHook(() => useSubscriptionStatus());

      expect(result.current.status).toBe("active");
      expect(result.current.trialEndsAt).toBeNull();
      expect(result.current.isBlocked).toBe(false);
    });
  });
});
