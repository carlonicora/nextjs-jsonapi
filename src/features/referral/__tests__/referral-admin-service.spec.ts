import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { ReferralAdminService } from "../data/ReferralAdminService";
import { referralAdminModules } from "../referral-admin.modules";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

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

type CallApiParams = { type: ApiRequestDataTypeInterface; method: string; endpoint: string };

// `callApi` is a protected static on AbstractService; spying on the base class
// intercepts every call without touching the HTTP layer.
const callApi = () => vi.spyOn(AbstractService as any, "callApi").mockResolvedValue([]);
const firstCall = (spy: ReturnType<typeof callApi>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;

describe("ReferralAdminService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("getSummary sends the period to the summary endpoint", async () => {
    const spy = callApi();

    await ReferralAdminService.getSummary({ period: "30d" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("ReferralAdminSummary" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toContain("referrals/administration/summary");
    expect(call.endpoint).toContain("period=30d");
  });

  it("getReferrers sends the period and the sort", async () => {
    const spy = callApi();

    await ReferralAdminService.getReferrers({ period: "90d", sort: "invites" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("ReferralAdminReferrer" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toContain("referrals/administration/referrers");
    expect(call.endpoint).toContain("period=90d");
    expect(call.endpoint).toContain("sort=invites");
  });

  it("getReferrals sends the period", async () => {
    const spy = callApi();

    await ReferralAdminService.getReferrals({ period: "all" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("ReferralAdminReferral" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toContain("referrals/administration/referrals");
    expect(call.endpoint).toContain("period=all");
  });
});
