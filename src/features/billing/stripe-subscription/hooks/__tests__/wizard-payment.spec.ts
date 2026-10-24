import { describe, expect, it } from "vitest";
import { clientSecretToConfirm, subscriptionIdToSync } from "../wizard-payment";

describe("clientSecretToConfirm", () => {
  it("returns the client secret when the payment waits on the browser", () => {
    expect(clientSecretToConfirm({ requiresAction: true, clientSecret: "pi_1_secret", paymentIntentId: "pi_1" })).toBe(
      "pi_1_secret",
    );
  });

  it("returns null when no action is required (trial, already paid)", () => {
    expect(clientSecretToConfirm({ requiresAction: false, clientSecret: "pi_1_secret", paymentIntentId: "pi_1" })).toBe(
      null,
    );
  });

  it("returns null when action is required but there is no client secret", () => {
    expect(clientSecretToConfirm({ requiresAction: true, clientSecret: null, paymentIntentId: null })).toBe(null);
    expect(clientSecretToConfirm({ requiresAction: true, clientSecret: "" })).toBe(null);
  });

  it("returns null when the answer carries no meta (plan change with nothing to confirm)", () => {
    expect(clientSecretToConfirm(undefined)).toBe(null);
    expect(clientSecretToConfirm(null)).toBe(null);
    expect(clientSecretToConfirm({})).toBe(null);
  });
});

describe("subscriptionIdToSync", () => {
  it("syncs the subscription the API just created", () => {
    expect(subscriptionIdToSync({ id: "sub_new" }, undefined)).toBe("sub_new");
  });

  it("prefers the answered subscription over the one the wizard was opened on", () => {
    expect(subscriptionIdToSync({ id: "sub_answered" }, { id: "sub_opened" })).toBe("sub_answered");
  });

  it("falls back to the subscription the wizard was opened on (trial upgrade)", () => {
    expect(subscriptionIdToSync(undefined, { id: "sub_trial" })).toBe("sub_trial");
    expect(subscriptionIdToSync({}, { id: "sub_trial" })).toBe("sub_trial");
  });

  it("returns null when there is no subscription id", () => {
    expect(subscriptionIdToSync(undefined, undefined)).toBe(null);
    expect(subscriptionIdToSync(null, null)).toBe(null);
    expect(subscriptionIdToSync({ id: "" }, {})).toBe(null);
  });
});
