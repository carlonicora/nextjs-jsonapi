"use client";

import { RefreshCwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../../components/errors";
import { Button } from "../../../../../shadcnui";
import { useCouponContext } from "../../../contexts/CouponContext";
import { StripeCouponInterface } from "../../data/stripe-coupon.interface";

type CouponRefresherProps = {
  coupon: StripeCouponInterface;
};

/**
 * Re-reads the coupon and its codes from Stripe and writes the usage counts to
 * our copy. Counts go stale only for subscriptions made outside our endpoints
 * (the Stripe dashboard); this button fixes that.
 */
export function CouponRefresher({ coupon }: CouponRefresherProps) {
  const t = useTranslations();
  const { refreshCounts } = useCouponContext();
  const [pending, setPending] = useState<boolean>(false);

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await refreshCounts(coupon.id);
        } catch (error) {
          errorToast({ title: t("billing.admin.coupons.refresh.title"), error });
        } finally {
          setPending(false);
        }
      }}
    >
      <RefreshCwIcon />
      {t("billing.admin.coupons.refresh.title")}
    </Button>
  );
}
