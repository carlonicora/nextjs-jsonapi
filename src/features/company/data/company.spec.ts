import { beforeAll, describe, expect, it } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";
import { Company } from "./company";

// ---------------------------------------------------------------------------
// Setup — Company.rehydrate() resolves Modules.Feature / Modules.Module
// through the real ModuleRegistry (for `_readIncluded`), so both must be
// registered even though this suite's fixtures carry no included data.
// ---------------------------------------------------------------------------
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("Company", { name: "companies", model: Company } as any);
  registerIfAbsent("Feature", { name: "features", model: class {} } as any);
  registerIfAbsent("Module", { name: "modules", model: class {} } as any);
});

describe("Company.aiEnabled", () => {
  it("defaults to true when the attribute is absent", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: {} } } as any);
    expect(company.aiEnabled).toBe(true);
  });

  it("is false only when explicitly false", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: { aiEnabled: false } } } as any);
    expect(company.aiEnabled).toBe(false);
  });

  it("is true when explicitly true", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: { aiEnabled: true } } } as any);
    expect(company.aiEnabled).toBe(true);
  });
});

describe("Company credit-warning fields", () => {
  it("rehydrates credit-warning fields", () => {
    const company = new Company().rehydrate({
      jsonApi: {
        attributes: {
          creditsGrantedThisPeriod: 200,
          creditWarningSentAt: "2026-10-25T10:00:00.000Z",
          creditWarningOffer: "pack",
        },
      },
    } as any);

    expect(company.creditsGrantedThisPeriod).toBe(200);
    expect(company.creditWarningSentAt).toBeInstanceOf(Date);
    expect(company.creditWarningSentAt?.toISOString()).toBe("2026-10-25T10:00:00.000Z");
    expect(company.creditWarningDismissedAt).toBeUndefined();
    expect(company.creditWarningOffer).toBe("pack");
  });

  it("leaves every credit-warning getter undefined when the attributes are absent", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: {} } } as any);

    expect(company.creditsGrantedThisPeriod).toBeUndefined();
    expect(company.creditWarningSentAt).toBeUndefined();
    expect(company.creditWarningDismissedAt).toBeUndefined();
    expect(company.creditWarningOffer).toBeUndefined();
  });
});

describe("Company.trialEndsAt", () => {
  it("rehydrates trialEndsAt as a Date", () => {
    const company = new Company().rehydrate({
      jsonApi: { attributes: { trialEndsAt: "2026-11-09T10:00:00.000Z" } },
    } as any);

    expect(company.trialEndsAt).toBeInstanceOf(Date);
    expect(company.trialEndsAt?.toISOString()).toBe("2026-11-09T10:00:00.000Z");
  });

  it("is undefined when the attribute is absent", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: {} } } as any);

    expect(company.trialEndsAt).toBeUndefined();
  });

  it("is never sent by createJsonApi", () => {
    const payload = new Company().createJsonApi({ id: "company_1", name: "Acme" });

    expect(payload.data.attributes).not.toHaveProperty("trialEndsAt");
  });
});

describe("Company subscription attributes", () => {
  it("rehydrates the admin list subscription attributes", () => {
    const company = new Company().rehydrate({
      jsonApi: {
        attributes: {
          subscriptionPlan: "yearly",
          subscriptionStatus: "active",
          subscriptionNextAt: "2027-08-14T00:00:00.000Z",
        },
      },
    } as any);

    expect(company.subscriptionPlan).toBe("yearly");
    expect(company.subscriptionStatus).toBe("active");
    expect(company.subscriptionNextAt).toEqual(new Date("2027-08-14T00:00:00.000Z"));
  });

  it("rehydrates subscriptionPlanName for an other plan", () => {
    const company = new Company().rehydrate({
      jsonApi: { attributes: { subscriptionPlan: "other", subscriptionPlanName: "Pro" } },
    } as any);

    expect(company.subscriptionPlan).toBe("other");
    expect(company.subscriptionPlanName).toBe("Pro");
  });

  it("leaves every subscription getter undefined when the attributes are absent", () => {
    const company = new Company().rehydrate({ jsonApi: { attributes: {} } } as any);

    expect(company.subscriptionPlan).toBeUndefined();
    expect(company.subscriptionPlanName).toBeUndefined();
    expect(company.subscriptionStatus).toBeUndefined();
    expect(company.subscriptionNextAt).toBeUndefined();
  });

  it("does not send the subscription attributes from createJsonApi", () => {
    const payload = new Company().createJsonApi({ id: "c1", name: "Acme" } as any);

    expect(payload.data.attributes).not.toHaveProperty("subscriptionPlan");
    expect(payload.data.attributes).not.toHaveProperty("subscriptionStatus");
    expect(payload.data.attributes).not.toHaveProperty("subscriptionNextAt");
  });
});
