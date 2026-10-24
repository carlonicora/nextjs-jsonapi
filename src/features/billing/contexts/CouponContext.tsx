"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { SharedProvider } from "../../../contexts/SharedContext";
import { JsonApiHydratedDataInterface, Modules, rehydrate } from "../../../core";
import { usePageUrlGenerator } from "../../../hooks";
import { BreadcrumbItemData } from "../../../interfaces";
import { getRoleId } from "../../../roles";
import { useCurrentUserContext } from "../../user/contexts";
import { CouponRefresher } from "../stripe-coupon/components/forms/CouponRefresher";
import CouponEditor from "../stripe-coupon/components/forms/CouponEditor";
import {
  StripeCouponCodeFlagsInput,
  StripeCouponCodeInput,
  StripeCouponCodeInterface,
} from "../stripe-coupon/data/stripe-coupon-code.interface";
import { StripeCouponCodeService } from "../stripe-coupon/data/stripe-coupon-code.service";
import {
  StripeCouponInput,
  StripeCouponInterface,
  StripeCouponRenameInput,
} from "../stripe-coupon/data/stripe-coupon.interface";
import { StripeCouponService } from "../stripe-coupon/data/stripe-coupon.service";

export interface CouponContextType {
  coupon: StripeCouponInterface | undefined;
  setCoupon: (value: StripeCouponInterface | undefined) => void;
  reloadCoupon: () => Promise<void>;
  createCoupon: (input: StripeCouponInput) => Promise<StripeCouponInterface>;
  renameCoupon: (input: StripeCouponRenameInput) => Promise<StripeCouponInterface>;
  refreshCounts: (id?: string) => Promise<void>;
  createCode: (input: StripeCouponCodeInput) => Promise<StripeCouponCodeInterface>;
  updateCodeFlags: (input: StripeCouponCodeFlagsInput) => Promise<StripeCouponCodeInterface>;
  /** Bumped by every mutation. Mounted lists re-fetch on it. */
  catalogueVersion: number;
  refreshCatalogue: () => void;
}

const CouponContext = createContext<CouponContextType | undefined>(undefined);

export type CouponProviderProps = {
  children: ReactNode;
  dehydratedCoupon?: JsonApiHydratedDataInterface;
  /**
   * Publish breadcrumbs + title into SharedProvider. Pass `false` when this
   * provider is mounted INSIDE another entity's page (the Codes tab of the
   * products page mounts CouponProvider that way): SharedProvider replaces its
   * value for the subtree rather than merging (SharedContext.tsx:35-37), so a
   * nested provider that publishes chrome would blank the host page's title.
   */
  publishChrome?: boolean;
};

const defaultContextValue: CouponContextType = {
  coupon: undefined,
  setCoupon: () => {},
  reloadCoupon: async () => {},
  createCoupon: async () => {
    throw new Error("createCoupon requires a CouponProvider");
  },
  renameCoupon: async () => {
    throw new Error("renameCoupon requires a CouponProvider");
  },
  refreshCounts: async () => {},
  createCode: async () => {
    throw new Error("createCode requires a CouponProvider");
  },
  updateCodeFlags: async () => {
    throw new Error("updateCodeFlags requires a CouponProvider");
  },
  catalogueVersion: 0,
  refreshCatalogue: () => {},
};

export const CouponProvider = ({ children, dehydratedCoupon, publishChrome = true }: CouponProviderProps) => {
  const t = useTranslations();
  const generateUrl = usePageUrlGenerator();
  const { hasRole } = useCurrentUserContext();

  const [coupon, setCoupon] = useState<StripeCouponInterface | undefined>(
    dehydratedCoupon ? rehydrate<StripeCouponInterface>(Modules.StripeCoupon, dehydratedCoupon) : undefined,
  );
  const [catalogueVersion, setCatalogueVersion] = useState<number>(0);

  const refreshCatalogue = useCallback(() => setCatalogueVersion((value) => value + 1), []);

  const reloadCoupon = useCallback(async () => {
    if (!coupon?.id) return;
    setCoupon(await StripeCouponService.getCoupon({ id: coupon.id }));
  }, [coupon?.id]);

  const createCoupon = useCallback(
    async (input: StripeCouponInput) => {
      const saved = await StripeCouponService.createCoupon(input);
      refreshCatalogue();
      return saved;
    },
    [refreshCatalogue],
  );

  const renameCoupon = useCallback(
    async (input: StripeCouponRenameInput) => {
      const saved = await StripeCouponService.renameCoupon(input);
      setCoupon(saved);
      refreshCatalogue();
      return saved;
    },
    [refreshCatalogue],
  );

  const refreshCounts = useCallback(
    async (id?: string) => {
      const target = id ?? coupon?.id;
      if (!target) return;
      const saved = await StripeCouponService.refreshCounts({ id: target });
      if (coupon?.id === target) setCoupon(saved);
      refreshCatalogue();
    },
    [coupon?.id, refreshCatalogue],
  );

  const createCode = useCallback(
    async (input: StripeCouponCodeInput) => {
      const saved = await StripeCouponCodeService.createCode(input);
      await reloadCoupon();
      refreshCatalogue();
      return saved;
    },
    [reloadCoupon, refreshCatalogue],
  );

  const updateCodeFlags = useCallback(
    async (input: StripeCouponCodeFlagsInput) => {
      const saved = await StripeCouponCodeService.updateFlags(input);
      await reloadCoupon();
      refreshCatalogue();
      return saved;
    },
    [reloadCoupon, refreshCatalogue],
  );

  const value = useMemo<CouponContextType>(
    () => ({
      coupon,
      setCoupon,
      reloadCoupon,
      createCoupon,
      renameCoupon,
      refreshCounts,
      createCode,
      updateCodeFlags,
      catalogueVersion,
      refreshCatalogue,
    }),
    [
      coupon,
      reloadCoupon,
      createCoupon,
      renameCoupon,
      refreshCounts,
      createCode,
      updateCodeFlags,
      catalogueVersion,
      refreshCatalogue,
    ],
  );

  if (!publishChrome) return <CouponContext.Provider value={value}>{children}</CouponContext.Provider>;

  const breadcrumb = (): BreadcrumbItemData[] => {
    const items: BreadcrumbItemData[] = [
      {
        name: t("billing.admin.products.tabs.codes"),
        // Linked only when it is NOT the current page. The Codes list is a tab
        // of the products page, so the link carries its `?section=`.
        ...(coupon
          ? { href: generateUrl({ page: Modules.StripeProduct, additionalParameters: { section: "codes" } }) }
          : {}),
      },
    ];
    if (coupon) items.push({ name: coupon.name });
    return items;
  };

  const title = () => {
    const response: any = { type: t("billing.admin.coupons.title") };
    if (!coupon) return response;

    response.element = coupon.name;

    if (hasRole(getRoleId().Administrator)) {
      response.functions = [
        <CouponRefresher key="couponRefresher" coupon={coupon} />,
        <CouponEditor key="couponEditor" coupon={coupon} propagateChanges={setCoupon} />,
      ];
    }

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs: breadcrumb(), title: title() }}>
      <CouponContext.Provider value={value}>{children}</CouponContext.Provider>
    </SharedProvider>
  );
};

export const useCouponContext = (): CouponContextType => useContext(CouponContext) ?? defaultContextValue;
