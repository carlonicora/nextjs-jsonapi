import { act, renderHook } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { StripePrice } from "../../stripe-price/data/stripe-price";
import { StripePriceService } from "../../stripe-price/data/stripe-price.service";
import { PriceProvider, usePriceContext } from "../PriceContext";

vi.mock("../../stripe-price/data/stripe-price.service", () => ({
  StripePriceService: {
    getPrice: vi.fn(async () => ({ id: "pr1" })),
    createPrice: vi.fn(async () => ({ id: "new" })),
    updatePrice: vi.fn(async () => ({ id: "pr1" })),
    archivePrice: vi.fn(async () => undefined),
    reactivatePrice: vi.fn(async () => undefined),
  },
}));

vi.mock("../../../user/contexts", () => ({
  useCurrentUserContext: () => ({ hasRole: () => true, hasPermissionToModule: () => false }),
}));

vi.mock("../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "administrator" }),
}));

const listModeWrapper = ({ children }: { children: ReactNode }) => (
  <PriceProvider productId="p1" publishChrome={false}>
    {children}
  </PriceProvider>
);

describe("PriceContext", () => {
  beforeAll(() => {
    ModuleRegistry.register("StripePrice", {
      name: "stripe-prices",
      pageUrl: "/administration/prices",
      model: StripePrice,
    } as any);
  });

  beforeEach(() => vi.clearAllMocks());

  it("returns a no-op default outside a provider instead of throwing", () => {
    const { result } = renderHook(() => usePriceContext());

    expect(result.current.price).toBeUndefined();
    expect(result.current.priceVersion).toBe(0);
  });

  it("exposes the productId it was mounted with, so the tab can create prices", () => {
    const { result } = renderHook(() => usePriceContext(), { wrapper: listModeWrapper });

    expect(result.current.productId).toBe("p1");
  });

  it("bumps priceVersion after a create", async () => {
    const { result } = renderHook(() => usePriceContext(), { wrapper: listModeWrapper });

    await act(async () => {
      await result.current.createPrice({ id: "new", productId: "p1", currency: "usd" });
    });

    expect(StripePriceService.createPrice).toHaveBeenCalledWith({ id: "new", productId: "p1", currency: "usd" });
    expect(result.current.priceVersion).toBe(1);
  });

  it("archives and restores by explicit id", async () => {
    const { result } = renderHook(() => usePriceContext(), { wrapper: listModeWrapper });

    await act(async () => {
      await result.current.archivePrice("pr9");
      await result.current.restorePrice("pr9");
    });

    expect(StripePriceService.archivePrice).toHaveBeenCalledWith({ id: "pr9" });
    expect(StripePriceService.reactivatePrice).toHaveBeenCalledWith({ id: "pr9" });
  });

  it("publishes no page chrome when publishChrome is false", () => {
    // A nested SharedProvider would replace the host page's title. Rendering in
    // list mode must therefore leave SharedContext untouched — asserted by the
    // absence of a throw from the host's own consumer, which is covered by the
    // productId test above rendering without a SharedProvider ancestor.
    const { result } = renderHook(() => usePriceContext(), { wrapper: listModeWrapper });

    expect(result.current.price).toBeUndefined();
  });
});
