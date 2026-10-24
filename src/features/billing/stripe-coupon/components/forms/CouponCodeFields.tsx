"use client";

import { useTranslations } from "next-intl";
import { z } from "zod";
import { FormCheckbox, FormDateTime, FormInput, FormSelect, FormSwitch } from "../../../../../components";
import { FieldDescription } from "../../../../../shadcnui";
import { StripeCouponCodeInput } from "../../data/stripe-coupon-code.interface";

/**
 * Optional whole number of at least 1. The fields render as
 * `<FormInput type="number">`, which hands back `+""` (0) for a cleared input,
 * so 0, "" and NaN all mean "not set" — every limit here has a floor of 1.
 */
export const optionalPositiveInt = () =>
  z.preprocess(
    (value) =>
      value === undefined ||
      value === null ||
      value === "" ||
      value === 0 ||
      (typeof value === "number" && Number.isNaN(value))
        ? undefined
        : typeof value === "string"
          ? parseInt(value, 10)
          : value,
    z.number().int().min(1).optional(),
  );

/**
 * Optional decimal in MAJOR units, from `<FormInput type="decimal">` (a string
 * that may use a comma as the separator). Converted to minor units on submit,
 * exactly as PriceEditor does (`Math.round(value * 100)`).
 */
export const optionalDecimal = () =>
  z.preprocess(
    (value) =>
      typeof value === "string"
        ? value.trim() === ""
          ? undefined
          : parseFloat(value.replace(",", "."))
        : value === null || (typeof value === "number" && Number.isNaN(value))
          ? undefined
          : value,
    z.number().optional(),
  );

/** Mirrors StripeCouponCodePostAttributesDTO. */
/**
 * Optional point in time from `<FormDateTime allowEmpty>`, which writes "" when
 * the value is cleared (FormDateTime.tsx:136, :241).
 */
export const optionalDate = () =>
  z.preprocess((value) => (value === "" || value === null ? undefined : value), z.date().optional());

export const couponCodeSchema = (t: (key: string) => string) =>
  z
    .object({
      code: z.string().optional(),
      firstTimeTransaction: z.boolean(),
      minimumAmount: optionalDecimal(),
      minimumAmountCurrency: z.string().min(1),
      stripeCustomerId: z.string().optional(),
      expiresAt: optionalDate(),
      maxRedemptions: optionalPositiveInt(),
      automatic: z.boolean(),
    })
    .superRefine((values, ctx) => {
      if (values.minimumAmount !== undefined && values.minimumAmount <= 0)
        ctx.addIssue({
          code: "custom",
          path: ["minimumAmount"],
          message: t("billing.admin.coupons.errors.minimumAmount"),
        });
    });

export type CouponCodeFormValues = z.infer<ReturnType<typeof couponCodeSchema>>;

/**
 * Every text/number input starts as "" (never undefined): FormInput spreads
 * `field.value` onto a Base UI input, and undefined → value flips it from
 * uncontrolled to controlled (console warning). The schema preprocessors map
 * "" back to undefined, so empty fields are still sent as absent.
 */
export const couponCodeDefaults = (): z.input<ReturnType<typeof couponCodeSchema>> => ({
  code: "",
  firstTimeTransaction: false,
  minimumAmount: "",
  minimumAmountCurrency: "eur",
  stripeCustomerId: "",
  expiresAt: undefined,
  maxRedemptions: "",
  automatic: false,
});

/** Form values → the code attributes the models serialise. Unset fields are left out. */
export const toCouponCodeInput = (values: CouponCodeFormValues): Omit<StripeCouponCodeInput, "id" | "couponId"> => {
  const input: Omit<StripeCouponCodeInput, "id" | "couponId"> = {
    firstTimeTransaction: values.firstTimeTransaction,
    automatic: values.automatic,
  };
  if (values.code?.trim()) input.code = values.code.trim();
  if (values.minimumAmount !== undefined) {
    input.minimumAmount = Math.round(values.minimumAmount * 100);
    input.minimumAmountCurrency = values.minimumAmountCurrency;
  }
  if (values.stripeCustomerId?.trim()) input.stripeCustomerId = values.stripeCustomerId.trim();
  if (values.expiresAt) input.expiresAt = values.expiresAt;
  if (values.maxRedemptions !== undefined) input.maxRedemptions = values.maxRedemptions;
  return input;
};

export const couponCurrencyOptions = [
  { id: "usd", text: "USD ($)" },
  { id: "eur", text: "EUR (€)" },
  { id: "gbp", text: "GBP (£)" },
];

type CouponCodeFieldsProps = {
  form: any;
  /** "" for CouponCodeEditor, "firstCode." when nested inside CouponEditor. */
  prefix?: string;
};

/** The fields of a customer-facing code, shared by CouponEditor (first code) and CouponCodeEditor. */
export function CouponCodeFields({ form, prefix = "" }: CouponCodeFieldsProps) {
  const t = useTranslations();

  return (
    <div className="flex w-full flex-col gap-y-4">
      <FormInput
        form={form}
        id={`${prefix}code`}
        name={t("billing.admin.coupons.fields.code")}
        placeholder={t("billing.admin.coupons.placeholders.code")}
      />
      {/* The warning sits visibly under the option (spec), not in FormCheckbox's
          hover tooltip — same layout as FormSwitch's description. */}
      <div className="flex w-full flex-col">
        <FormCheckbox
          form={form}
          id={`${prefix}firstTimeTransaction`}
          name={t("billing.admin.coupons.fields.firstTimeTransaction")}
        />
        <FieldDescription>{t("billing.admin.coupons.fields.first_time_warning")}</FieldDescription>
      </div>
      <div className="grid grid-cols-2 gap-x-4">
        {/* type="decimal", NOT type="currency": the currency variant hardcodes
            a Euro symbol (FormInput.tsx:105-106), which contradicts the
            currency selector sitting next to it. */}
        <FormInput
          form={form}
          id={`${prefix}minimumAmount`}
          type="decimal"
          name={t("billing.admin.coupons.fields.minimumAmount")}
          placeholder={t("billing.admin.coupons.placeholders.minimumAmount")}
        />
        <FormSelect
          form={form}
          id={`${prefix}minimumAmountCurrency`}
          name={t("billing.admin.coupons.fields.currency")}
          values={couponCurrencyOptions}
        />
      </div>
      <FormInput
        form={form}
        id={`${prefix}stripeCustomerId`}
        name={t("billing.admin.coupons.fields.stripeCustomerId")}
        placeholder="cus_…"
      />
      <FormDateTime
        form={form}
        id={`${prefix}expiresAt`}
        name={t("billing.admin.coupons.fields.expiresAt")}
        minDate={new Date()}
        allowEmpty
      />
      <FormInput
        form={form}
        id={`${prefix}maxRedemptions`}
        type="number"
        name={t("billing.admin.coupons.fields.codeMaxRedemptions")}
        placeholder={t("billing.admin.coupons.placeholders.maxRedemptions")}
      />
      <FormSwitch
        form={form}
        id={`${prefix}automatic`}
        name={t("billing.admin.coupons.fields.automatic")}
        description={t("billing.admin.coupons.help.automatic")}
      />
    </div>
  );
}
