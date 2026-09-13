import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "../../../../../../core/registry/ModuleRegistry";
import { configureI18n } from "../../../../../../i18n";
import { StripePriceSeed } from "../../../data/stripe-price.transfer";
import PriceEditor from "../PriceEditor";

// Hoisted so the vi.mock factories below (which run before the module body)
// can close over them.
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  createPrice: vi.fn(),
  updatePrice: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock("../../../../../feature", () => ({
  FeatureService: { findMany: mocks.findMany },
}));

vi.mock("../../../../contexts/PriceContext", () => ({
  usePriceContext: () => ({
    createPrice: mocks.createPrice,
    updatePrice: mocks.updatePrice,
    productId: "product-from-context",
  }),
  priceLabel: (price: { nickname?: string }) => price.nickname ?? "price",
}));

vi.mock("../../../../../../utils/toast", () => ({
  showToast: mocks.showToast,
  showError: vi.fn(),
  dismissToast: vi.fn(),
  showCustomToast: vi.fn(),
}));

const CORE = { id: "feature-core", name: "Core", isCore: true };
const AI = { id: "feature-ai", name: "AI Assistant", isCore: false };
const SSO = { id: "feature-sso", name: "SSO", isCore: false };

const seed: StripePriceSeed = {
  unitAmount: 5900, // MINOR units — the form must render 59
  currency: "usd",
  interval: "year",
  intervalCount: 1,
  usageType: "licensed",
  nickname: "Cloned Pro",
  description: "A cloned plan",
  features: ["Unlimited exports"],
  token: 500,
  isTrial: false,
  platformFeatures: ["AI Assistant"],
};

/** The sheet is portaled, so everything is queried from document. */
const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
const selectTriggers = () => Array.from(document.querySelectorAll('[data-slot="select-trigger"]'));
// Base UI puts the `id` on the hidden native input it renders for the form,
// not on the visible control, so read the checked state from there.
const checkbox = (featureId: string) => document.getElementById(`feature-${featureId}`) as HTMLInputElement | null;
const isChecked = (featureId: string) => checkbox(featureId)?.checked === true;

/** Rendered once the async FeatureService.findMany has landed. */
const waitForFeatures = async () => {
  await waitFor(() => expect(checkbox(CORE.id)).not.toBeNull());
};

// `Modules.StripePrice` resolves through the registry at render time.
beforeAll(() => {
  ModuleRegistry.register("StripePrice", {
    name: "stripe-prices",
    pageUrl: "/administration/prices",
  } as any);
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findMany.mockResolvedValue([CORE, AI, SSO]);
  mocks.createPrice.mockImplementation(async (payload: { id: string }) => ({ id: payload.id }));
  configureI18n({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
    }),
    useTranslations: () => (key: string) => key,
    Link: ({ children }: any) => children,
    usePathname: () => "/",
  });
});

describe("PriceEditor — seed", () => {
  it("renders a seeded editor in CREATE mode", async () => {
    render(<PriceEditor forceShow productId="product-1" seed={seed} />);

    expect(await screen.findByText("common.edit.create.title")).not.toBeNull();
    expect(screen.getByTestId("modal-button-create").textContent).toContain("ui.buttons.confirm_create");
    expect(screen.queryByText("common.edit.update.title")).toBeNull();
    expect(screen.queryByText("billing.admin.prices.immutability.title")).toBeNull();
  });

  it("pre-fills the fields from the seed, converting the amount to MAJOR units", async () => {
    render(<PriceEditor forceShow productId="product-1" seed={seed} />);
    await screen.findByText("common.edit.create.title");

    // 5900 minor units -> 59 major units.
    expect(input("unitAmount")?.value).toBe("59");
    expect(input("nickname")?.value).toBe("Cloned Pro");
    // The token pipeline is string-based end to end.
    expect(input("token")?.value).toBe("500");
    expect(input("intervalCount")?.value).toBe("1");
    expect(screen.getByDisplayValue("A cloned plan")).not.toBeNull();
    expect(screen.getByDisplayValue("Unlimited exports")).not.toBeNull();

    // Trigger order: currency, interval, usageType.
    expect(selectTriggers()[0]?.textContent).toContain("USD ($)");
    expect(selectTriggers()[1]?.textContent).toContain("billing.admin.prices.interval.year");
  });

  it("checks the seeded platform features once the late feature list lands", async () => {
    render(<PriceEditor forceShow productId="product-1" seed={seed} />);
    await waitForFeatures();

    // The guarded re-seed: `allFeatures` resolves AFTER useForm has seeded, and
    // EditorSheet only re-seeds when isEdit — without the catch-up effect both
    // of these stay unchecked.
    await waitFor(() => expect(isChecked(AI.id)).toBe(true));
    expect(isChecked(CORE.id)).toBe(true);
    expect(isChecked(SSO.id)).toBe(false);
  });

  it("drops a platform feature this environment does not know, warns once, and does not throw", async () => {
    const foreignSeed: StripePriceSeed = { ...seed, platformFeatures: ["AI Assistant", "Telepathy"] };

    render(<PriceEditor forceShow productId="product-1" seed={foreignSeed} />);
    await waitForFeatures();

    await waitFor(() => expect(mocks.showToast).toHaveBeenCalledTimes(1));
    expect(mocks.showToast).toHaveBeenCalledWith("billing.admin.prices.import.warnings.unknownFeatures");

    // The known name still resolves; nothing extra gets checked.
    await waitFor(() => expect(isChecked(AI.id)).toBe(true));
    expect(isChecked(CORE.id)).toBe(true);
    expect(isChecked(SSO.id)).toBe(false);
  });

  it("submits a seeded editor as a brand-new price: fresh uuid, no Stripe identity", async () => {
    render(<PriceEditor forceShow productId="product-1" seed={seed} />);
    await waitForFeatures();
    await waitFor(() => expect(isChecked(AI.id)).toBe(true));

    fireEvent.click(screen.getByTestId("modal-button-create"));

    await waitFor(() => expect(mocks.createPrice).toHaveBeenCalledTimes(1));
    expect(mocks.updatePrice).not.toHaveBeenCalled();

    const payload = mocks.createPrice.mock.calls[0][0];
    expect(payload.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(payload).not.toHaveProperty("stripePriceId");
    expect(JSON.stringify(payload)).not.toContain("stripePriceId");
    expect(JSON.stringify(payload)).not.toContain("price_");

    // The rest of the seed survives the round trip, back in MINOR units.
    expect(payload.productId).toBe("product-1");
    expect(payload.unitAmount).toBe(5900);
    expect(payload.currency).toBe("usd");
    expect(payload.recurring).toEqual({ interval: "year", intervalCount: 1, usageType: "licensed" });
    expect(payload.token).toBe(500);
    expect(payload.featureIds).toEqual(expect.arrayContaining([AI.id, CORE.id]));
  });

  it("does not put the editor in edit mode", async () => {
    render(<PriceEditor forceShow productId="product-1" seed={seed} />);
    await screen.findByText("common.edit.create.title");

    expect(screen.queryByText("billing.admin.prices.immutability.title")).toBeNull();
    expect(input("unitAmount")?.disabled).toBe(false);
  });
});
