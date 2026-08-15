"use client";

import { ArchiveIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { errorToast } from "../../../../../components/errors";
import { Button, ConfirmDialog } from "../../../../../shadcnui";
import { useProductContext } from "../../../contexts/ProductContext";
import { StripeProductInterface } from "../../data/stripe-product.interface";

type ProductArchiverProps = {
  product: StripeProductInterface;
};

/**
 * Archive / restore control for a product. Built on ConfirmDialog, which is
 * controlled and trigger-less by design — the caller owns the trigger button,
 * so none of Base UI's trigger-composition pitfalls apply (no asChild, no
 * nested <button>).
 */
export function ProductArchiver({ product }: ProductArchiverProps) {
  const t = useTranslations();
  const { archiveProduct, restoreProduct } = useProductContext();
  const [open, setOpen] = useState<boolean>(false);

  const isArchived = !product.active;
  const scope = isArchived ? "restore" : "archive";

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {isArchived ? <RotateCcwIcon /> : <ArchiveIcon />}
        {t(`billing.admin.products.${scope}.confirm`)}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t(`billing.admin.products.${scope}.title`)}
        description={t(`billing.admin.products.${scope}.description`, { name: product.name })}
        confirmLabel={t(`billing.admin.products.${scope}.confirm`)}
        cancelLabel={t("ui.buttons.cancel")}
        destructive={!isArchived}
        onConfirm={async () => {
          try {
            if (isArchived) await restoreProduct(product.id);
            else await archiveProduct(product.id);
          } catch (error) {
            errorToast({ title: t(`billing.admin.products.${scope}.title`), error });
            throw error; // keeps the dialog open — ConfirmDialog swallows rejections
          }
        }}
      />
    </>
  );
}
