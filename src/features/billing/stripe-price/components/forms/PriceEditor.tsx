"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FieldLabel, FormCheckbox, FormInput, FormSelect, FormTextarea } from "../../../../../components";
import { Modules } from "../../../../../core";
import { useI18nRouter } from "../../../../../i18n";
import { Alert, AlertDescription, AlertTitle, Button, Checkbox, Input } from "../../../../../shadcnui";
import { FeatureInterface, FeatureService } from "../../../../feature";
import { priceLabel, usePriceContext } from "../../../contexts/PriceContext";
import { StripePriceInput, StripePriceInterface } from "../../data/stripe-price.interface";

export type PriceEditorProps = {
  productId?: string;
  price?: StripePriceInterface;
  propagateChanges?: (price: StripePriceInterface) => void;
  onSuccess?: () => void | Promise<void>;
  trigger?: ReactNode;
  forceShow?: boolean;
  onClose?: () => void;
  dialogOpen?: boolean;
  onDialogOpenChange?: (open: boolean) => void;
};

function PriceEditorInternal({
  productId,
  price,
  propagateChanges,
  onSuccess,
  trigger,
  forceShow,
  onClose,
  dialogOpen,
  onDialogOpenChange,
}: PriceEditorProps) {
  const t = useTranslations();
  const router = useI18nRouter();
  const { createPrice, updatePrice, productId: contextProductId } = usePriceContext();
  const [allFeatures, setAllFeatures] = useState<FeatureInterface[]>([]);
  const isEdit = !!price;
  // NOT `price.productId` — that getter throws when the attribute is absent, and
  // it always is (see the note in PriceContext). Only create mode needs this,
  // and there it arrives as a prop or from the context.
  const targetProductId = productId ?? price?.product?.id ?? contextProductId;

  useEffect(() => {
    const fetchFeatures = async () => {
      setAllFeatures(await FeatureService.findMany({}));
    };
    void fetchFeatures();
  }, []);

  const formSchema = useMemo(
    () =>
      z.object({
        unitAmount: z.preprocess(
          (value) => (typeof value === "string" ? parseFloat(value) : value),
          z.number().min(0, { message: t("billing.admin.prices.errors.amount") }),
        ),
        currency: z.string().min(1, { message: t("billing.admin.prices.errors.currency") }),
        interval: z.enum(["one_time", "day", "week", "month", "year"]),
        intervalCount: z.preprocess(
          (value) =>
            value === "" || value === undefined ? undefined : typeof value === "string" ? parseInt(value, 10) : value,
          z.number().min(1).optional(),
        ),
        usageType: z.enum(["licensed", "metered"]).optional(),
        nickname: z.string().optional(),
        isTrial: z.boolean(),
        description: z.string().optional(),
        features: z.array(z.string()),
        // Normalised, not a bare `z.string()`: the field renders as
        // `<FormInput type="number">`, which hands back a number, so a plain
        // string schema rejects every value with "expected string, received
        // number".
        //
        // Normalised by hand rather than with `z.coerce.string()`, because
        // zod 4's coercion is `String(input)` — a cleared number input yields
        // NaN, which would become the TRUTHY string "NaN" and reach
        // `parseInt` as a NaN token.
        //
        // Deliberately NOT converted to the `z.preprocess(... z.number())`
        // idiom used by unitAmount/intervalCount above. The whole token
        // pipeline is string-based — seeded with `.toString()` and read back
        // with `values.token ? parseInt(...)` on both submit branches — and a
        // number pipeline would make `0` FALSY, silently dropping the token
        // from the payload. A price with no token is "tokens not configured"
        // (AI stays enabled), so that would make a zero-token / no-AI plan
        // impossible to create from this form.
        token: z.preprocess(
          (value) =>
            value === undefined || value === null || value === "" || (typeof value === "number" && Number.isNaN(value))
              ? ""
              : String(value),
          z.string(),
        ),
        featureIds: z.array(z.string()),
      }),
    [t],
  );

  type PriceFormValues = z.infer<typeof formSchema>;

  // Fed to BOTH useForm and EditorSheet.onReset. The previous implementation
  // reseeded with its own `useEffect(… form.reset)` on open; EditorSheet already
  // owns that (EditorSheet.tsx:163-190) and running both fights over the form.
  //
  // `active` is absent on purpose: archiving is the single deactivation path
  // (PriceArchiver), and a second toggle here would let the two disagree.
  const getDefaultValues = useCallback((): PriceFormValues => {
    const coreFeatureIds = allFeatures.filter((feature) => feature.isCore).map((feature) => feature.id);
    return {
      unitAmount: price?.unitAmount ? price.unitAmount / 100 : 0,
      currency: price?.currency ?? "usd",
      interval: price?.priceType === "one_time" ? "one_time" : (price?.recurring?.interval ?? "month"),
      intervalCount: price?.recurring?.intervalCount ?? 1,
      usageType: price?.recurring?.usageType ?? "licensed",
      nickname: price?.nickname ?? "",
      isTrial: price?.isTrial ?? false,
      description: price?.description ?? "",
      features: price?.features ?? [],
      token: price?.token?.toString() ?? "",
      featureIds: [...new Set([...(price?.priceFeatures?.map((f) => f.id) ?? []), ...coreFeatureIds])],
    };
  }, [price, allFeatures]);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: getDefaultValues(),
  });

  const watchInterval = form.watch("interval");
  const isRecurring = watchInterval !== "one_time";

  const currencyOptions = [
    { id: "usd", text: "USD ($)" },
    { id: "eur", text: "EUR (€)" },
    { id: "gbp", text: "GBP (£)" },
  ];

  const intervalOptions = [
    { id: "one_time", text: t("billing.admin.prices.interval.one_time") },
    { id: "day", text: t("billing.admin.prices.interval.day") },
    { id: "week", text: t("billing.admin.prices.interval.week") },
    { id: "month", text: t("billing.admin.prices.interval.month") },
    { id: "year", text: t("billing.admin.prices.interval.year") },
  ];

  const usageTypeOptions = [
    { id: "licensed", text: t("billing.admin.prices.usage.licensed") },
    { id: "metered", text: t("billing.admin.prices.usage.metered") },
  ];

  return (
    <EditorSheet
      form={form}
      entityType={t("billing.admin.prices.entity")}
      entityName={price ? priceLabel(price) : undefined}
      isEdit={isEdit}
      module={Modules.StripePrice}
      size="lg"
      propagateChanges={propagateChanges}
      onSuccess={onSuccess}
      onNavigate={(url) => router.push(url)}
      onSubmit={async (values) => {
        const trimmedFeatures = values.features.filter((feature) => feature.trim());

        if (isEdit) {
          const patch: StripePriceInput = {
            id: price.id,
            nickname: values.nickname || undefined,
            description: values.description || undefined,
            features: trimmedFeatures.length > 0 ? trimmedFeatures : undefined,
            token: values.token ? parseInt(values.token, 10) : undefined,
            // Stripe one-time prices carry neither a trial flag nor platform
            // features, so those two only travel for recurring prices.
            ...(price.priceType === "recurring" ? { isTrial: values.isTrial, featureIds: values.featureIds } : {}),
          };
          return await updatePrice(patch);
        }

        if (!targetProductId) throw new Error("PriceEditor requires a productId to create a price");

        const payload: StripePriceInput = {
          id: v4(),
          productId: targetProductId,
          currency: values.currency,
          unitAmount: Math.round(values.unitAmount * 100),
        };
        if (isRecurring) {
          payload.recurring = {
            interval: values.interval as "day" | "week" | "month" | "year",
            intervalCount: values.intervalCount ?? 1,
            usageType: values.usageType ?? "licensed",
          };
          payload.isTrial = values.isTrial;
          if (values.featureIds.length > 0) payload.featureIds = values.featureIds;
        }
        if (values.nickname) payload.nickname = values.nickname;
        if (values.description) payload.description = values.description;
        if (trimmedFeatures.length > 0) payload.features = trimmedFeatures;
        if (values.token) payload.token = parseInt(values.token, 10);

        return await createPrice(payload);
      }}
      onReset={getDefaultValues}
      trigger={trigger}
      forceShow={forceShow}
      onClose={onClose}
      dialogOpen={dialogOpen}
      onDialogOpenChange={onDialogOpenChange}
    >
      <div className="flex w-full flex-col gap-y-4">
        {isEdit && (
          <Alert>
            <AlertTitle>{t("billing.admin.prices.immutability.title")}</AlertTitle>
            <AlertDescription>{t("billing.admin.prices.immutability.description")}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-x-4">
          {/* type="decimal", NOT type="currency": the currency variant hardcodes
              a Euro symbol (FormInput.tsx:105-106), which contradicts the
              currency selector sitting next to it. */}
          <FormInput
            form={form}
            id="unitAmount"
            type="decimal"
            name={t("billing.admin.prices.fields.amount")}
            placeholder={t("billing.admin.prices.placeholders.amount")}
            disabled={isEdit}
            isRequired
          />
          <FormSelect
            form={form}
            id="currency"
            name={t("billing.admin.prices.fields.currency")}
            values={currencyOptions}
            disabled={isEdit}
          />
        </div>

        <FormSelect
          form={form}
          id="interval"
          name={t("billing.admin.prices.fields.interval")}
          values={intervalOptions}
          disabled={isEdit}
        />

        {isRecurring && (
          <div className="grid grid-cols-2 gap-x-4">
            <FormInput
              form={form}
              id="intervalCount"
              type="number"
              name={t("billing.admin.prices.fields.intervalCount")}
              placeholder={t("billing.admin.prices.placeholders.intervalCount")}
              disabled={isEdit}
            />
            <FormSelect
              form={form}
              id="usageType"
              name={t("billing.admin.prices.fields.usageType")}
              values={usageTypeOptions}
              disabled={isEdit}
            />
          </div>
        )}

        <FormInput
          form={form}
          id="nickname"
          name={t("billing.admin.prices.fields.nickname")}
          placeholder={t("billing.admin.prices.placeholders.nickname")}
        />

        <FormTextarea
          form={form}
          id="description"
          name={t("billing.admin.prices.fields.description")}
          placeholder={t("billing.admin.prices.placeholders.description")}
          className="min-h-24"
        />

        <FormInput
          form={form}
          id="token"
          type="number"
          name={t("billing.admin.prices.fields.token")}
          placeholder={t("billing.admin.prices.placeholders.token")}
        />

        <div className="flex flex-col gap-y-2">
          <FieldLabel>{t("billing.admin.prices.fields.features")}</FieldLabel>
          {form.watch("features").map((_, index) => (
            <div key={index} className="flex gap-2">
              <Input
                {...form.register(`features.${index}`)}
                placeholder={t("billing.admin.prices.placeholders.feature", { index: index + 1 })}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("billing.admin.prices.actions.removeFeature")}
                onClick={() =>
                  form.setValue(
                    "features",
                    form.getValues("features").filter((_, i) => i !== index),
                  )
                }
              >
                <XIcon />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => form.setValue("features", [...form.getValues("features"), ""])}
          >
            <PlusIcon />
            {t("billing.admin.prices.actions.addFeature")}
          </Button>
        </div>

        {isRecurring && allFeatures.length > 0 && (
          <div className="flex flex-col gap-y-2">
            <FieldLabel>{t("billing.admin.prices.fields.platformFeatures")}</FieldLabel>
            <div className="flex max-h-48 flex-col gap-y-2 overflow-y-auto rounded-md border p-4">
              {allFeatures.map((feature) => {
                const isChecked = form.watch("featureIds").includes(feature.id);
                return (
                  <div key={feature.id} className="flex items-center gap-x-2">
                    <Checkbox
                      id={`feature-${feature.id}`}
                      checked={isChecked}
                      disabled={feature.isCore}
                      onCheckedChange={(checked) => {
                        const current = form.getValues("featureIds");
                        if (checked) form.setValue("featureIds", [...new Set([...current, feature.id])]);
                        else if (!feature.isCore)
                          form.setValue(
                            "featureIds",
                            current.filter((id) => id !== feature.id),
                          );
                      }}
                    />
                    <FieldLabel htmlFor={`feature-${feature.id}`}>{feature.name}</FieldLabel>
                    {/* Typography role 12 (caption) — token colour, never text-gray-*. */}
                    {feature.isCore && (
                      <span className="text-muted-foreground text-xs">{t("billing.admin.prices.help.core")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isRecurring && (
          <FormCheckbox
            form={form}
            id="isTrial"
            name={t("billing.admin.prices.fields.trial")}
            description={t("billing.admin.prices.help.trial")}
          />
        )}
      </div>
    </EditorSheet>
  );
}

export default function PriceEditor(props: PriceEditorProps) {
  return <PriceEditorInternal {...props} />;
}
