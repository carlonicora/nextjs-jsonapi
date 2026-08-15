"use client";

import { ArchiveIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../../components/errors";
import { Button, ConfirmDialog } from "../../../../../shadcnui";
import { priceLabel, usePriceContext } from "../../../contexts/PriceContext";
import { StripePriceInterface } from "../../data/stripe-price.interface";

type PriceArchiverProps = {
  price: StripePriceInterface;
};

/**
 * Archive / restore control for a price. Built on ConfirmDialog, which is
 * controlled and trigger-less by design — the caller owns the trigger button,
 * so none of Base UI's trigger-composition pitfalls apply (no asChild, no
 * nested <button>).
 */
export function PriceArchiver({ price }: PriceArchiverProps) {
  const t = useTranslations();
  const { archivePrice, restorePrice } = usePriceContext();
  const [open, setOpen] = useState<boolean>(false);

  const isArchived = !price.active;
  const scope = isArchived ? "restore" : "archive";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {isArchived ? <RotateCcwIcon /> : <ArchiveIcon />}
        {t(`billing.admin.prices.${scope}.confirm`)}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t(`billing.admin.prices.${scope}.title`)}
        description={t(`billing.admin.prices.${scope}.description`, { label: priceLabel(price) })}
        confirmLabel={t(`billing.admin.prices.${scope}.confirm`)}
        cancelLabel={t("ui.buttons.cancel")}
        destructive={!isArchived}
        onConfirm={async () => {
          try {
            if (isArchived) await restorePrice(price.id);
            else await archivePrice(price.id);
          } catch (error) {
            errorToast({ title: t(`billing.admin.prices.${scope}.title`), error });
            throw error; // keeps the dialog open — ConfirmDialog swallows rejections
          }
        }}
      />
    </>
  );
}
