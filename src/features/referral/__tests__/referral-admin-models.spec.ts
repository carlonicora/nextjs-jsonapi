import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { ReferralAdminReferral } from "../data/ReferralAdminReferral";
import { ReferralAdminReferrer } from "../data/ReferralAdminReferrer";
import { ReferralAdminSummary } from "../data/ReferralAdminSummary";
import { referralAdminModules } from "../referral-admin.modules";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

// ModuleRegistry is shared across test files in a worker, hence the
// register-if-absent guard (same idiom as the analytics models spec).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  for (const [key, module] of Object.entries(referralAdminModules(moduleFactory))) registerIfAbsent(key, module);
});

const hydrate = (id: string, attributes: Record<string, unknown>) =>
  ({ jsonApi: { id, type: "t", attributes }, included: [] }) as any;

describe("referral admin models — rehydrate", () => {
  it("rehydrates every summary attribute", () => {
    const m = new ReferralAdminSummary().rehydrate(
      hydrate("current", {
        window: "current",
        visits: 12,
        invitesSent: 8,
        signups: 3,
        paying: 2,
        creditsGiven: 800,
        sharingCompanies: 4,
        eligibleCompanies: 40,
      }),
    );
    expect(m.id).toBe("current");
    expect(m.window).toBe("current");
    expect(m.visits).toBe(12);
    expect(m.invitesSent).toBe(8);
    expect(m.signups).toBe(3);
    expect(m.paying).toBe(2);
    expect(m.creditsGiven).toBe(800);
    expect(m.sharingCompanies).toBe(4);
    expect(m.eligibleCompanies).toBe(40);
  });

  it("rehydrates every referrer attribute and parses lastInviteAt into a Date", () => {
    const m = new ReferralAdminReferrer().rehydrate(
      hydrate("c1", {
        name: "Luca",
        email: "luca@x.test",
        visits: 5,
        invitesSent: 4,
        signupsLink: 2,
        signupsDirect: 1,
        paying: 1,
        creditsEarned: 200,
        lastInviteAt: "2026-10-27T10:00:00.000Z",
      }),
    );
    expect(m.id).toBe("c1");
    expect(m.name).toBe("Luca");
    expect(m.email).toBe("luca@x.test");
    expect(m.visits).toBe(5);
    expect(m.invitesSent).toBe(4);
    expect(m.signupsLink).toBe(2);
    expect(m.signupsDirect).toBe(1);
    expect(m.paying).toBe(1);
    expect(m.creditsEarned).toBe(200);
    expect(m.lastInviteAt).toBeInstanceOf(Date);
    expect(m.lastInviteAt?.toISOString()).toBe("2026-10-27T10:00:00.000Z");
  });

  it("leaves a missing lastInviteAt undefined", () => {
    const m = new ReferralAdminReferrer().rehydrate(hydrate("c2", { name: "Sara", email: "sara@x.test" }));
    expect(m.lastInviteAt).toBeUndefined();
  });

  it("rehydrates every referral attribute and parses the datetimes into Dates", () => {
    const m = new ReferralAdminReferral().rehydrate(
      hydrate("r1", {
        name: "Marta",
        email: "marta@x.test",
        referrerName: "Luca",
        referrerEmail: "luca@x.test",
        source: "link",
        status: "completed",
        referredAt: "2026-10-20T08:00:00.000Z",
        completedAt: "2026-10-27T08:00:00.000Z",
        tokensAwarded: 200,
      }),
    );
    expect(m.id).toBe("r1");
    expect(m.name).toBe("Marta");
    expect(m.email).toBe("marta@x.test");
    expect(m.referrerName).toBe("Luca");
    expect(m.referrerEmail).toBe("luca@x.test");
    expect(m.source).toBe("link");
    expect(m.status).toBe("completed");
    expect(m.referredAt).toBeInstanceOf(Date);
    expect(m.referredAt.toISOString()).toBe("2026-10-20T08:00:00.000Z");
    expect(m.completedAt).toBeInstanceOf(Date);
    expect(m.completedAt?.toISOString()).toBe("2026-10-27T08:00:00.000Z");
    expect(m.tokensAwarded).toBe(200);
  });

  it("leaves a missing completedAt and tokensAwarded undefined", () => {
    const m = new ReferralAdminReferral().rehydrate(
      hydrate("r2", { name: "Tom", status: "pending", source: "direct", referredAt: "2026-10-24T08:00:00.000Z" }),
    );
    expect(m.completedAt).toBeUndefined();
    expect(m.tokensAwarded).toBeUndefined();
  });
});
