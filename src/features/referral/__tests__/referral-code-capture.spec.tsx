import { act, render } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiRequestDataTypeInterface } from "../../../core/interfaces/ApiRequestDataTypeInterface";
import { ModuleRegistry } from "../../../core/registry/ModuleRegistry";

const REF = "11111111-1111-4111-8111-111111111111";

const mocks = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  enabled: true,
  existingCode: null as string | null,
  setReferralCode: vi.fn(),
  recordVisit: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useSearchParams: () => mocks.searchParams }));
vi.mock("../config", () => ({
  isReferralEnabled: () => mocks.enabled,
  getReferralConfig: () => ({ urlParamName: "ref" }),
}));
vi.mock("../utils/referral-cookie", () => ({
  getReferralCode: () => mocks.existingCode,
  setReferralCode: mocks.setReferralCode,
}));
vi.mock("../data/ReferralService", () => ({ ReferralService: { recordVisit: mocks.recordVisit } }));

import { ReferralCodeCapture } from "../components/ReferralCodeCapture";
import { ReferralVisit } from "../data/ReferralVisit";

// ReferralVisit.createJsonApi() resolves Modules.ReferralVisit through the real ModuleRegistry.
const registerIfAbsent = (key: string, module: ApiRequestDataTypeInterface) => {
  try {
    ModuleRegistry.get(key as any);
  } catch {
    ModuleRegistry.register(key, module);
  }
};

beforeAll(() => {
  registerIfAbsent("ReferralVisit", { name: "referrals/visits", model: ReferralVisit } as any);
});

describe("ReferralCodeCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.searchParams = new URLSearchParams({ ref: REF });
    mocks.enabled = true;
    mocks.existingCode = null;
    mocks.recordVisit.mockResolvedValue(undefined);
  });

  it("records a visit when it sets the cookie", () => {
    render(<ReferralCodeCapture />);

    expect(mocks.setReferralCode).toHaveBeenCalledTimes(1);
    expect(mocks.setReferralCode).toHaveBeenCalledWith(REF);
    expect(mocks.recordVisit).toHaveBeenCalledTimes(1);
    expect(mocks.recordVisit).toHaveBeenCalledWith({ referralCode: REF });
  });

  it("does not record a visit when a cookie already exists", () => {
    mocks.existingCode = "22222222-2222-4222-8222-222222222222";

    render(<ReferralCodeCapture />);

    expect(mocks.setReferralCode).not.toHaveBeenCalled();
    expect(mocks.recordVisit).not.toHaveBeenCalled();
  });

  it("does nothing when the feature is disabled", () => {
    mocks.enabled = false;

    render(<ReferralCodeCapture />);

    expect(mocks.setReferralCode).not.toHaveBeenCalled();
    expect(mocks.recordVisit).not.toHaveBeenCalled();
  });

  it("a failed visit call is swallowed", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    mocks.recordVisit.mockRejectedValue(new Error("network down"));

    try {
      render(<ReferralCodeCapture />);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mocks.setReferralCode).toHaveBeenCalledWith(REF);
      expect(mocks.recordVisit).toHaveBeenCalledTimes(1);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });
});

describe("ReferralVisit.createJsonApi()", () => {
  it("builds the visit body with no id", () => {
    expect(new ReferralVisit().createJsonApi({ referralCode: "x" })).toEqual({
      data: { type: "referrals/visits", attributes: { referralCode: "x" } },
    });
  });
});
