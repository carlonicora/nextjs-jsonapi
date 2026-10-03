import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { AbstractApiData } from "../../../../core/abstracts/AbstractApiData";
import { JsonApiHydratedDataInterface } from "../../../../core/interfaces/JsonApiHydratedDataInterface";
import { analyticsModules } from "../../analytics.modules";
import { AnalyticsBreakdown } from "../analytics-breakdown";
import { AnalyticsEvent } from "../analytics-event";
import { AnalyticsPageView } from "../analytics-page-view";
import { AnalyticsSession } from "../analytics-session";
import { AnalyticsSummary } from "../analytics-summary";
import { AnalyticsTimeline } from "../analytics-timeline";

// createJsonApi reads Modules.X.name (resolved lazily via ModuleRegistry), so
// the modules must be registered before a model serialises — mirrors the
// tokenusage-admin-models.spec setup. ModuleRegistry is shared across test
// files in a worker, hence the register-if-absent guard.
const moduleFactory: ModuleFactory = (params) =>
  ({
    pageUrl: params.pageUrl,
    name: params.name,
    model: params.model,
  }) as ModuleWithPermissions;

const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

// The real User model rehydrates roles and company, which needs those modules
// registered too. The session only cares that the included user is read
// through Modules.User, so a minimal stand-in keeps the fixture small.
class StubUser extends AbstractApiData {
  name = "";
  rehydrate(data: JsonApiHydratedDataInterface): this {
    super.rehydrate(data);
    this.name = data.jsonApi.attributes.name ?? "";
    return this;
  }
}

const userModule = { name: "users", model: StubUser } as ApiRequestDataTypeInterface;

beforeAll(() => {
  for (const [key, module] of Object.entries(analyticsModules(moduleFactory))) registerIfAbsent(key, module);
  registerIfAbsent("User", userModule);
  DataClassRegistry.registerObjectClass(userModule, StubUser);
});

