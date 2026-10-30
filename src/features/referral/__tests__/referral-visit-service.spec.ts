import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AbstractService } from "../../../core/abstracts/AbstractService";
import { JsonApiDataFactory } from "../../../core/factories/JsonApiDataFactory";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { DataClassRegistry } from "../../../core/registry/DataClassRegistry";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { ModuleFactory, ModuleWithPermissions } from "../../../permissions/types";
import { ReferralService } from "../data/ReferralService";
import { ReferralVisit } from "../data/ReferralVisit";
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
  // bootstrap() does this in an app: the factory builds the body through the registered model.
  DataClassRegistry.registerObjectClass(ModuleRegistry.get("ReferralVisit" as any), ReferralVisit);
});

type CallApiParams = { type: ApiRequestDataTypeInterface; method: string; input: unknown };

describe("ReferralService.recordVisit", () => {
  beforeEach(() => vi.restoreAllMocks());

  // JsonApiPost runs the model's createJsonApi() on `input` itself, so the body the
  // API receives is JsonApiDataFactory.create(type, input), never `input` as is.
  it("the body the API receives carries the referral code", async () => {
    const spy = vi.spyOn(AbstractService as any, "callApi").mockResolvedValue(undefined);

    await ReferralService.recordVisit({ referralCode: "code-1" });

    const call = spy.mock.calls[0][0] as CallApiParams;
    expect(call.method).toBe("POST");
    expect(JsonApiDataFactory.create(call.type, call.input)).toEqual({
      data: { type: "referrals/visits", attributes: { referralCode: "code-1" } },
    });
  });
});
