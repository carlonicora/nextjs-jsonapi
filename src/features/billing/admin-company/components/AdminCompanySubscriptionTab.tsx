"use client";

import { useTranslations } from "next-intl";
import { Suspense, useEffect, useState } from "react";
import { DetailField } from "../../../../components/typography/DetailField";
import { Skeleton } from "../../../../shadcnui";
import { useCompanyContext } from "../../../company/contexts/CompanyContext";
import { formatCurrency, formatDate, useBillingFormatOptions } from "../../components/utils";
import { StripeSubscriptionInterface } from "../../stripe-subscription/data/stripe-subscription.interface";
import { StripeSubscriptionService } from "../../stripe-subscription/data/stripe-subscription.service";
import { adminPriceName, adminSubscriptionState } from "../utils/admin-subscription-state";
import { AdminSubscriptionStatusBadge } from "./AdminSubscriptionStatusBadge";

/** The company's current subscription as label/value rows: the Subscription tab of the admin company page. */
function AdminCompanySubscriptionTabInternal() {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const { company } = useCompanyContext();
  const [subscription, setSubscription] = useState<StripeSubscriptionInterface | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!company) return;
    let cancelled = false;
    StripeSubscriptionService.findManyForCompany({ companyId: company.id })
      .then((subscriptions) => {
        if (!cancelled) setSubscription(subscriptions[0]);
      })
      .catch((error) => {
        console.error("Failed to load the company subscription:", error);
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [company?.id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-y-3" data-testid="admin-company-subscription">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-44" />
      </div>
    );
  }

  if (failed) {
    return (
      <p className="text-destructive text-xs/relaxed" data-testid="admin-company-subscription-error">
        {t("billing.ui.admin_company.errors.subscription")}
      </p>
    );
  }

  if (!subscription) {
    return (
      <p className="text-sm" data-testid="admin-company-subscription-none">
        {t("billing.ui.admin_company.subscription.none")}
      </p>
    );
  }

  const { state, date } = adminSubscriptionState(subscription);

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
    <div className="flex flex-col gap-y-3" data-testid="admin-company-subscription">
      <DetailField
        label={t("billing.ui.admin_company.subscription.plan")}
        value={<span data-testid="admin-company-subscription-plan">{adminPriceName(subscription.price) ?? "—"}</span>}
      />
      <DetailField
        label={t("billing.ui.admin_company.subscription.status")}
        value={
          <span data-testid="admin-company-subscription-status">
            <AdminSubscriptionStatusBadge state={state} />
          </span>
        }
      />
      {dateLabel && date && (
        <DetailField
          label={dateLabel}
          value={<span data-testid="admin-company-subscription-date">{formatDate(date, fmt)}</span>}
        />
      )}
      <DetailField
        label={t("billing.ui.admin_company.subscription.started")}
        value={<span data-testid="admin-company-subscription-started">{formatDate(subscription.createdAt, fmt)}</span>}
      />
      {discountText && (
        <DetailField
          label={t("billing.ui.admin_company.subscription.discount")}
          value={<span data-testid="admin-company-subscription-discount">{discountText}</span>}
        />
      )}
    </div>
  );
}

export function AdminCompanySubscriptionTab() {
  return (
    <Suspense fallback={<Skeleton className="h-4 w-48" />}>
      <AdminCompanySubscriptionTabInternal />
    </Suspense>
  );
}
