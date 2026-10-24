"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import {
  DetailField,
  EditorSheet,
  EntityMultiSelector,
  FormDateTime,
  FormInput,
  FormSelect,
  SectionHeader,
} from "../../../../../components";
import { Modules } from "../../../../../core";
import { useI18nRouter } from "../../../../../i18n";
import { formatDate, useBillingFormatOptions } from "../../../components/utils";
import { useCouponContext } from "../../../contexts/CouponContext";
import { StripeProductInterface } from "../../../stripe-product/data/stripe-product.interface";
import { StripeProductService } from "../../../stripe-product/data/stripe-product.service";
import { StripeCouponInput, StripeCouponInterface } from "../../data/stripe-coupon.interface";
import { formatCouponDiscount } from "../../utils/format-coupon-discount";
import {
  CouponCodeFields,
  couponCodeDefaults,
  couponCodeSchema,
  couponCurrencyOptions,
  optionalDate,
  optionalDecimal,
  optionalPositiveInt,
  toCouponCodeInput,
} from "./CouponCodeFields";

export type CouponEditorProps = {
  coupon?: StripeCouponInterface;
  propagateChanges?: (coupon: StripeCouponInterface) => void;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function CouponEditorInternal({
  coupon,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: CouponEditorProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const router = useI18nRouter();
  const { createCoupon, renameCoupon } = useCouponContext();
  const isEdit = !!coupon;

  // Mirrors StripeCouponPostAttributesDTO. Edit mode is a rename: Stripe allows
  // changing only a coupon's name after creation, so the schema is the name alone.
  const formSchema = useMemo(() => {
    const name = z.string().min(1, { message: t("billing.admin.coupons.errors.name") });
    if (isEdit) return z.object({ id: z.string(), name });

    return z
      .object({
        id: z.uuidv4(),
        name,
        stripeCouponId: z.string().optional(),
        discountType: z.enum(["percent_off", "amount_off"]),
        percentOff: optionalDecimal(),
        amountOff: optionalDecimal(),
        currency: z.string().min(1),
        duration: z.enum(["once", "repeating", "forever"]),
        durationInMonths: optionalPositiveInt(),
        products: z.array(z.object({ id: z.string(), name: z.string().optional() })),
        redeemBy: optionalDate(),
        maxRedemptions: optionalPositiveInt(),
        firstCode: couponCodeSchema(t),
      })
      .superRefine((values, ctx) => {
        if (
          values.discountType === "percent_off" &&
          (values.percentOff === undefined || values.percentOff < 0.01 || values.percentOff > 100)
        )
          ctx.addIssue({
            code: "custom",
            path: ["percentOff"],
            message: t("billing.admin.coupons.errors.percentOff"),
          });
        if (values.discountType === "amount_off" && (values.amountOff === undefined || values.amountOff <= 0))
          ctx.addIssue({
            code: "custom",
            path: ["amountOff"],
            message: t("billing.admin.coupons.errors.amountOff"),
          });
        if (values.duration === "repeating" && values.durationInMonths === undefined)
          ctx.addIssue({
            code: "custom",
            path: ["durationInMonths"],
            message: t("billing.admin.coupons.errors.durationInMonths"),
          });
      });
  }, [t, isEdit]);

  const getDefaultValues = useCallback(
    (): any =>
      coupon
        ? { id: coupon.id, name: coupon.name }
        : {
            id: v4(),
            name: "",
            stripeCouponId: "",
            discountType: "percent_off",
            percentOff: "",
            amountOff: "",
            currency: "eur",
            duration: "forever",
            // "" not undefined for every FormInput: see couponCodeDefaults.
            durationInMonths: "",
            products: [],
            redeemBy: undefined,
            maxRedemptions: "",
            firstCode: couponCodeDefaults(),
          },
    [coupon],
  );

  const form = useForm<any>({
    resolver: zodResolver(formSchema as any) as any,
    defaultValues: getDefaultValues(),
  });

  const watchDiscountType = form.watch("discountType");
  const watchDuration = form.watch("duration");

  const discountTypeOptions = [
    { id: "percent_off", text: t("billing.admin.coupons.type.percent_off") },
    { id: "amount_off", text: t("billing.admin.coupons.type.amount_off") },
  ];

  const durationOptions = [
    { id: "once", text: t("billing.admin.coupons.duration.once") },
    { id: "repeating", text: t("billing.admin.coupons.duration.repeating") },
    { id: "forever", text: t("billing.admin.coupons.duration.forever") },
  ];

  return (
    <EditorSheet
      form={form}
      entityType={t("billing.admin.coupons.entity")}
      entityName={coupon?.name}
      isEdit={isEdit}
      module={Modules.StripeCoupon}
      size="lg"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values: any) => {
        if (isEdit) return await renameCoupon({ id: coupon.id, name: values.name });

        const payload: StripeCouponInput = {
          id: values.id,
          name: values.name,
          discountType: values.discountType,
          duration: values.duration,
          firstCode: toCouponCodeInput(values.firstCode),
        };
        if (values.stripeCouponId?.trim()) payload.stripeCouponId = values.stripeCouponId.trim();
        if (values.discountType === "percent_off") payload.percentOff = values.percentOff;
        else {
          payload.amountOff = Math.round(values.amountOff * 100);
          payload.currency = values.currency;
        }
        if (values.duration === "repeating") payload.durationInMonths = values.durationInMonths;
        if (values.products.length > 0) payload.productIds = values.products.map((p: { id: string }) => p.id);
        if (values.redeemBy) payload.redeemBy = values.redeemBy;
        if (values.maxRedemptions !== undefined) payload.maxRedemptions = values.maxRedemptions;

        return await createCoupon(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        <FormInput
          form={form}
          id="name"
          name={t("billing.admin.coupons.fields.name")}
          placeholder={t("billing.admin.coupons.placeholders.name")}
          isRequired
        />

        {isEdit ? (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailField
                label={t("billing.admin.coupons.fields.discount")}
                value={formatCouponDiscount(coupon, t, fmt)}
              />
              <DetailField
                label={t("billing.admin.coupons.fields.redeemBy")}
                value={coupon.redeemBy ? formatDate(coupon.redeemBy, fmt) : "—"}
              />
              <DetailField
                label={t("billing.admin.coupons.fields.maxRedemptions")}
                value={
                  <span className="tabular-nums">
                    {coupon.maxRedemptions ?? t("billing.admin.coupons.places.no_limit")}
                  </span>
                }
              />
              <DetailField
                label={t("billing.admin.coupons.fields.stripeId")}
                value={<span className="tabular-nums">{coupon.stripeCouponId}</span>}
              />
            </div>
            {/* Typography role 10 (helper text). */}
            <p className="text-muted-foreground text-xs/relaxed">{t("billing.admin.coupons.fixed_notice")}</p>
          </>
        ) : (
          <>
            <FormInput
              form={form}
              id="stripeCouponId"
              name={t("billing.admin.coupons.fields.stripeCouponId")}
              placeholder={t("billing.admin.coupons.placeholders.stripeCouponId")}
            />

            <FormSelect
              form={form}
              id="discountType"
              name={t("billing.admin.coupons.fields.discountType")}
              values={discountTypeOptions}
            />

            {watchDiscountType === "percent_off" ? (
              <FormInput
                form={form}
                id="percentOff"
                type="decimal"
                name={t("billing.admin.coupons.fields.percentOff")}
                placeholder={t("billing.admin.coupons.placeholders.percentOff")}
                isRequired
              />
            ) : (
              <div className="grid grid-cols-2 gap-x-4">
                {/* type="decimal", NOT type="currency": the currency variant hardcodes
                    a Euro symbol (FormInput.tsx:105-106), which contradicts the
                    currency selector sitting next to it. */}
                <FormInput
                  form={form}
                  id="amountOff"
                  type="decimal"
                  name={t("billing.admin.coupons.fields.amountOff")}
                  placeholder={t("billing.admin.coupons.placeholders.amountOff")}
                  isRequired
                />
                <FormSelect
                  form={form}
                  id="currency"
                  name={t("billing.admin.coupons.fields.currency")}
                  values={couponCurrencyOptions}
                  isRequired
                />
              </div>
            )}

            <FormSelect
              form={form}
              id="duration"
              name={t("billing.admin.coupons.fields.duration")}
              values={durationOptions}
            />

            {watchDuration === "repeating" && (
              <FormInput
                form={form}
                id="durationInMonths"
                type="number"
                name={t("billing.admin.coupons.fields.durationInMonths")}
                placeholder={t("billing.admin.coupons.placeholders.durationInMonths")}
                isRequired
              />
            )}

            <EntityMultiSelector<StripeProductInterface>
              id="products"
              form={form}
              label={t("billing.admin.coupons.fields.products")}
              description={t("billing.admin.coupons.help.products")}
              retriever={(params) => StripeProductService.listProducts(params)}
              module={Modules.StripeProduct}
              getLabel={(product) => product.name}
            />

            <FormDateTime
              form={form}
              id="redeemBy"
              name={t("billing.admin.coupons.fields.redeemBy")}
              minDate={new Date()}
              allowEmpty
            />

            <FormInput
              form={form}
              id="maxRedemptions"
              type="number"
              name={t("billing.admin.coupons.fields.maxRedemptions")}
              placeholder={t("billing.admin.coupons.placeholders.maxRedemptions")}
            />

            <SectionHeader>{t("billing.admin.coupons.first_code")}</SectionHeader>
            <CouponCodeFields form={form} prefix="firstCode." />
          </>
        )}
      </div>
    </EditorSheet>
  );
}

export default function CouponEditor(props: CouponEditorProps) {
  return <CouponEditorInternal {...props} />;
}
