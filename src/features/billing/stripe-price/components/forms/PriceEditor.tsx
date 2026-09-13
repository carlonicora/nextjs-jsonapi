"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { EditorSheet, FieldLabel, FormCheckbox, FormInput, FormSelect, FormTextarea } from "../../../../../components";
import { Modules } from "../../../../../core";
import { useI18nRouter } from "../../../../../i18n";
import { Alert, AlertDescription, AlertTitle, Button, Checkbox, Input } from "../../../../../shadcnui";
import { showToast } from "../../../../../utils/toast";
import { FeatureInterface, FeatureService } from "../../../../feature";
import { priceLabel, usePriceContext } from "../../../contexts/PriceContext";
import { StripePriceInput, StripePriceInterface } from "../../data/stripe-price.interface";
import { StripePriceSeed } from "../../data/stripe-price.transfer";

export type PriceEditorProps = {
  productId?: string;
  price?: StripePriceInterface;
  /**
   * Pre-fills a NEW price — the Clone (a row in the prices list) and Import (a
   * JSON document) paths both hand over the same seed.
   *
   * The seed deliberately carries NO identity: no Stripe price id, no internal
   * id and no product id. A clone/import is a brand-new price, minted fresh by
   * Stripe and attached to whatever product this editor is mounted for
   * (`productId` / the context), so copying any identity across would either
   * collide or silently re-point the new price at the source environment's
   * objects. Seeding therefore never makes this an edit — see `isEdit` below.
   */
  seed?: StripePriceSeed;
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
  seed,
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
  // Stays `!!price`, never `!!price || !!seed`: a seeded editor is a CREATE, so
  // the create branch of onSubmit (fresh v4(), targetProductId, no id reuse)
  // must run for it exactly as it does for an empty form.
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

  // Seeds carry platform features as NAMES, never ids: Feature ids differ per
  // environment, names are the stable handle. A name this environment does not
  // know is DROPPED rather than failing the whole seed — the effect below
  // reports the dropped ones once.
  const resolvePlatformFeatures = useCallback(
    (names: string[] | undefined): { ids: string[]; unknown: string[] } => {
      const ids: string[] = [];
      const unknown: string[] = [];
      for (const name of names ?? []) {
        const match = allFeatures.find((feature) => feature.name === name);
        if (match) ids.push(match.id);
        else unknown.push(name);
      }
      return { ids, unknown };
    },
    [allFeatures],
  );

  // Fed to BOTH useForm and EditorSheet.onReset. The previous implementation
  // reseeded with its own `useEffect(… form.reset)` on open; EditorSheet already
  // owns that (EditorSheet.tsx:163-190) and running both fights over the form.
  //
  // `active` is absent on purpose: archiving is the single deactivation path
  // (PriceArchiver), and a second toggle here would let the two disagree.
  const getDefaultValues = useCallback((): PriceFormValues => {
    const coreFeatureIds = allFeatures.filter((feature) => feature.isCore).map((feature) => feature.id);

    // Seed branch: create mode only (`price` always wins — an edit form must
    // show the price it edits, never a seed). Mirrors the `price` branch below
    // field for field, including the /100: the seed keeps Stripe's MINOR units
    // while the form field is in MAJOR units.
    if (!price && seed) {
      return {
        unitAmount: seed.unitAmount / 100,
        currency: seed.currency,
        interval: seed.interval,
        intervalCount: seed.intervalCount ?? 1,
        usageType: seed.usageType ?? "licensed",
        nickname: seed.nickname ?? "",
        isTrial: seed.isTrial ?? false,
        description: seed.description ?? "",
        features: seed.features ?? [],
        // `.toString()`, for the same reason the schema keeps the token
        // pipeline string-based: a seeded `0` must survive as "0" and not be
        // dropped as falsy.
        token: seed.token?.toString() ?? "",
        featureIds: [...new Set([...resolvePlatformFeatures(seed.platformFeatures).ids, ...coreFeatureIds])],
      };
    }

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
  }, [price, seed, allFeatures, resolvePlatformFeatures]);

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: getDefaultValues(),
  });

  // ── The seeding race ──────────────────────────────────────────────────────
  // `getDefaultValues` reads `allFeatures`, which the fetch effect above
  // resolves asynchronously — so `useForm` has ALREADY seeded from an empty
  // list by the time the features land, and every id-bearing default
  // (`featureIds`: the core features, plus whatever the seed named) is missing.
  //
  // Nothing else fixes it: EditorSheet re-seeds on open only when `isEdit`
  // (EditorSheet.tsx:209 — create defaults usually contain a fresh uuid, so an
  // unconditional reset there would fire on every open and clobber parents that
  // pre-fill via form.setValue). That is exactly why the core-feature
  // checkboxes come up empty on a first create today.
  //
  // So catch up here, once, and only when it is safe:
  //  - `!isEdit`      — the edit path is EditorSheet's, do not fight it.
  //  - `length > 0`   — this is the empty → loaded transition, not the initial
  //                     render (and not a genuinely empty feature list).
  //  - the ref        — one shot per mount, so a later `allFeatures` identity
  //                     change cannot re-reset a form the user is using.
  //  - `!isDirty`     — never clobber anything already typed; a user who edited
  //                     before the fetch returned keeps their input, and the
  //                     one-shot ref is burned either way.
  const hasCaughtUpWithFeatures = useRef(false);
  useEffect(() => {
    if (isEdit || hasCaughtUpWithFeatures.current || allFeatures.length === 0) return;
    hasCaughtUpWithFeatures.current = true;
    if (form.formState.isDirty) return;
    form.reset(getDefaultValues());
  }, [allFeatures, isEdit, form, getDefaultValues]);

  // Unknown platform feature names are reported ONCE per seed, not per render:
  // `seed` typically arrives as an object literal from the list row or the
  // import dialog, so its identity changes on every parent render — the guard
  // keys on the names themselves instead. Waits for `allFeatures`, since before
  // the fetch resolves every name looks unknown.
  const warnedUnknownFor = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (isEdit || !seed || allFeatures.length === 0) return;
    const fingerprint = JSON.stringify(seed.platformFeatures ?? []);
    if (warnedUnknownFor.current === fingerprint) return;
    warnedUnknownFor.current = fingerprint;

    const { unknown } = resolvePlatformFeatures(seed.platformFeatures);
    if (unknown.length > 0)
      showToast(t("billing.admin.prices.import.warnings.unknownFeatures", { features: unknown.join(", ") }));
  }, [seed, isEdit, allFeatures, resolvePlatformFeatures, t]);

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
