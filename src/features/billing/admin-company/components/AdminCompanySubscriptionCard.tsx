"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../components/utils";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";
import { adminPlanFromPrice, adminSubscriptionState } from "../utils/admin-subscription-state";
import { AdminSubscriptionStatusBadge } from "./AdminSubscriptionStatusBadge";

type AdminCompanySubscriptionCardProps = {
  /** The company's recurring subscriptions, current first (the admin route's order). */
  subscriptions: StripeSubscriptionInterface[];
  loading?: boolean;
  error?: string;
};

function Row({ label, testId, children }: { label: string; testId: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-x-4">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-sm" data-testid={testId}>
        {children}
      </span>
    </div>
  );
}

export function AdminCompanySubscriptionCard({ subscriptions, loading, error }: AdminCompanySubscriptionCardProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();

  const header = (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle>{t("billing.ui.admin_company.subscription.title")}</CardTitle>
      <CreditCard className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
  );

  if (loading) {
    return (
      <Card data-testid="admin-company-subscription">
        {header}
        <CardContent>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-4 w-40" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card data-testid="admin-company-subscription">
        {header}
        <CardContent>
          <p className="text-destructive text-xs/relaxed" data-testid="admin-company-subscription-error">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const subscription = subscriptions[0];

  if (!subscription) {
    return (
      <Card data-testid="admin-company-subscription">
        {header}
        <CardContent>
          <p className="text-sm text-muted-foreground" data-testid="admin-company-subscription-none">
            {t("billing.ui.admin_company.subscription.none")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { state, date } = adminSubscriptionState(subscription);
  const plan = subscription.price ? adminPlanFromPrice(subscription.price) : undefined;
  const planLabel =
    plan?.key === "monthly" || plan?.key === "yearly"
      ? t(`billing.ui.admin_company.plan.${plan.key}`)
      : (plan?.name ?? "—");

  const dateLabel = (() => {
    if (!date) return undefined;
    switch (state) {
      case "trial":
        return t("billing.ui.admin_company.subscription.trial_ends");
      case "active":
        return t("billing.ui.admin_company.subscription.renews");
      case "cancelled":
        return t("billing.ui.admin_company.subscription.ends");
      case "ended":
        return t("billing.ui.admin_company.subscription.ended");
      default:
        return undefined;
    }
  })();

  const discount = state !== "ended" ? subscription.discount : undefined;
  const discountText = (() => {
    if (!discount) return undefined;
    const value =
      discount.percentOff !== undefined
        ? `${discount.percentOff}%`
        : discount.amountOff !== undefined
          ? formatCurrency(discount.amountOff, discount.currency ?? subscription.price?.currency ?? "eur", fmt)
          : undefined;
    if (!value) return undefined;

    const duration =
      discount.duration === "forever"
        ? t("billing.ui.admin_company.discount.forever")
        : discount.duration === "once"
          ? t("billing.ui.admin_company.discount.once")
          : t("billing.ui.admin_company.discount.repeating", { months: discount.durationInMonths ?? 0 });
    const until = discount.end
      ? ` ${t("billing.ui.admin_company.discount.until", { date: formatDate(discount.end, fmt) })}`
      : "";
    return `${value} ${duration}${until}`;
  })();

  return (
    <Card data-testid="admin-company-subscription">
      {header}
      <CardContent>
        <div className="space-y-2">
          <Row label={t("billing.ui.admin_company.subscription.plan")} testId="admin-company-subscription-plan">
            {planLabel}
          </Row>
          <Row label={t("billing.ui.admin_company.subscription.status")} testId="admin-company-subscription-status">
            <AdminSubscriptionStatusBadge state={state} />
          </Row>
          {dateLabel && date && (
            <Row label={dateLabel} testId="admin-company-subscription-date">
              {formatDate(date, fmt)}
            </Row>
          )}
          <Row label={t("billing.ui.admin_company.subscription.started")} testId="admin-company-subscription-started">
            {formatDate(subscription.createdAt, fmt)}
          </Row>
          {discountText && (
            <Row
              label={t("billing.ui.admin_company.subscription.discount")}
              testId="admin-company-subscription-discount"
            >
              {discountText}
            </Row>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
