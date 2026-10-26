import { describe, expect, it } from "vitest";
import { PendingRegistration } from "../pending-registration";

const hydrate = (attributes: Record<string, any>) =>
  new PendingRegistration().rehydrate({
    jsonApi: { type: "pending-registrations", id: "pending-1", attributes },
    included: [],
  } as any);

describe("PendingRegistration.rehydrate()", () => {
  it("rehydrates every attribute", () => {
    const pending = hydrate({
      name: "Aria",
      email: "aria@example.com",
      avatar: "https://cdn.example.com/aria.png",
      provider: "discord",
      hasPass: true,
      emailInUse: true,
    });

    expect(pending.id).toBe("pending-1");
    expect(pending.name).toBe("Aria");
    expect(pending.email).toBe("aria@example.com");
    expect(pending.avatar).toBe("https://cdn.example.com/aria.png");
    expect(pending.provider).toBe("discord");
    expect(pending.hasPass).toBe(true);
    expect(pending.emailInUse).toBe(true);
  });

  it("leaves avatar undefined and defaults hasPass/emailInUse to false when absent", () => {
    const pending = hydrate({ name: "Aria", email: "aria@example.com", provider: "google" });

    expect(pending.avatar).toBeUndefined();
    expect(pending.hasPass).toBe(false);
    expect(pending.emailInUse).toBe(false);
  });
});
