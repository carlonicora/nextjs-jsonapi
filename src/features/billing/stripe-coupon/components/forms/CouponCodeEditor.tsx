"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet } from "../../../../../components";
import { Modules } from "../../../../../core";
import { useI18nRouter } from "../../../../../i18n";
import { useCouponContext } from "../../../contexts/CouponContext";
import { CouponCodeFields, couponCodeDefaults, couponCodeSchema, toCouponCodeInput } from "./CouponCodeFields";

export type CouponCodeEditorProps = {
  couponId: string;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

/**
 * Create-only: Stripe allows changing a promotion code's `active` flag and
 * little else, so a code is never edited here. "Apply automatically" and
 * deactivate / reactivate live on the row (CouponCodeActions).
 */
function CouponCodeEditorInternal({
  couponId,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: CouponCodeEditorProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const { createCode } = useCouponContext();

  const formSchema = useMemo(() => z.object({ id: z.uuidv4() }).and(couponCodeSchema(t)), [t]);
  type CouponCodeEditorValues = z.infer<typeof formSchema>;

  const getDefaultValues = useCallback((): CouponCodeEditorValues => ({ id: v4(), ...couponCodeDefaults() }), []);

  const form = useForm<CouponCodeEditorValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("billing.admin.coupons.codes.entity")}
      isEdit={false}
      module={Modules.StripeCouponCode}
      size="md"
      // A code has no page of its own: without onSuccess EditorSheet would
      // navigate to `<module pageUrl>/<codeId>`, which does not exist.
      // The context's createCode already reloads the coupon and the codes list.
      onSuccess={onSuccess ?? (() => {})}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => await createCode({ id: values.id, couponId, ...toCouponCodeInput(values) })}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <CouponCodeFields form={form} />
    </EditorSheet>
  );
}

export default function CouponCodeEditor(props: CouponCodeEditorProps) {
  return <CouponCodeEditorInternal {...props} />;
}
