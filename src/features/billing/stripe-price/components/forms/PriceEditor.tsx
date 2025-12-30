"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckbox, FormInput, FormSelect } from "../../../../../components";
import { CommonEditorButtons } from "../../../../../components/forms/CommonEditorButtons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Form } from "../../../../../shadcnui";
import { StripePriceInterface, StripePriceService } from "../../data";

type PriceEditorProps = {
  productId: string;
  price?: StripePriceInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export function PriceEditor({ productId, price, open, onOpenChange, onSuccess }: PriceEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const formSchema = z.object({
    unitAmount: z.number().min(0, { message: "Amount must be 0 or greater" }),
    currency: z.string().min(1, { message: "Currency is required" }),
    interval: z.enum(["one_time", "day", "week", "month", "year"]),
    intervalCount: z.number().min(1).optional(),
    usageType: z.enum(["licensed", "metered"]).optional(),
    nickname: z.string().optional(),
    active: z.boolean(),
  });

  const isEditMode = !!price;

  // Convert cents to dollars for display
  const defaultUnitAmount = price?.unitAmount ? price.unitAmount / 100 : 0;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      unitAmount: defaultUnitAmount,
      currency: price?.currency || "usd",
      interval: price?.type === "one_time" ? "one_time" : price?.recurring?.interval || "month",
      intervalCount: price?.recurring?.intervalCount || 1,
      usageType: price?.recurring?.usageType || "licensed",
      nickname: (price?.metadata?.nickname as string) || "",
      active: price?.active ?? true,
    },
  });

  const watchInterval = form.watch("interval");
  const isRecurring = watchInterval !== "one_time";

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    console.log("[PriceEditor] Submitting price:", values);
    setIsSubmitting(true);

    try {
      // Convert dollars to cents
      const unitAmountInCents = Math.round(values.unitAmount * 100);
      console.log("[PriceEditor] Converted amount:", { dollars: values.unitAmount, cents: unitAmountInCents });

      if (isEditMode) {
        // Update existing price (only nickname and active can be updated)
        await StripePriceService.updatePrice({
          priceId: price.stripePriceId,
          active: values.active,
          metadata: values.nickname ? { nickname: values.nickname } : undefined,
        });
        console.log("[PriceEditor] Price updated successfully");
      } else {
        // Create new price
        const createInput: any = {
          productId,
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
          createInput.metadata = { nickname: values.nickname };
        }

        await StripePriceService.createPrice(createInput);
        console.log("[PriceEditor] Price created successfully");
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
                type="number"
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
              <>
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
              </>
            )}

            <FormInput
              form={form}
              id="nickname"
              name="Nickname (optional)"
              placeholder="e.g., Standard Plan, Pro Tier"
            />

            <FormCheckbox form={form} id="active" name="Active" />

            <CommonEditorButtons isEdit={isEditMode} form={form} disabled={isSubmitting} setOpen={onOpenChange} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
