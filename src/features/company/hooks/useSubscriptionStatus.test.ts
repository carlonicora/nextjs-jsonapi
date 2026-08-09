import { describe, it, expect, beforeEach, vi } from "vitest";
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

describe("useSubscriptionStatus", () => {
  beforeEach(() => {
    userMock.currentUser = null;
    userMock.company = null;
    configMock.stripeKey = "pk_test_123";
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
    userMock.company = { isActiveSubscription: true, createdAt: new Date() };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("active");
    expect(result.current.isBlocked).toBe(false);
  });

  it("does NOT block an unsubscribed company that is still inside its trial window", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 1); // 1 day old — squarely inside the 14-day trial
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
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 15); // past the 14-day trial
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.status).toBe("expired");
    expect(result.current.isBlocked).toBe(true);
  });

  it("keeps daysRemaining counting down from createdAt, unaffected by the isBlocked change (1 day old)", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 1);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(13);
    expect(result.current.isGracePeriod).toBe(false);
  });

  it("keeps isGracePeriod true once daysRemaining is inside GRACE_DAYS (12 days old)", () => {
    userMock.currentUser = { roles: [] };
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - 12);
    userMock.company = { isActiveSubscription: false, createdAt };

    const { result } = renderHook(() => useSubscriptionStatus());

    expect(result.current.daysRemaining).toBe(2);
    expect(result.current.isGracePeriod).toBe(true);
  });
});
