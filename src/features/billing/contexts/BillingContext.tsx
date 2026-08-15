"use client";

import { useTranslations } from "next-intl";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { SharedProvider } from "../../../contexts/SharedContext";
import { BreadcrumbItemData } from "../../../interfaces";
import { getRoleId } from "../../../roles";
import { Button } from "../../../shadcnui";
import { useCurrentUserContext } from "../../user/contexts";
import { ProductEditor } from "../stripe-product/components/forms/ProductEditor";

interface BillingContextType {
  /**
   * Bumped every time the provider's own actions change the product catalogue.
   * ProductsAdminContainer reloads on it — the create action lives up here in
   * the page title bar, so it cannot call the container's loader directly.
   */
  refreshToken: number;
  refresh: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

type BillingProviderProps = {
  children: ReactNode;
};

/**
 * Page chrome for the administrative billing surface (Stripe products, prices
 * and their credit allowances).
 *
 * Billing gets its own provider rather than borrowing AdministrationProvider so
 * the page carries its own name — and, like CompanyProvider with CompanyEditor,
 * it owns the page's ACTIONS: the create-product control is published through
 * `title.functions`, which RoundPageContainerTitle renders in the header bar.
 * That is where every other page in this codebase puts its primary action.
 */
export const BillingProvider = ({ children }: BillingProviderProps) => {
  const t = useTranslations();
  const { hasRole } = useCurrentUserContext();
  const [showCreateProduct, setShowCreateProduct] = useState<boolean>(false);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  // No href: this crumb IS the current page. Linking it would also point at the
  // StripeProduct module's `pageUrl` (/stripe-products), which no consuming app
  // routes — the page lives under the administration tree.
  const breadcrumbs: BreadcrumbItemData[] = [{ name: t(`billing.admin.products.title`) }];

  const title = () => {
    const response: any = { type: t(`billing.admin.products.title`) };

    if (hasRole(getRoleId().Administrator)) {
      response.functions = [
        <Button key="productEditorTrigger" onClick={() => setShowCreateProduct(true)}>
          {t(`billing.admin.products.create`)}
        </Button>,
        showCreateProduct ? (
          <ProductEditor
            key="productEditor"
            open={showCreateProduct}
            onOpenChange={setShowCreateProduct}
            onSuccess={() => {
              setShowCreateProduct(false);
              refresh();
            }}
          />
        ) : null,
      ];
    }

    return response;
  };

  return (
    <SharedProvider value={{ breadcrumbs, title: title() }}>
      <BillingContext.Provider value={{ refreshToken, refresh }}>{children}</BillingContext.Provider>
    </SharedProvider>
  );
};

export const useBillingContext = (): BillingContextType => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error("useBillingContext must be used within a BillingProvider");
  }
  return context;
};

/**
 * Non-throwing variant. ProductsAdminContainer predates this provider and is
 * still mounted bare by other consumers, so it must keep working without one.
 */
export const useOptionalBillingContext = (): BillingContextType | undefined => useContext(BillingContext);
