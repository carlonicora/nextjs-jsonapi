import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { WaitlistStatsModule } from "../../waitlist-stats.module";
import { WaitlistModule } from "../../waitlist.module";
import { WaitlistService } from "../WaitlistService";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

// ModuleRegistry is shared across test files in a worker, hence the
// register-if-absent guard (same idiom as AnalyticsAdminService.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Waitlist", WaitlistModule(moduleFactory));
  registerIfAbsent("WaitlistStats", WaitlistStatsModule(moduleFactory));
});

type CallApiParams = { type: ApiRequestDataTypeInterface; method: string; endpoint: string };

// `callApi` is a protected static on AbstractService; spying on the base class
// intercepts every call without touching the HTTP layer.
const callApi = () => vi.spyOn(AbstractService as any, "callApi").mockResolvedValue({});
const firstCall = (spy: ReturnType<typeof callApi>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;

describe("WaitlistService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("getStats calls waitlists/stats with type WaitlistStats", async () => {
    const spy = callApi();

    await WaitlistService.getStats();

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("WaitlistStats" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toMatch(/waitlists\/stats$/);
  });
});
