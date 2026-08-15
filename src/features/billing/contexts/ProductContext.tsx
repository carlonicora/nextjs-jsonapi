"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts/SharedContext";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { getRoleId } from "../../../roles";
import { useCurrentUserContext } from "../../user/contexts";
import { ProductArchiver } from "../stripe-product/components/forms/ProductArchiver";
import ProductEditor from "../stripe-product/components/forms/ProductEditor";
import { StripeProductInput, StripeProductInterface } from "../stripe-product/data/stripe-product.interface";
import { StripeProductService } from "../stripe-product/data/stripe-product.service";

export interface ProductContextType {
  product: StripeProductInterface | undefined;
  setProduct: (value: StripeProductInterface | undefined) => void;
  reloadProduct: () => Promise<void>;
  createProduct: (input: StripeProductInput) => Promise<StripeProductInterface>;
  updateProduct: (input: StripeProductInput) => Promise<StripeProductInterface>;
  archiveProduct: (id?: string) => Promise<void>;
  restoreProduct: (id?: string) => Promise<void>;
  /** Bumped by every mutation. Mounted lists re-fetch on it. */
  catalogueVersion: number;
  refreshCatalogue: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export type ProductProviderProps = {
  children: ReactNode;
  dehydratedProduct?: JsonApiHydratedDataInterface;
  /**
   * Publish breadcrumbs + title into SharedProvider. Pass `false` when this
   * provider is mounted INSIDE another entity's page (the prices tab mounts
   * PriceProvider that way): SharedProvider replaces its value for the subtree
   * rather than merging (SharedContext.tsx:35-37), so a nested provider that
   * publishes chrome would blank the host page's title.
   */
  publishChrome?: boolean;
};

const defaultContextValue: ProductContextType = {
  product: undefined,
  setProduct: () => {},
  reloadProduct: async () => {},
  createProduct: async () => {
    throw new Error("createProduct requires a ProductProvider");
  },
  updateProduct: async () => {
    throw new Error("updateProduct requires a ProductProvider");
  },
  archiveProduct: async () => {},
  restoreProduct: async () => {},
  catalogueVersion: 0,
  refreshCatalogue: () => {},
};

export const ProductProvider = ({ children, dehydratedProduct, publishChrome = true }: ProductProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { hasRole } = useCurrentUserContext();

  const [product, setProduct] = useState<StripeProductInterface | undefined>(
    dehydratedProduct ? rehydrate<StripeProductInterface>(Modules.StripeProduct, dehydratedProduct) : undefined,
  );
  const [catalogueVersion, setCatalogueVersion] = useState<number>(0);

  const refreshCatalogue = useCallback(() => setCatalogueVersion((value) => value + 1), []);

  const reloadProduct = useCallback(async () => {
    if (!product?.id) return;
    setProduct(await StripeProductService.getProduct({ id: product.id }));
  }, [product?.id]);

  const createProduct = useCallback(
    async (input: StripeProductInput) => {
      const saved = await StripeProductService.createProduct(input);
      refreshCatalogue();
      return saved;
    },
    [refreshCatalogue],
  );

  const updateProduct = useCallback(
    async (input: StripeProductInput) => {
      const saved = await StripeProductService.updateProduct(input);
      setProduct(saved);
      refreshCatalogue();
      return saved;
    },
    [refreshCatalogue],
  );

  // The archive/reactivate routes answer 204 NO_CONTENT with an empty body
  // (stripe-product.controller.ts:99-115) even though the service signature
  // claims it returns a product — so the response is discarded and the entity
  // is re-read instead.
  const archiveProduct = useCallback(
    async (id?: string) => {
      const target = id ?? product?.id;
      if (!target) return;
      await StripeProductService.archiveProduct({ id: target });
      await reloadProduct();
      refreshCatalogue();
    },
    [product?.id, reloadProduct, refreshCatalogue],
  );

  const restoreProduct = useCallback(
    async (id?: string) => {
      const target = id ?? product?.id;
      if (!target) return;
      await StripeProductService.reactivateProduct({ id: target });
      await reloadProduct();
      refreshCatalogue();
    },
    [product?.id, reloadProduct, refreshCatalogue],
  );

  const value = useMemo<ProductContextType>(
    () => ({
      product,
      setProduct,
      reloadProduct,
      createProduct,
      updateProduct,
      archiveProduct,
      restoreProduct,
      catalogueVersion,
      refreshCatalogue,
    }),
    [
      product,
      reloadProduct,
      createProduct,
      updateProduct,
      archiveProduct,
      restoreProduct,
      catalogueVersion,
      refreshCatalogue,
    ],
  );

  if (!publishChrome) return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;

  const breadcrumb = (): BreadcrumbItemData[] => {
    const items: BreadcrumbItemData[] = [
      {
        name: t("billing.admin.products.title"),
        // Linked only when it is NOT the current page.
        ...(product ? { href: generateUrl({ page: Modules.StripeProduct }) } : {}),
      },
    ];
    if (product) items.push({ name: product.name });
    return items;
  };

  const title = () => {
    const response: any = { type: t("billing.admin.products.title") };
    if (!product) return response;

    response.element = product.name;

    // narr8 note: gate on hasRole ONLY. hasPermissionToModule always returns
    // false in this app, so gating an editor on it hides the editor outright.
    if (hasRole(getRoleId().Administrator)) {
      response.functions = [
        <ProductArchiver key="productArchiver" product={product} />,
        <ProductEditor key="productEditor" product={product} propagateChanges={setProduct} />,
      ];
    }

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
    </SharedProvider>
  );
};

export const useProductContext = (): ProductContextType => useContext(ProductContext) ?? defaultContextValue;
