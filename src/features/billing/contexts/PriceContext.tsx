"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts/SharedContext";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { getRoleId } from "../../../roles";
import { useCurrentUserContext } from "../../user/contexts";
import { formatCurrency, formatInterval } from "../components/utils/currency";
import { PriceArchiver } from "../stripe-price/components/forms/PriceArchiver";
import PriceEditor from "../stripe-price/components/forms/PriceEditor";
import { StripePriceInput, StripePriceInterface } from "../stripe-price/data/stripe-price.interface";
import { StripePriceService } from "../stripe-price/data/stripe-price.service";

export interface PriceContextType {
  price: StripePriceInterface | undefined;
  setPrice: (value: StripePriceInterface | undefined) => void;
  reloadPrice: () => Promise<void>;
  createPrice: (input: StripePriceInput) => Promise<StripePriceInterface>;
  updatePrice: (input: StripePriceInput) => Promise<StripePriceInterface>;
  archivePrice: (id?: string) => Promise<void>;
  restorePrice: (id?: string) => Promise<void>;
  /** Bumped by every mutation. Mounted lists re-fetch on it. */
  priceVersion: number;
  refreshPrices: () => void;
  /** Product a newly created price attaches to. Set in list mode (prices tab). */
  productId: string | undefined;
}

const PriceContext = createContext<PriceContextType | undefined>(undefined);

export type PriceProviderProps = {
  children: ReactNode;
  dehydratedPrice?: JsonApiHydratedDataInterface;
  /**
   * Publish breadcrumbs + title into SharedProvider. Pass `false` when this
   * provider is mounted INSIDE another entity's page (the prices tab mounts
   * PriceProvider that way): SharedProvider replaces its value for the subtree
   * rather than merging (SharedContext.tsx:35-37), so a nested provider that
   * publishes chrome would blank the host page's title.
   */
  publishChrome?: boolean;
  /** Required in list mode (the prices tab) so new prices attach to the right product. */
  productId?: string;
};

const defaultContextValue: PriceContextType = {
  price: undefined,
  setPrice: () => {},
  reloadPrice: async () => {},
  createPrice: async () => {
    throw new Error("createPrice requires a PriceProvider");
  },
  updatePrice: async () => {
    throw new Error("updatePrice requires a PriceProvider");
  },
  archivePrice: async () => {},
  restorePrice: async () => {},
  priceVersion: 0,
  refreshPrices: () => {},
  productId: undefined,
};

/** Human label for a price: its nickname, else amount + interval. */
export function priceLabel(price: StripePriceInterface): string {
  return price.nickname ?? `${formatCurrency(price.unitAmount, price.currency)} ${formatInterval(price)}`.trim();
}

export const PriceProvider = ({
  children,
  dehydratedPrice,
  publishChrome = true,
  productId: productIdProp,
}: PriceProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { hasRole } = useCurrentUserContext();

  const [price, setPrice] = useState<StripePriceInterface | undefined>(
    dehydratedPrice ? rehydrate<StripePriceInterface>(Modules.StripePrice, dehydratedPrice) : undefined,
  );
  const [priceVersion, setPriceVersion] = useState<number>(0);

  const refreshPrices = useCallback(() => setPriceVersion((value) => value + 1), []);

  // NOT `price.productId`: that getter throws ("productId is not defined") when
  // the attribute is absent, and it always is — the API's mapStripePrice sets
  // `stripeProduct: undefined`, and the serialiser derives the productId
  // attribute from exactly that field, so a price never carries one over the
  // wire. Reading it here crashed the whole price page on mount. Fall back to
  // the hydrated relationship, which is a safe optional getter.
  const productId = productIdProp ?? price?.product?.id;

  const reloadPrice = useCallback(async () => {
    if (!price?.id) return;
    setPrice(await StripePriceService.getPrice({ id: price.id }));
  }, [price?.id]);

  const createPrice = useCallback(
    async (input: StripePriceInput) => {
      const saved = await StripePriceService.createPrice(input);
      refreshPrices();
      return saved;
    },
    [refreshPrices],
  );

  const updatePrice = useCallback(
    async (input: StripePriceInput) => {
      const saved = await StripePriceService.updatePrice(input);
      setPrice(saved);
      refreshPrices();
      return saved;
    },
    [refreshPrices],
  );

  // The archive/reactivate routes answer 204 NO_CONTENT with an empty body
  // (stripe-price.controller.ts:129-155) even though the service signature
  // claims it returns void — so the response is discarded and the entity is
  // re-read instead.
  const archivePrice = useCallback(
    async (id?: string) => {
      const target = id ?? price?.id;
      if (!target) return;
      await StripePriceService.archivePrice({ id: target });
      await reloadPrice();
      refreshPrices();
    },
    [price?.id, reloadPrice, refreshPrices],
  );

  const restorePrice = useCallback(
    async (id?: string) => {
      const target = id ?? price?.id;
      if (!target) return;
      await StripePriceService.reactivatePrice({ id: target });
      await reloadPrice();
      refreshPrices();
    },
    [price?.id, reloadPrice, refreshPrices],
  );

  const value = useMemo<PriceContextType>(
    () => ({
      price,
      setPrice,
      reloadPrice,
      createPrice,
      updatePrice,
      archivePrice,
      restorePrice,
      priceVersion,
      refreshPrices,
      productId,
    }),
    [price, reloadPrice, createPrice, updatePrice, archivePrice, restorePrice, priceVersion, refreshPrices, productId],
  );

  if (!publishChrome) return <PriceContext.Provider value={value}>{children}</PriceContext.Provider>;

  const breadcrumb = (): BreadcrumbItemData[] => {
    const items: BreadcrumbItemData[] = [
      { name: t("billing.admin.products.title"), href: generateUrl({ page: Modules.StripeProduct }) },
    ];
    if (price?.product)
      items.push({
        name: price.product.name,
        href: generateUrl({ page: Modules.StripeProduct, id: price.product.id }),
      });
    if (price) items.push({ name: priceLabel(price) });
    return items;
  };

  const title = () => {
    const response: any = { type: t("billing.admin.prices.title") };
    if (!price) return response;

    response.element = priceLabel(price);

    // narr8 note: gate on hasRole ONLY. hasPermissionToModule always returns
    // false in this app, so gating an editor on it hides the editor outright.
    if (hasRole(getRoleId().Administrator)) {
      response.functions = [
        <PriceArchiver key="priceArchiver" price={price} />,
        <PriceEditor key="priceEditor" price={price} propagateChanges={setPrice} />,
      ];
    }

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <PriceContext.Provider value={value}>{children}</PriceContext.Provider>
    </SharedProvider>
  );
};

export const usePriceContext = (): PriceContextType => useContext(PriceContext) ?? defaultContextValue;
