import { describe, expect, it } from "vitest";
import { StripeSubscriptionInterface } from "../../../stripe-subscription/data/stripe-subscription.interface";
import { adminSubscriptionState } from "../admin-subscription-state";

const TRIAL_END = new Date("2026-11-22T00:00:00.000Z");
const PERIOD_END = new Date("2026-12-03T00:00:00.000Z");
const EARLIER = new Date("2026-10-01T00:00:00.000Z");
const LATER = new Date("2027-01-15T00:00:00.000Z");

/**
 * A subscription whose currentPeriodEnd getter throws when absent, like the model's.
 */
function subscription(params: {
  status: string;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: Date;
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}): StripeSubscriptionInterface {
  return {
    status: params.status,
    cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
    canceledAt: params.canceledAt,
    trialEnd: params.trialEnd,
    get currentPeriodEnd(): Date {
      if (!params.currentPeriodEnd) throw new Error("currentPeriodEnd is not defined");
      return params.currentPeriodEnd;
    },
    get currentPeriodStart(): Date {
      throw new Error("currentPeriodStart is not defined");
    },
  } as unknown as StripeSubscriptionInterface;
}

// Shared Contracts › Status table (the same rows as the backend Cypher spec).
const STATUS_TABLE: {
  name: string;
  input: Parameters<typeof subscription>[0];
  state: string;
  date: Date | undefined;
}[] = [
  {
    name: "trialing, not cancelling",
    input: { status: "trialing", trialEnd: TRIAL_END, currentPeriodEnd: PERIOD_END },
    state: "trial",
    date: TRIAL_END,
  },
  {
    name: "trialing, cancelling",
    input: { status: "trialing", cancelAtPeriodEnd: true, trialEnd: TRIAL_END, currentPeriodEnd: PERIOD_END },
    state: "cancelled",
    date: TRIAL_END,
  },
  {
    name: "active, not cancelling",
    input: { status: "active", currentPeriodEnd: PERIOD_END },
    state: "active",
    date: PERIOD_END,
  },
  {
    name: "active, cancelling",
    input: { status: "active", cancelAtPeriodEnd: true, currentPeriodEnd: PERIOD_END },
    state: "cancelled",
    date: PERIOD_END,
  },
  {
    name: "past_due, cancelling",
    input: { status: "past_due", cancelAtPeriodEnd: true, currentPeriodEnd: PERIOD_END },
    state: "past_due",
    date: undefined,
  },
  {
    name: "past_due, not cancelling",
    input: { status: "past_due", currentPeriodEnd: PERIOD_END },
    state: "past_due",
    date: undefined,
  },
  {
    name: "unpaid",
    input: { status: "unpaid", cancelAtPeriodEnd: true, currentPeriodEnd: PERIOD_END },
    state: "past_due",
    date: undefined,
  },
  {
    name: "incomplete",
    input: { status: "incomplete", currentPeriodEnd: PERIOD_END },
    state: "incomplete",
    date: undefined,
  },
  { name: "paused", input: { status: "paused", currentPeriodEnd: PERIOD_END }, state: "paused", date: undefined },
  {
    name: "canceled, canceledAt earlier than period end",
    input: { status: "canceled", canceledAt: EARLIER, currentPeriodEnd: PERIOD_END },
    state: "ended",
    date: PERIOD_END,
  },
  {
    name: "canceled, canceledAt missing",
    input: { status: "canceled", currentPeriodEnd: PERIOD_END },
    state: "ended",
    date: PERIOD_END,
  },
  {
    name: "canceled, canceledAt later than period end",
    input: { status: "canceled", canceledAt: LATER, currentPeriodEnd: PERIOD_END },
    state: "ended",
    date: LATER,
  },
  {
    name: "incomplete_expired, canceledAt missing",
    input: { status: "incomplete_expired", currentPeriodEnd: PERIOD_END },
    state: "ended",
    date: PERIOD_END,
  },
  {
    name: "a status Stripe adds later",
    input: { status: "some_new_status", currentPeriodEnd: PERIOD_END },
    state: "some_new_status",
    date: undefined,
  },
];

describe("adminSubscriptionState", () => {
  it.each(STATUS_TABLE)("$name → $state", ({ input, state, date }) => {
    expect(adminSubscriptionState(subscription(input))).toEqual({ state, date });
  });

  it("gives no date when the period end is missing", () => {
    expect(adminSubscriptionState(subscription({ status: "active" }))).toEqual({ state: "active", date: undefined });
  });
});
