import { beforeAll, describe, expect, it } from "vitest";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import {
  TokenUsageAdminBreakdownModule,
  TokenUsageAdminSummaryModule,
  TokenUsageAdminTimelineModule,
} from "../../tokenusage-admin.module";
import { TokenUsageAdminBreakdown } from "../tokenusage-admin-breakdown";
import { TokenUsageAdminSummary } from "../tokenusage-admin-summary";
import { TokenUsageAdminTimeline } from "../tokenusage-admin-timeline";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), so
// the modules must be registered before a model serialises — mirrors the
// HowTo.spec / AssistantMessage.spec setup convention in this package.
const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

beforeAll(() => {
  ModuleRegistry.register("TokenUsageAdminSummary", TokenUsageAdminSummaryModule(moduleFactory));
  ModuleRegistry.register("TokenUsageAdminTimeline", TokenUsageAdminTimelineModule(moduleFactory));
  ModuleRegistry.register("TokenUsageAdminBreakdown", TokenUsageAdminBreakdownModule(moduleFactory));
});

const hydrate = (attributes: Record<string, unknown>) =>
  ({ jsonApi: { id: "x", type: "t", attributes }, included: [] }) as any;

describe("token usage admin models", () => {
  it("rehydrates every summary attribute", () => {
    const m = new TokenUsageAdminSummary().rehydrate(
      hydrate({
        scope: "customer",
        window: "current",
        cost: 9.46,
        credits: 3394,
        tokensIn: 49244143,
        tokensOut: 12,
        cached: 75752,
        calls: 2956,
      }),
    );
    expect(m.scope).toBe("customer");
    expect(m.window).toBe("current");
    expect(m.cost).toBe(9.46);
    expect(m.credits).toBe(3394);
    expect(m.tokensIn).toBe(49244143);
    expect(m.tokensOut).toBe(12);
    expect(m.cached).toBe(75752);
    expect(m.calls).toBe(2956);
  });

  it("parses the timeline bucket into a Date, not the wire string", () => {
    const m = new TokenUsageAdminTimeline().rehydrate(
      hydrate({
        bucket: "2026-08-01",
        series: "customer",
        cost: 1,
        credits: 1,
        tokensIn: 1,
        tokensOut: 1,
        cached: 0,
        calls: 1,
      }),
    );
    expect(m.bucket).toBeInstanceOf(Date);
    expect(m.bucket.toISOString().slice(0, 10)).toBe("2026-08-01");
    expect(m.series).toBe("customer");
  });

  it("leaves company-only breakdown fields undefined on other dimensions", () => {
    const m = new TokenUsageAdminBreakdown().rehydrate(
      hydrate({
        label: "m.rossi",
        sublabel: "Studio Rossi",
        cost: 3.74,
        credits: 900,
        tokensIn: 1,
        tokensOut: 1,
        cached: 0,
        calls: 4,
      }),
    );
    expect(m.label).toBe("m.rossi");
    expect(m.sublabel).toBe("Studio Rossi");
    expect(m.activeUsers).toBeUndefined();
    expect(m.monthlyCredits).toBeUndefined();
    expect(m.availableMonthlyCredits).toBeUndefined();
  });

  it("serialises a summary back to a JSON:API resource object", () => {
    const doc = new TokenUsageAdminSummary().createJsonApi({
      id: "customer|current",
      scope: "customer",
      window: "current",
      cost: 9.46,
      credits: 3394,
      tokensIn: 1,
      tokensOut: 2,
      cached: 3,
      calls: 4,
    });

    expect(doc.data.type).toBe("tokenusages/administration/summary");
    expect(doc.data.id).toBe("customer|current");
    expect(doc.data.attributes).toMatchObject({ scope: "customer", window: "current", cost: 9.46, calls: 4 });
  });

  it("emits the timeline bucket as YYYY-MM-DD via formatLocalDate, never a raw Date", () => {
    const doc = new TokenUsageAdminTimeline().createJsonApi({
      id: "2026-08-01|customer",
      bucket: new Date(2026, 7, 1),
      series: "customer",
      cost: 1,
      credits: 1,
      tokensIn: 1,
      tokensOut: 1,
      cached: 0,
      calls: 1,
    });

    expect(doc.data.attributes.bucket).toBe("2026-08-01");
    expect(typeof doc.data.attributes.bucket).toBe("string");
    // A raw Date would survive JSON.stringify as an ISO instant and UTC-shift.
    expect(JSON.parse(JSON.stringify(doc)).data.attributes.bucket).toBe("2026-08-01");
  });

  it("omits absent optional breakdown attributes rather than emitting undefined", () => {
    const doc = new TokenUsageAdminBreakdown().createJsonApi({
      id: "u1",
      label: "m.rossi",
      cost: 1,
      credits: 1,
      tokensIn: 1,
      tokensOut: 1,
      cached: 0,
      calls: 1,
    });

    expect(doc.data.attributes.label).toBe("m.rossi");
    expect("sublabel" in doc.data.attributes).toBe(false);
    expect("activeUsers" in doc.data.attributes).toBe(false);
  });
});
