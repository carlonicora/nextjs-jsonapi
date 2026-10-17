"use client";

import { useTranslations } from "next-intl";
import { ExternalLink, User } from "lucide-react";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { useI18nLocale } from "../../../../i18n";
import { StripeCustomerInterface, StripeCustomerService } from "../../stripe-customer";

type CustomerInfoCardProps = {
  customer: StripeCustomerInterface | null;
  loading?: boolean;
  error?: string;
};

function formatBalance(balance: number | undefined, currency: string | undefined, locale: string): string {
  const currencyCode = currency?.toUpperCase() || "USD";
  // Balance in Stripe is negative when customer has credit
  const displayBalance = balance ? -balance : 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(displayBalance / 100);
}

export function CustomerInfoCard({ customer, loading, error }: CustomerInfoCardProps) {
  const t = useTranslations();
  const locale = useI18nLocale();
  const [portalLoading, setPortalLoading] = useState(false);

  const handlePortalClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPortalLoading(true);
    try {
      const { url } = await StripeCustomerService.createPortalSession();
      window.open(url, "_blank");
    } catch (err) {
      console.error("[CustomerInfoCard] Failed to create portal session:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.cards.customer.title")}</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.cards.customer.title")}</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-xs/relaxed">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{t("billing.ui.cards.customer.title")}</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-muted-foreground">{t("billing.ui.cards.customer.not_set_up")}</p>
          <p className="text-xs text-muted-foreground">{t("billing.ui.cards.customer.not_set_up_description")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>{t("billing.ui.cards.customer.title")}</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {customer.name && <p className="text-xl font-bold">{customer.name}</p>}
          {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
          {customer.balance !== undefined && customer.balance !== 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">{t("billing.ui.cards.customer.credit_balance")} </span>
              <span className={customer.balance < 0 ? "text-success" : "text-destructive"}>
                {formatBalance(customer.balance, customer.currency, locale)}
              </span>
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-2" onClick={handlePortalClick} disabled={portalLoading}>
            {portalLoading ? t("common.loading") : t("billing.ui.cards.customer.manage_portal")}
            <ExternalLink className="h-4 w-4 ms-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
