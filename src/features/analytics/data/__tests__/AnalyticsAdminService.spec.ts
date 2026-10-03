import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { analyticsModules } from "../../analytics.modules";
import { AnalyticsAdminService } from "../AnalyticsAdminService";

const moduleFactory: ModuleFactory = (params) =>
  ({ pageUrl: params.pageUrl, name: params.name, model: params.model }) as ModuleWithPermissions;

// ModuleRegistry is shared across test files in a worker, hence the
// register-if-absent guard (same idiom as HandbookThreadService.spec.ts).
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  for (const [key, module] of Object.entries(analyticsModules(moduleFactory))) registerIfAbsent(key, module);
});

type CallApiParams = { type: ApiRequestDataTypeInterface; method: string; endpoint: string; next?: unknown };

// `callApi` is a protected static on AbstractService; spying on the base class
// intercepts every call without touching the HTTP layer.
const callApi = () => vi.spyOn(AbstractService as any, "callApi").mockResolvedValue([]);
const firstCall = (spy: ReturnType<typeof callApi>): CallApiParams => spy.mock.calls[0][0] as CallApiParams;

const filters = { from: "2026-09-01T00:00:00.000Z", to: "2026-10-01T00:00:00.000Z", section: "public" as const };

describe("AnalyticsAdminService", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("getSummary sends from, to and section to the summary endpoint", async () => {
    const spy = callApi();

    await AnalyticsAdminService.getSummary(filters);

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsSummary" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toBe(
      "analytics/administration/summary?from=2026-09-01T00:00:00.000Z&to=2026-10-01T00:00:00.000Z&section=public",
    );
  });

  it("getTimeline builds the endpoint from Modules.AnalyticsTimeline with from, to, section and granularity", async () => {
    const spy = callApi();

    await AnalyticsAdminService.getTimeline({ ...filters, granularity: "week" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsTimeline" as any));
    expect(call.endpoint).toBe(
      "analytics/administration/timeline?from=2026-09-01T00:00:00.000Z&to=2026-10-01T00:00:00.000Z&section=public&granularity=week",
    );
  });

  it("getBreakdown adds dimension and limit", async () => {
    const spy = callApi();

    await AnalyticsAdminService.getBreakdown({ ...filters, dimension: "source", limit: 50 });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsBreakdown" as any));
    expect(call.endpoint).toBe(
      "analytics/administration/breakdown?from=2026-09-01T00:00:00.000Z&to=2026-10-01T00:00:00.000Z&section=public&dimension=source&limit=50",
    );
  });

  it("getBreakdown leaves limit out when it is not given", async () => {
    const spy = callApi();

    await AnalyticsAdminService.getBreakdown({ ...filters, dimension: "route" });

    expect(firstCall(spy).endpoint).not.toContain("limit=");
  });

  it("getSessions forwards next and the visitor and user filters", async () => {
    const spy = callApi();
    const next = { next: "analytics/administration/sessions?page[cursor]=25" };

    await AnalyticsAdminService.getSessions({ ...filters, visitorId: "v1", userId: "u1", next });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsSession" as any));
    expect(call.next).toBe(next);
    expect(call.endpoint).toBe(
      "analytics/administration/sessions?from=2026-09-01T00:00:00.000Z&to=2026-10-01T00:00:00.000Z&section=public&visitorId=v1&userId=u1",
    );
  });

  it("getSession reads one session by id", async () => {
    const spy = vi.spyOn(AbstractService as any, "callApi").mockResolvedValue({});

    await AnalyticsAdminService.getSession({ id: "s1" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsSession" as any));
    expect(call.endpoint).toBe("analytics/administration/sessions/s1");
  });

  it("getSessionPageViews uses the session endpoint with the pageviews child segment", async () => {
    const spy = callApi();

    await AnalyticsAdminService.getSessionPageViews({ sessionId: "s1" });

    const call = firstCall(spy);
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsPageView" as any));
    expect(call.method).toBe("GET");
    expect(call.endpoint).toBe("analytics/administration/sessions/s1/pageviews");
  });
});
