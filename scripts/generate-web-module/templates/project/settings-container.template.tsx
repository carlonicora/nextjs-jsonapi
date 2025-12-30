/**
 * Settings Container Template
 *
 * Generates SettingsContainer with company and billing sections (including Stripe)
 */

import * as fs from "fs";
import * as path from "path";

export function generateSettingsContainerTemplate(webBasePath: string): string | null {
  const outputPath = path.join(webBasePath, "apps/web/src/features/common/components/containers/SettingsContainer.tsx");

  if (fs.existsSync(outputPath)) {
    return null; // Skip if exists
  }

  return `"use client";

import { useSettingsContext } from "@/features/common/contexts/SettingsContext";
import { cn } from "@/utils/cn";
import { Action, ModuleWithPermissions, Modules, getRoleId } from "@carlonicora/nextjs-jsonapi";
import { usePageUrlGenerator } from "@carlonicora/nextjs-jsonapi/client";
import {
  CompanyContainer,
  ContentTitle,
  InvoicesContainer,
  PaymentMethodsContainer,
  ProductsAdminContainer,
  SubscriptionsContainer,
  UsageContainer,
  UsersListContainer,
  isStripeConfigured,
} from "@carlonicora/nextjs-jsonapi/components";
import { useCurrentUserContext } from "@carlonicora/nextjs-jsonapi/contexts";

import { Activity, Building2Icon, CreditCard, LucideIcon, Package, Receipt, UsersIcon, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ReactNode, useEffect, useState } from "react";

type SidebarItem = {
  id: string;
  icon: LucideIcon;
  label?: string;
  container: ReactNode;
  module: ModuleWithPermissions;
  singleItem?: boolean;
  requiredPermission?: Action;
  requiredRole?: string;
  hidden?: boolean;
};

export default function SettingsContainer() {
  const { module, setModule } = useSettingsContext();
  const t = useTranslations();
  const locale = useLocale();
  const { hasPermissionToModule, hasRole } = useCurrentUserContext();
  const [selectedComponent, setSelectedComponent] = useState<SidebarItem | null>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const generateUrl = usePageUrlGenerator();

  // Helper function to check if company has metered subscriptions
  const hasMeteredSubscriptions = (): boolean => {
    return subscriptions.some((sub) => sub.price?.recurring?.usageType === "metered");
  };

  // Build sidebars array - only include billing if Stripe is configured
  const billingSection = isStripeConfigured()
    ? !hasRole(getRoleId().Administrator)
      ? {
          name: "billing",
          label: t("billing.title"),
          items: [
            {
              id: "billing-subscriptions",
              icon: CreditCard,
              label: t("billing.subscriptions.title"),
              container: <SubscriptionsContainer />,
              module: Modules.Billing,
              requiredPermission: Action.Read,
            },
            {
              id: "billing-payment-methods",
              icon: Wallet,
              label: t("billing.payment_methods.title"),
              container: <PaymentMethodsContainer />,
              module: Modules.Billing,
              requiredPermission: Action.Read,
            },
            {
              id: "billing-invoices",
              icon: Receipt,
              label: t("billing.invoices.title"),
              container: <InvoicesContainer />,
              module: Modules.Billing,
              requiredPermission: Action.Read,
            },
            {
              id: "billing-usage",
              icon: Activity,
              label: t("billing.usage.title"),
              container: <UsageContainer />,
              module: Modules.Billing,
              requiredPermission: Action.Read,
              hidden: !hasMeteredSubscriptions(),
            },
          ],
        }
      : {
          name: \`billing\`,
          label: t("billing.title"),
          items: [
            {
              id: "billing-admin-products",
              icon: Package,
              label: t("billing.admin.products.title"),
              container: <ProductsAdminContainer />,
              module: Modules.Billing,
              requiredRole: getRoleId().Administrator,
            },
          ],
        }
    : null;

  const companySection = !hasRole(getRoleId().Administrator)
    ? {
        name: \`company\`,
        items: [
          {
            id: "company",
            icon: Building2Icon,
            container: <CompanyContainer />,
            module: Modules.Company,
            singleItem: true,
          },
          { id: "user", icon: UsersIcon, container: <UsersListContainer />, module: Modules.User },
        ],
      }
    : null;

  const sidebars: {
    name: string;
    label?: string;
    items: SidebarItem[];
  }[] = [...(companySection ? [companySection] : []), ...(billingSection ? [billingSection] : [])];

  useEffect(() => {
    if (module) {
      const found = sidebars
        .map((sidebar) => sidebar.items.find((item) => item.module.name === module.name))
        .find((item) => item !== undefined);
      if (found) {
        setSelectedComponent(found);
      } else {
        setSelectedComponent(null);
        setModule(undefined);
      }
    } else {
      setSelectedComponent(null);
    }
  }, [module]);

  return (
    <div className="flex w-full gap-x-4">
      <div className="sticky top-16 flex h-[calc(100vh-theme(spacing.20))] w-2xl flex-col justify-between border-r pr-4">
        <div className="flex min-h-0 flex-1 overflow-y-auto">
          <div className="flex w-full flex-col">
            <ContentTitle element={t(\`generic.settings\`)} />
            <nav className="space-y-4">
              {sidebars.map((sidebar) => (
                <div key={sidebar.name} className="">
                  <h3 className="text-muted-foreground mb-2 text-lg font-light">
                    {sidebar.label || t(\`generic.settings_sidebar\`, { item: sidebar.name })}
                  </h3>
                  {sidebar.items.map((item) => {
                    // Check if item is hidden
                    if (item.hidden) return null;

                    // Check permission-based access
                    if (item.requiredPermission) {
                      if (!hasPermissionToModule({ module: item.module, action: item.requiredPermission })) return null;
                    } else if (!hasPermissionToModule({ module: item.module, action: Action.Read })) {
                      return null;
                    }

                    // Check role-based access
                    if (item.requiredRole && !hasRole(item.requiredRole)) return null;

                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setModule(item.module);
                          setSelectedComponent(item);
                          window.history.replaceState(
                            null,
                            "",
                            generateUrl({ page: \`/settings\`, id: item.module.name, language: locale }),
                          );
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                          selectedComponent?.id === item.id
                            ? "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.label || t(\`types.\${item.module.name}\`, { count: item.singleItem ? 1 : 2 })}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col gap-y-4 pb-20">{selectedComponent ? selectedComponent.container : null}</div>
    </div>
  );
}
`;
}
