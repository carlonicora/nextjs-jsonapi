"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useMemo, useState } from "react";
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
import {
  StripeCouponDiscountInput,
  StripeCouponDurationInput,
  StripeCouponInput,
  StripeCouponInterface,
} from "../../data/stripe-coupon.interface";
import { STRIPE_COUPON_DETAIL_PAGE_URL } from "../../stripe-coupon.module";
import { formatCouponDiscount } from "../../utils/format-coupon-discount";
import {
  CouponCodeFields,
  couponCodeDefaults,
  couponCodeSchema,
  couponCurrencyOptions,
  optionalDate,
  optionalDecimal,
  optionalPositiveInt,
  parseOptionalDecimal,
  parseOptionalPositiveInt,
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

type Translator = (key: string) => string;

/**
 * Edit mode is a rename: Stripe allows changing only a coupon's name after
 * creation, so the schema is the name alone.
 */
const couponRenameSchema = (t: Translator) =>
  z.object({ id: z.string(), name: z.string().min(1, { message: t("billing.admin.coupons.errors.name") }) });

type CouponRenameValues = z.infer<ReturnType<typeof couponRenameSchema>>;

/** Mirrors StripeCouponPostAttributesDTO. */
const couponCreateSchema = (t: Translator) =>
  z
    .object({
      id: z.uuidv4(),
      name: z.string().min(1, { message: t("billing.admin.coupons.errors.name") }),
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
      const percentOff = parseOptionalDecimal(values.percentOff);
      if (values.discountType === "percent_off" && (percentOff === undefined || percentOff < 0.01 || percentOff > 100))
        ctx.addIssue({
          code: "custom",
          path: ["percentOff"],
          message: t("billing.admin.coupons.errors.percentOff"),
        });
      const amountOff = parseOptionalDecimal(values.amountOff);
      if (values.discountType === "amount_off" && (amountOff === undefined || amountOff <= 0))
        ctx.addIssue({
          code: "custom",
          path: ["amountOff"],
          message: t("billing.admin.coupons.errors.amountOff"),
        });
      if (values.duration === "repeating" && parseOptionalPositiveInt(values.durationInMonths) === undefined)
        ctx.addIssue({
          code: "custom",
          path: ["durationInMonths"],
          message: t("billing.admin.coupons.errors.durationInMonths"),
        });
    });

type CouponCreateValues = z.infer<ReturnType<typeof couponCreateSchema>>;

/** The schema guarantees the value; a missing one is a bug, not user input. */
function required<T>(value: T | undefined, field: string): T {
  if (value === undefined) throw new Error(`${field} is not set`);
  return value;
}

function toDiscountInput(values: CouponCreateValues): StripeCouponDiscountInput {
  if (values.discountType === "percent_off")
    return { discountType: "percent_off", percentOff: required(parseOptionalDecimal(values.percentOff), "percentOff") };

  return {
    discountType: "amount_off",
    amountOff: Math.round(required(parseOptionalDecimal(values.amountOff), "amountOff") * 100),
    currency: values.currency,
  };
}

function toDurationInput(values: CouponCreateValues): StripeCouponDurationInput {
  if (values.duration === "repeating")
    return {
      duration: "repeating",
      durationInMonths: required(parseOptionalPositiveInt(values.durationInMonths), "durationInMonths"),
    };

  return { duration: values.duration };
}

/** Form values → the coupon the model serialises. Unset fields are left out. */
function toCouponInput(values: CouponCreateValues): StripeCouponInput {
  const payload: StripeCouponInput = {
    id: values.id,
    name: values.name,
    firstCode: toCouponCodeInput(values.firstCode),
    ...toDiscountInput(values),
    ...toDurationInput(values),
  };
  if (values.stripeCouponId?.trim()) payload.stripeCouponId = values.stripeCouponId.trim();
  if (values.products.length > 0) payload.productIds = values.products.map((product) => product.id);
  if (values.redeemBy) payload.redeemBy = values.redeemBy;
  const maxRedemptions = parseOptionalPositiveInt(values.maxRedemptions);
  if (maxRedemptions !== undefined) payload.maxRedemptions = maxRedemptions;
  return payload;
}

/**
 * The module with the coupon's own route as pageUrl: the module's pageUrl is the
 * products page (the coupons list is its Codes tab), so EditorSheet's
 * navigate / revalidate after a save would otherwise land on
 * `/administration/products/<couponId>`.
 */
function couponPageModule() {
  return { ...Modules.StripeCoupon, pageUrl: STRIPE_COUPON_DETAIL_PAGE_URL };
}

function CouponRenameEditor({
  coupon,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: CouponEditorProps & { coupon: StripeCouponInterface }) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const router = useI18nRouter();
  const { renameCoupon } = useCouponContext();

  const formSchema = useMemo(() => couponRenameSchema(t), [t]);

  const getDefaultValues = useCallback((): CouponRenameValues => ({ id: coupon.id, name: coupon.name }), [coupon]);

  const form = useForm<CouponRenameValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  return (
    <EditorSheet
      form={form}
      entityType={t("billing.admin.coupons.entity")}
      entityName={coupon.name}
      isEdit
      module={couponPageModule()}
      size="lg"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => await renameCoupon({ id: coupon.id, name: values.name })}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailField
            label={t("billing.admin.coupons.fields.discount")}
            value={<span className="tabular-nums">{formatCouponDiscount(coupon, t, fmt)}</span>}
          />
          <DetailField
            label={t("billing.admin.coupons.fields.redeemBy")}
            value={<span className="tabular-nums">{coupon.redeemBy ? formatDate(coupon.redeemBy, fmt) : "—"}</span>}
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
      </div>
    </EditorSheet>
  );
}

function CouponCreateEditor({
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: Omit<CouponEditorProps, "coupon">) {
  const t = useTranslations();
  const router = useI18nRouter();
  const { createCoupon } = useCouponContext();
  // Read once on mount: render stays pure.
  const [now] = useState(() => new Date());

  const formSchema = useMemo(() => couponCreateSchema(t), [t]);

  const getDefaultValues = useCallback(
    (): CouponCreateValues => ({
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
    }),
    [],
  );

  const form = useForm<CouponCreateValues>({
    resolver: zodResolver(formSchema),
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
      isEdit={false}
      module={couponPageModule()}
      size="lg"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => await createCoupon(toCouponInput(values))}
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
          minDate={now}
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
      </div>
    </EditorSheet>
  );
}

export default function CouponEditor(props: CouponEditorProps) {
  return props.coupon ? <CouponRenameEditor {...props} coupon={props.coupon} /> : <CouponCreateEditor {...props} />;
}
