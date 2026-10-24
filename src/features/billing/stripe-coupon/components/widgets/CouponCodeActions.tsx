"use client";

import { PowerIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../../components/errors";
import { Button, ConfirmDialog, Switch } from "../../../../../shadcnui";
import { useCouponContext } from "../../../contexts/CouponContext";
import { StripeCouponCodeInterface } from "../../data/stripe-coupon-code.interface";
import type { CouponCodeStatus } from "../../hooks/useStripeCouponCodeTableStructure";

type CouponCodeActionsProps = {
  code: StripeCouponCodeInterface;
  status: CouponCodeStatus;
};

/**
 * Row controls of a code: the "Apply automatically" switch and the deactivate /
 * reactivate button. The button sits behind ConfirmDialog, which is controlled
 * and trigger-less by design — the caller owns the trigger button, so none of
 * Base UI's trigger-composition pitfalls apply (no asChild, no nested <button>).
 */
export function CouponCodeActions({ code, status }: CouponCodeActionsProps) {
  const t = useTranslations();
  const { updateCodeFlags } = useCouponContext();
  const [open, setOpen] = useState<boolean>(false);
  const [pending, setPending] = useState<boolean>(false);

  // An expired or used-up code stays dead: Stripe never revives it.
  const isDead = status === "expired" || status === "used_up";
  const isInactive = !code.active;
  const scope = isInactive ? "reactivate" : "deactivate";

  return (
    <div className="flex items-center justify-end gap-x-4">
      <label className="flex items-center gap-x-2 text-xs">
        <Switch
          checked={code.automatic}
          // Switching off is always allowed; switching on only for a live code.
          disabled={pending || (!code.automatic && status !== "active")}
          onCheckedChange={async (checked) => {
            setPending(true);
            try {
              // The server clears the flag on every other code in the same
              // write; the context's refreshCatalogue re-reads the list so the
              // other row turns off too.
              await updateCodeFlags({ id: code.id, automatic: checked });
            } catch (error) {
              errorToast({ title: t("billing.admin.coupons.fields.automatic"), error });
            } finally {
              setPending(false);
            }
          }}
        />
        {t("billing.admin.coupons.fields.automatic")}
      </label>
      <Button variant="outline" size="sm" disabled={isDead} onClick={() => setOpen(true)}>
        {isInactive ? <RotateCcwIcon /> : <PowerIcon />}
        {t(`billing.admin.coupons.codes.${scope}.confirm`)}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t(`billing.admin.coupons.codes.${scope}.title`)}
        description={t(`billing.admin.coupons.codes.${scope}.description`, { code: code.code })}
        confirmLabel={t(`billing.admin.coupons.codes.${scope}.confirm`)}
        cancelLabel={t("ui.buttons.cancel")}
        destructive={!isInactive}
        onConfirm={async () => {
          try {
            await updateCodeFlags({ id: code.id, active: isInactive });
          } catch (error) {
            errorToast({ title: t(`billing.admin.coupons.codes.${scope}.title`), error });
            throw error; // keeps the dialog open — ConfirmDialog swallows rejections
          }
        }}
      />
    </div>
  );
}