const hydrate = (attributes: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  ({ jsonApi: { id: "x", type: "t", attributes, ...extra }, included: [] }) as any;

describe("analytics models — rehydrate", () => {
  it("rehydrates every summary attribute", () => {
    const m = new AnalyticsSummary().rehydrate(
      hydrate({
        section: "all",
        window: "current",
        visitors: 120,
        sessions: 150,
        pageViews: 480,
        pagesPerSession: 3.2,
        consentShare: 0.4,
      }),
    );
    expect(m.section).toBe("all");
    expect(m.window).toBe("current");
    expect(m.visitors).toBe(120);
    expect(m.sessions).toBe(150);
    expect(m.pageViews).toBe(480);
    expect(m.pagesPerSession).toBe(3.2);
    expect(m.consentShare).toBe(0.4);
  });

  it("parses the timeline bucket into a Date, not the wire string", () => {
    const m = new AnalyticsTimeline().rehydrate(
      hydrate({ bucket: "2026-09-01", section: "public", visitors: 1, sessions: 2, pageViews: 3 }),
    );
    expect(m.bucket).toBeInstanceOf(Date);
    expect(m.bucket.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(m.section).toBe("public");
    expect(m.visitors).toBe(1);
    expect(m.sessions).toBe(2);
    expect(m.pageViews).toBe(3);
  });

  it("rehydrates every breakdown attribute", () => {
    const m = new AnalyticsBreakdown().rehydrate(
      hydrate({ dimension: "source", key: "linkedin", visitors: 4, sessions: 5, pageViews: 6 }),
    );
    expect(m.dimension).toBe("source");
    expect(m.key).toBe("linkedin");
    expect(m.visitors).toBe(4);
    expect(m.sessions).toBe(5);
    expect(m.pageViews).toBe(6);
  });

  it("parses session datetimes into Dates and leaves absent optionals undefined", () => {
    const m = new AnalyticsSession().rehydrate(
      hydrate({
        visitorId: "v1",
        consented: true,
        startedAt: "2026-09-01T10:00:00.000Z",
        lastSeenAt: "2026-09-01T10:12:00.000Z",
        pageViews: 4,
        section: "app",
        landingRoute: "/rolls/:id",
        utmSource: "linkedin",
        deviceType: "desktop",
      }),
    );
    expect(m.visitorId).toBe("v1");
    expect(m.consented).toBe(true);
    expect(m.startedAt).toBeInstanceOf(Date);
    expect(m.startedAt.toISOString()).toBe("2026-09-01T10:00:00.000Z");
    expect(m.lastSeenAt).toBeInstanceOf(Date);
    expect(m.lastSeenAt.toISOString()).toBe("2026-09-01T10:12:00.000Z");
    expect(m.pageViews).toBe(4);
    expect(m.section).toBe("app");
    expect(m.landingRoute).toBe("/rolls/:id");
    expect(m.utmSource).toBe("linkedin");
    expect(m.referrerHost).toBeUndefined();
    expect(m.utmMedium).toBeUndefined();
    expect(m.deviceType).toBe("desktop");
    expect(m.user).toBeUndefined();
  });

  it("reads the included user of a session", () => {
    const m = new AnalyticsSession().rehydrate({
      jsonApi: {
        id: "s1",
        type: "analytics/administration/sessions",
        attributes: {
          visitorId: "v1",
          consented: true,
          startedAt: "2026-09-01T10:00:00.000Z",
          lastSeenAt: "2026-09-01T10:00:00.000Z",
          pageViews: 1,
          section: "app",
          landingRoute: "/",
          deviceType: "mobile",
        },
        relationships: { user: { data: { type: "users", id: "u1" } } },
      },
      included: [
        {
          type: "users",
          id: "u1",
          attributes: { name: "Marco Rossi", email: "m@example.com" },
        },
      ],
    } as any);

    expect(m.user).toBeDefined();
    expect(m.user?.id).toBe("u1");
    expect(m.user?.name).toBe("Marco Rossi");
  });

  it("parses the page view createdAt from meta into a Date (the serialiser's placement)", () => {
    const m = new AnalyticsPageView().rehydrate(
      hydrate(
        { path: "/pricing", route: "/pricing", section: "public" },
        { meta: { createdAt: "2026-09-01T10:05:00.000Z" } },
      ),
    );
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.createdAt.toISOString()).toBe("2026-09-01T10:05:00.000Z");
  });

  it("parses the page view createdAt into a Date when sent as an attribute", () => {
    const m = new AnalyticsPageView().rehydrate(
      hydrate({ createdAt: "2026-09-01T10:05:00.000Z", path: "/rolls/abc", route: "/rolls/:id", section: "app" }),
    );
    expect(m.createdAt).toBeInstanceOf(Date);
    expect(m.createdAt.toISOString()).toBe("2026-09-01T10:05:00.000Z");
    expect(m.path).toBe("/rolls/abc");
    expect(m.route).toBe("/rolls/:id");
    expect(m.section).toBe("app");
  });

  it("reads path and section back on the event", () => {
    const m = new AnalyticsEvent().rehydrate(hydrate({ path: "/pricing", section: "public" }));
    expect(m.path).toBe("/pricing");
    expect(m.section).toBe("public");
  });
});

describe("analytics models — createJsonApi", () => {
  it("serialises an event with the API resource type and only the attributes given", () => {
    const doc = new AnalyticsEvent().createJsonApi({
      id: "e1",
      path: "/pricing",
      section: "public",
      utmSource: "linkedin",
      screenWidth: 1440,
    });

    // Must equal analyticsEventMeta.type: the API DTO rejects anything else.
    expect(doc.data.type).toBe("analytics-events");
    expect(doc.data.id).toBe("e1");
    expect(doc.data.attributes).toEqual({
      path: "/pricing",
      section: "public",
      utmSource: "linkedin",
      screenWidth: 1440,
    });
    expect(Object.keys(doc.data.relationships ?? {})).toHaveLength(0);
  });

  it("serialises a summary back to a JSON:API resource object", () => {
    const doc = new AnalyticsSummary().createJsonApi({
      id: "all|current",
      section: "all",
      window: "current",
      visitors: 1,
      sessions: 2,
      pageViews: 3,
      pagesPerSession: 1.5,
      consentShare: 0.5,
    });
    expect(doc.data.type).toBe("analytics/administration/summary");
    expect(doc.data.id).toBe("all|current");
    expect(doc.data.attributes).toMatchObject({ section: "all", window: "current", visitors: 1, consentShare: 0.5 });
  });

  it("emits the timeline bucket as YYYY-MM-DD via formatLocalDate, never a raw Date", () => {
    const doc = new AnalyticsTimeline().createJsonApi({
      id: "2026-09-01|public",
      bucket: new Date(2026, 8, 1),
      section: "public",
      visitors: 1,
      sessions: 1,
      pageViews: 1,
    });
    expect(doc.data.attributes.bucket).toBe("2026-09-01");
    expect(JSON.parse(JSON.stringify(doc)).data.attributes.bucket).toBe("2026-09-01");
  });

  it("serialises a breakdown row", () => {
    const doc = new AnalyticsBreakdown().createJsonApi({
      id: "source|linkedin",
      dimension: "source",
      key: "linkedin",
      visitors: 1,
      sessions: 2,
      pageViews: 3,
    });
    expect(doc.data.type).toBe("analytics/administration/breakdown");
    expect(doc.data.attributes).toEqual({
      dimension: "source",
      key: "linkedin",
      visitors: 1,
      sessions: 2,
      pageViews: 3,
    });
  });

  it("emits session datetimes as ISO strings, omits absent optionals, and links the user", () => {
    const doc = new AnalyticsSession().createJsonApi({
      id: "s1",
      visitorId: "v1",
      consented: false,
      startedAt: new Date("2026-09-01T10:00:00.000Z"),
      lastSeenAt: new Date("2026-09-01T10:12:00.000Z"),
      pageViews: 2,
      section: "app",
      landingRoute: "/",
      deviceType: "tablet",
      userId: "u1",
    });
    expect(doc.data.type).toBe("analytics/administration/sessions");
    expect(doc.data.attributes.startedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(doc.data.attributes.lastSeenAt).toBe("2026-09-01T10:12:00.000Z");
    expect("referrerHost" in doc.data.attributes).toBe(false);
    expect("utmSource" in doc.data.attributes).toBe(false);
    expect(doc.data.relationships.user).toEqual({ data: { type: "users", id: "u1" } });
  });

  it("emits the page view createdAt as an ISO string", () => {
    const doc = new AnalyticsPageView().createJsonApi({
      id: "p1",
      createdAt: new Date("2026-09-01T10:05:00.000Z"),
      path: "/rolls/abc",
      route: "/rolls/:id",
      section: "app",
    });
    expect(doc.data.type).toBe("pageviews");
    expect(doc.data.attributes).toEqual({
      createdAt: "2026-09-01T10:05:00.000Z",
      path: "/rolls/abc",
      route: "/rolls/:id",
      section: "app",
    });
  });
});
