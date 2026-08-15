import { act, renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleRegistry } from "../../../../core/registry/ModuleRegistry";
import { StripeProduct } from "../../stripe-product/data/stripe-product";
import { StripeProductService } from "../../stripe-product/data/stripe-product.service";
import { ProductProvider, useProductContext } from "../ProductContext";

vi.mock("../../stripe-product/data/stripe-product.service", () => ({
  StripeProductService: {
    getProduct: vi.fn(async () => ({ id: "p1", name: "Reloaded" })),
    createProduct: vi.fn(async () => ({ id: "new", name: "Created" })),
    updateProduct: vi.fn(async () => ({ id: "p1", name: "Updated" })),
    archiveProduct: vi.fn(async () => undefined),
    reactivateProduct: vi.fn(async () => undefined),
  },
}));

vi.mock("../../../user/contexts", () => ({
  useCurrentUserContext: () => ({ hasRole: () => true, hasPermissionToModule: () => false }),
}));

vi.mock("../../../../roles", () => ({
  getRoleId: () => ({ Administrator: "administrator" }),
}));

const wrapper = ({ children }: { children: ReactNode }) => <ProductProvider>{children}</ProductProvider>;

describe("ProductContext", () => {
  beforeAll(() => {
    ModuleRegistry.register("StripeProduct", {
      name: "stripe-products",
      pageUrl: "/administration/products",
      model: StripeProduct,
    } as any);
  });

  beforeEach(() => vi.clearAllMocks());

  it("returns a no-op default outside a provider instead of throwing", () => {
    const { result } = renderHook(() => useProductContext());

    expect(result.current.product).toBeUndefined();
    expect(result.current.catalogueVersion).toBe(0);
  });

  it("bumps catalogueVersion after a create so mounted lists re-fetch", async () => {
    const { result } = renderHook(() => useProductContext(), { wrapper });

    expect(result.current.catalogueVersion).toBe(0);
    await act(async () => {
      await result.current.createProduct({ id: "new", name: "Created" });
    });

    expect(StripeProductService.createProduct).toHaveBeenCalledWith({ id: "new", name: "Created" });
    expect(result.current.catalogueVersion).toBe(1);
  });

  it("archives by explicit id and reloads rather than trusting the 204 body", async () => {
    const { result } = renderHook(() => useProductContext(), { wrapper });

    await act(async () => {
      await result.current.archiveProduct("p9");
    });

    expect(StripeProductService.archiveProduct).toHaveBeenCalledWith({ id: "p9" });
    // No product is held in list mode, so there is nothing to reload — but the
    // catalogue counter must still move or the list would show stale rows.
    await waitFor(() => expect(result.current.catalogueVersion).toBe(1));
  });

  it("restores through reactivateProduct", async () => {
    const { result } = renderHook(() => useProductContext(), { wrapper });

    await act(async () => {
      await result.current.restoreProduct("p9");
    });

    expect(StripeProductService.reactivateProduct).toHaveBeenCalledWith({ id: "p9" });
  });
});
