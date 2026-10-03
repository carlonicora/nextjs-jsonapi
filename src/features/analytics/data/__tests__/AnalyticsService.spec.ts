import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../../core/abstracts/AbstractService";
import { ApiRequestDataTypeInterface } from "../../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../../permissions/types";
import { analyticsModules } from "../../analytics.modules";
import { AnalyticsEventInput } from "../analytics.types";
import { AnalyticsService } from "../AnalyticsService";

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
  for (const [key, module] of Object.entries(analyticsModules(moduleFactory))) registerIfAbsent(key, module);
});

type CallApiParams = {
  type: ApiRequestDataTypeInterface;
  method: string;
  endpoint: string;
  input?: unknown;
  suppressGlobalError?: boolean;
};

const input: AnalyticsEventInput = { id: "e1", path: "/pricing", section: "public", utmSource: "linkedin" };

describe("AnalyticsService.track", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("posts the input to Modules.AnalyticsEvent with the global error handler suppressed", async () => {
    const spy = vi.spyOn(AbstractService as any, "callApi").mockResolvedValue({});

    await AnalyticsService.track(input);

    const call = spy.mock.calls[0][0] as CallApiParams;
    expect(call.type).toBe(ModuleRegistry.get("AnalyticsEvent" as any));
    expect(call.method).toBe("POST");
    expect(call.endpoint).toBe("analytics/events");
    expect(call.input).toBe(input);
    expect(call.suppressGlobalError).toBe(true);
  });

  it("resolves even when callApi rejects — a lost page view never breaks the page", async () => {
    vi.spyOn(AbstractService as any, "callApi").mockRejectedValue(new Error("network down"));

    await expect(AnalyticsService.track(input)).resolves.toBeUndefined();
  });
});
