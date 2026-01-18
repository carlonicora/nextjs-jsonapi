"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { v4 } from "uuid";
import { z } from "zod";
import { FormCheckbox, FormInput, FormSelect, FormTextarea } from "../../../../../components";
import { CommonEditorButtons } from "../../../../../components/forms/CommonEditorButtons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  Input,
  Label,
} from "../../../../../shadcnui";
import { FeatureInterface, FeatureService } from "../../../../feature";
import { StripePriceInterface, StripePriceService } from "../../data";

type PriceEditorProps = {
  productId: string;
  price?: StripePriceInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type PriceFormValues = {
  unitAmount: number;
  currency: string;
  interval: "one_time" | "day" | "week" | "month" | "year";
  intervalCount?: number;
  usageType?: "licensed" | "metered";
  nickname?: string;
  active: boolean;
  isTrial: boolean;
  description?: string;
  features: string[];
  token: string;
  featureIds: string[]; // Platform Feature entity IDs
};

export function PriceEditor({ productId, price, open, onOpenChange, onSuccess }: PriceEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [allFeatures, setAllFeatures] = useState<FeatureInterface[]>([]);

  // Fetch all platform features on mount
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const features = await FeatureService.findMany({});
        setAllFeatures(features);
      } catch (error) {
        console.error("[PriceEditor] Failed to fetch features:", error);
      }
    };
    fetchFeatures();
  }, []);

  const formSchema = z.object({
    unitAmount: z.preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z.number().min(0, { message: "Amount must be 0 or greater" }),
    ),
    currency: z.string().min(1, { message: "Currency is required" }),
    interval: z.enum(["one_time", "day", "week", "month", "year"]),
    intervalCount: z.preprocess(
      (val) => (val === "" || val === undefined ? undefined : typeof val === "string" ? parseInt(val, 10) : val),
      z.number().min(1).optional(),
    ),
    usageType: z.enum(["licensed", "metered"]).optional(),
    nickname: z.string().optional(),
    active: z.boolean(),
    isTrial: z.boolean(),
    description: z.string().optional(),
    features: z.array(z.string()),
    token: z.string(),
    featureIds: z.array(z.string()),
  });

  const isEditMode = !!price;

  // Convert cents to dollars for display
  const defaultUnitAmount = price?.unitAmount ? price.unitAmount / 100 : 0;

  // Get core feature IDs that should always be selected
  const coreFeatureIds = allFeatures.filter((f) => f.isCore).map((f) => f.id);

  // Combine existing price features with core features (ensure no duplicates)
  const defaultFeatureIds = [...new Set([...(price?.priceFeatures?.map((f) => f.id) ?? []), ...coreFeatureIds])];

  const form = useForm<PriceFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      unitAmount: defaultUnitAmount,
      currency: price?.currency || "usd",
      interval: price?.priceType === "one_time" ? "one_time" : price?.recurring?.interval || "month",
      intervalCount: price?.recurring?.intervalCount || 1,
      usageType: price?.recurring?.usageType || "licensed",
      nickname: price?.nickname || "",
      active: price?.active ?? true,
      isTrial: price?.isTrial ?? false,
      description: price?.description || "",
      features: price?.features || [],
      token: price?.token?.toString() ?? "",
      featureIds: defaultFeatureIds,
    },
  });

  // Reset form when dialog opens to ensure fresh state
  useEffect(() => {
    if (open) {
      // Recalculate core feature IDs with current allFeatures
      const currentCoreFeatureIds = allFeatures.filter((f) => f.isCore).map((f) => f.id);
      const resetFeatureIds = [
        ...new Set([...(price?.priceFeatures?.map((f) => f.id) ?? []), ...currentCoreFeatureIds]),
      ];

      form.reset({
        unitAmount: price?.unitAmount ? price.unitAmount / 100 : 0,
        currency: price?.currency || "usd",
        interval: price?.priceType === "one_time" ? "one_time" : price?.recurring?.interval || "month",
        intervalCount: price?.recurring?.intervalCount || 1,
        usageType: price?.recurring?.usageType || "licensed",
        nickname: price?.nickname || "",
        active: price?.active ?? true,
        isTrial: price?.isTrial ?? false,
        description: price?.description || "",
        features: price?.features || [],
        token: price?.token?.toString() ?? "",
        featureIds: resetFeatureIds,
      });
    }
  }, [open, price?.id, allFeatures]);

  const watchInterval = form.watch("interval");
  const isRecurring = watchInterval !== "one_time";

  const onSubmit: SubmitHandler<PriceFormValues> = async (values) => {
    setIsSubmitting(true);

    try {
      // Convert dollars to cents
      const unitAmountInCents = Math.round(values.unitAmount * 100);

      if (isEditMode) {
        // Update existing price (nickname, description, features, token, isTrial can be updated - Stripe fields are limited)
        await StripePriceService.updatePrice({
          id: price.id,
          nickname: values.nickname || undefined,
          description: values.description || undefined,
          features: values.features.filter((f) => f.trim()) || undefined,
          token: values.token ? parseInt(values.token, 10) : undefined,
          // Only include isTrial and featureIds for recurring prices
          ...(price?.priceType === "recurring" ? { isTrial: values.isTrial, featureIds: values.featureIds } : {}),
        });
      } else {
        // Create new price
        const createInput: any = {
          id: v4(),
          productId: productId,
          currency: values.currency,
          unitAmount: unitAmountInCents,
        };

        // Add recurring details if interval is not one_time
        if (isRecurring) {
          createInput.recurring = {
            interval: values.interval as "day" | "week" | "month" | "year",
            intervalCount: values.intervalCount || 1,
            usageType: values.usageType || "licensed",
          };
        }

        if (values.nickname) {
          createInput.nickname = values.nickname;
        }

        if (values.description) {
          createInput.description = values.description;
        }

        const filteredFeatures = values.features.filter((f) => f.trim());
        if (filteredFeatures.length > 0) {
          createInput.features = filteredFeatures;
        }

        if (values.token) {
          createInput.token = parseInt(values.token, 10);
        }

        // Add isTrial and platform feature IDs only for recurring prices (Neo4j only, not sent to Stripe)
        if (isRecurring) {
          createInput.isTrial = values.isTrial;
          if (values.featureIds.length > 0) {
            createInput.featureIds = values.featureIds;
          }
        }

        await StripePriceService.createPrice(createInput);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[PriceEditor] Failed to save price:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencyOptions = [
    { id: "usd", text: "USD ($)" },
    { id: "eur", text: "EUR (€)" },
    { id: "gbp", text: "GBP (£)" },
  ];

  const intervalOptions = [
    { id: "one_time", text: "One-time" },
    { id: "day", text: "Daily" },
    { id: "week", text: "Weekly" },
    { id: "month", text: "Monthly" },
    { id: "year", text: "Yearly" },
  ];

  const usageTypeOptions = [
    { id: "licensed", text: "Licensed (per unit)" },
    { id: "metered", text: "Metered (usage-based)" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Price" : "Create Price"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the price details. Note: Only nickname and active status can be changed."
              : "Create a new price for this product"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Stripe Price Immutability</p>
              <p>
                Due to Stripe's architecture, only the nickname and active status can be modified after creation. To
                change amount, currency, or billing interval, create a new price.
              </p>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <div className="grid grid-cols-2 gap-x-4">
              <FormInput
                form={form}
                id="unitAmount"
                name="Amount (in dollars)"
                placeholder="9.99"
                disabled={isEditMode}
                isRequired
              />

              <FormSelect form={form} id="currency" name="Currency" values={currencyOptions} disabled={isEditMode} />
            </div>

            <FormSelect
              form={form}
              id="interval"
              name="Billing Interval"
              values={intervalOptions}
              disabled={isEditMode}
            />

            {isRecurring && (
              <div className="grid grid-cols-2 gap-x-4">
                <FormInput
                  form={form}
                  id="intervalCount"
                  name="Interval Count"
                  placeholder="1"
                  type="number"
                  disabled={isEditMode}
                />

                <FormSelect
                  form={form}
                  id="usageType"
                  name="Usage Type"
                  values={usageTypeOptions}
                  disabled={isEditMode}
                />
              </div>
            )}

            <FormInput
              form={form}
              id="nickname"
              name="Nickname (optional)"
              placeholder="e.g., Standard Plan, Pro Tier"
            />

            <FormTextarea
              form={form}
              id="description"
              name="Description (optional)"
              placeholder="Describe what this price tier includes..."
              className="min-h-24"
            />

            <FormInput form={form} id="token" name="Token (optional)" placeholder="Enter token value" />

            {/* Features List */}
            <div className="space-y-2">
              <Label>Features (optional)</Label>
              <div className="space-y-2">
                {form.watch("features").map((_, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      {...form.register(`features.${index}`)}
                      placeholder={`Feature ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const currentFeatures = form.getValues("features");
                        form.setValue(
                          "features",
                          currentFeatures.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const currentFeatures = form.getValues("features");
                    form.setValue("features", [...currentFeatures, ""]);
                  }}
                  className="mt-2"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Feature
                </Button>
              </div>
            </div>

            {/* Platform Features Checkbox List - Only show for recurring prices */}
            {isRecurring && allFeatures.length > 0 && (
              <div className="space-y-2">
                <Label>Platform Features</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {allFeatures.map((feature) => {
                    const isCore = feature.isCore;
                    const isChecked = form.watch("featureIds").includes(feature.id);

                    return (
                      <div key={feature.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`feature-${feature.id}`}
                          checked={isChecked}
                          disabled={isCore}
                          onChange={(e) => {
                            const currentIds = form.getValues("featureIds");
                            if (e.target.checked) {
                              form.setValue("featureIds", [...currentIds, feature.id]);
                            } else {
                              // Don't allow unchecking core features
                              if (!isCore) {
                                form.setValue(
                                  "featureIds",
                                  currentIds.filter((id) => id !== feature.id),
                                );
                              }
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                        />
                        <label
                          htmlFor={`feature-${feature.id}`}
                          className={`text-sm ${isCore ? "text-muted-foreground" : ""}`}
                        >
                          {feature.name}
                          {isCore && <span className="ml-2 text-xs text-muted-foreground">(Core - Required)</span>}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <FormCheckbox form={form} id="active" name="Active" />

            {isRecurring && (
              <FormCheckbox
                form={form}
                id="isTrial"
                name="Trial Price"
                description="Mark this as the trial subscription plan (only one price should be marked as trial)"
              />
            )}

            <CommonEditorButtons isEdit={isEditMode} form={form} disabled={isSubmitting} setOpen={onOpenChange} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
