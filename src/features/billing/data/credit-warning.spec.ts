import { describe, expect, it } from "vitest";
import type { CompanyInterface } from "../../company/data/company.interface";
import { SubscriptionStatus } from "../stripe-subscription/data/stripe-subscription.interface";
import type { StripeSubscriptionInterface } from "../stripe-subscription/data/stripe-subscription.interface";
import { CREDIT_WARNING_DISMISS_SEGMENT, isCreditWarningActive, resolveChangePlanTarget } from "./credit-warning";

const makeCompany = (overrides: Record<string, unknown> = {}): CompanyInterface =>
  ({
    aiEnabled: true,
    isActiveSubscription: true,
    creditsGrantedThisPeriod: 200,
    creditWarningSentAt: new Date("2026-10-25T10:00:00.000Z"),
    creditWarningDismissedAt: undefined,
    availableMonthlyCredits: 30,
    availableExtraCredits: 0,
    ...overrides,
  }) as unknown as CompanyInterface;

const makeSubscription = (
  id: string,
  status: SubscriptionStatus,
  priceType: "one_time" | "recurring",
): StripeSubscriptionInterface => ({ id, status, price: { priceType } }) as unknown as StripeSubscriptionInterface;

describe("isCreditWarningActive (threshold 80)", () => {
  it("is true with 30 of 200 left", () => {
    expect(isCreditWarningActive(makeCompany({ availableMonthlyCredits: 30 }), 80)).toBe(true);
  });

  it("is true at exactly 80% used (40 of 200 left)", () => {
    expect(isCreditWarningActive(makeCompany({ availableMonthlyCredits: 40 }), 80)).toBe(true);
  });

  it("is false at 0 credits, which is the out-of-credits banner's job", () => {
    expect(isCreditWarningActive(makeCompany({ availableMonthlyCredits: 0, availableExtraCredits: 0 }), 80)).toBe(
      false,
    );
    expect(isCreditWarningActive(makeCompany({ availableMonthlyCredits: 0, availableExtraCredits: -0.3 }), 80)).toBe(
      false,
    );
  });

  it("is false when monthly plus extra is above the threshold (50 > 40)", () => {
    expect(isCreditWarningActive(makeCompany({ availableMonthlyCredits: 30, availableExtraCredits: 20 }), 80)).toBe(
      false,
    );
  });

  it("is false once dismissed", () => {
    expect(isCreditWarningActive(makeCompany({ creditWarningDismissedAt: new Date() }), 80)).toBe(false);
  });

  it("is false when the warning was never sent", () => {
    expect(isCreditWarningActive(makeCompany({ creditWarningSentAt: undefined }), 80)).toBe(false);
  });

  it("is false without an active subscription", () => {
    expect(isCreditWarningActive(makeCompany({ isActiveSubscription: false }), 80)).toBe(false);
  });

  it("is false when AI is off", () => {
    expect(isCreditWarningActive(makeCompany({ aiEnabled: false }), 80)).toBe(false);
  });

  it("is false when nothing was granted this period", () => {
    expect(isCreditWarningActive(makeCompany({ creditsGrantedThisPeriod: undefined }), 80)).toBe(false);
  });
});

describe("CREDIT_WARNING_DISMISS_SEGMENT", () => {
  it("matches the backend segment", () => {
    expect(CREDIT_WARNING_DISMISS_SEGMENT).toBe("credit-warning/dismiss");
  });
});

describe("resolveChangePlanTarget", () => {
  it("picks the trialing recurring subscription over a one-time one", () => {
    const oneTime = makeSubscription("one-time", SubscriptionStatus.ACTIVE, "one_time");
    const trialing = makeSubscription("trialing", SubscriptionStatus.TRIALING, "recurring");

    expect(resolveChangePlanTarget([oneTime, trialing])).toBe(trialing);
  });

  it("returns undefined when the only recurring subscription is canceled", () => {
    const canceled = makeSubscription("canceled", SubscriptionStatus.CANCELED, "recurring");

    expect(resolveChangePlanTarget([canceled])).toBeUndefined();
  });

  it("returns the first active recurring subscription in array order", () => {
    const first = makeSubscription("first", SubscriptionStatus.ACTIVE, "recurring");
    const second = makeSubscription("second", SubscriptionStatus.ACTIVE, "recurring");

    expect(resolveChangePlanTarget([first, second])).toBe(first);
  });
});
