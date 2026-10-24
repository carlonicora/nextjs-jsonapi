"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { FormCheckbox, FormDateTime, FormInput, FormSelect, FormSwitch } from "../../../../../components";
import { FieldDescription } from "../../../../../shadcnui";
import { StripeCouponCodeInput } from "../../data/stripe-coupon-code.interface";

/**
 * What a number or decimal `<FormInput>` holds: "" until something is typed, a
 * number from `type="number"` (`+""` is 0 when cleared, NaN on garbage), a
 * string from `type="decimal"` (may use a comma as the separator).
 *
 * The schemas below validate this raw value and never transform it, so the
 * form's values have one type before and after validation. The `parse*`
 * functions turn it into the number that is sent, on submit.
 */
type RawNumber = string | number | null | undefined;

const rawNumber = () => z.union([z.string(), z.number()]).nullish();

/** The issues `schema` reports for `value`, as plain messages. */
function issueMessages(schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

/**
 * Optional whole number of at least 1. 0, "" and NaN all mean "not set": every
 * limit here has a floor of 1.
 */
export function parseOptionalPositiveInt(value: RawNumber): number | undefined {
  if (value === undefined || value === null || value === "" || value === 0) return undefined;
  if (typeof value === "number") return Number.isNaN(value) ? undefined : value;
  return parseInt(value, 10);
}

/**
 * Optional decimal in MAJOR units. Converted to minor units on submit, exactly
 * as PriceEditor does (`Math.round(value * 100)`).
 */
export function parseOptionalDecimal(value: RawNumber): number | undefined {
  if (typeof value === "string") return value.trim() === "" ? undefined : parseFloat(value.replace(",", "."));
  if (value === undefined || value === null || Number.isNaN(value)) return undefined;
  return value;
}

const positiveIntCheck = z.number().int().min(1).optional();
const decimalCheck = z.number().optional();

export const optionalPositiveInt = () =>
  rawNumber().superRefine((value, ctx) => {
    for (const message of issueMessages(positiveIntCheck, parseOptionalPositiveInt(value)))
      ctx.addIssue({ code: "custom", message });
  });

export const optionalDecimal = () =>
  rawNumber().superRefine((value, ctx) => {
    for (const message of issueMessages(decimalCheck, parseOptionalDecimal(value)))
      ctx.addIssue({ code: "custom", message });
  });

/**
 * Optional point in time from `<FormDateTime allowEmpty>`, which writes "" when
 * the value is cleared (FormDateTime.tsx:136, :241).
 */
export const optionalDate = () => z.union([z.date(), z.literal("")]).nullish();

/** Mirrors StripeCouponCodePostAttributesDTO. */
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
      const minimumAmount = parseOptionalDecimal(values.minimumAmount);
      if (minimumAmount !== undefined && minimumAmount <= 0)
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
 * uncontrolled to controlled (console warning). The parse functions map ""
 * to undefined, so empty fields are still sent as absent.
 */
export const couponCodeDefaults = (): CouponCodeFormValues => ({
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
  const minimumAmount = parseOptionalDecimal(values.minimumAmount);
  if (minimumAmount !== undefined) {
    input.minimumAmount = Math.round(minimumAmount * 100);
    input.minimumAmountCurrency = values.minimumAmountCurrency;
  }
  if (values.stripeCustomerId?.trim()) input.stripeCustomerId = values.stripeCustomerId.trim();
  if (values.expiresAt) input.expiresAt = values.expiresAt;
  const maxRedemptions = parseOptionalPositiveInt(values.maxRedemptions);
  if (maxRedemptions !== undefined) input.maxRedemptions = maxRedemptions;
  return input;
};

export const couponCurrencyOptions = [
  { id: "usd", text: "USD ($)" },
  { id: "eur", text: "EUR (€)" },
  { id: "gbp", text: "GBP (£)" },
];

type CouponCodeFieldsProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  /** "" for CouponCodeEditor, "firstCode." when nested inside CouponEditor. */
  prefix?: string;
};

/** The fields of a customer-facing code, shared by CouponEditor (first code) and CouponCodeEditor. */
export function CouponCodeFields<T extends FieldValues>({ form, prefix = "" }: CouponCodeFieldsProps<T>) {
  const t = useTranslations();
  // Read once on mount: render stays pure.
  const [now] = useState(() => new Date());

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
        minDate={now}
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
