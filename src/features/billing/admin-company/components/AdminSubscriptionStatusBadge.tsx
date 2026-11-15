"use client";

import { useTranslations } from "next-intl";
import { Badge, type BadgeProps } from "../../../../shadcnui";
import { ADMIN_SUBSCRIPTION_STATES } from "../utils/admin-subscription-state";

const stateVariant: Record<string, BadgeProps["variant"]> = {
  trial: "softBlue",
  active: "softGreen",
  cancelled: "softAmber",
  past_due: "softRed",
  incomplete: "softGray",
  paused: "softYellow",
  ended: "softGray",
};

/** The administrator's subscription state; a status Stripe adds later is shown raw, neutral. */
export function AdminSubscriptionStatusBadge({ state }: { state: string }) {
  const t = useTranslations();
  const known = ADMIN_SUBSCRIPTION_STATES.includes(state);

  return (
    <Badge variant={stateVariant[state] ?? "softGray"} data-state={state}>
      {known ? t(`billing.ui.admin_company.status.${state}`) : state}
    </Badge>
  );
}
