"use client";

import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { FormTextarea } from "../../../../../components";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
} from "../../../../../shadcnui";
import { formatDate, useBillingFormatOptions } from "../../../components/utils";
import { StripeSubscriptionInterface, StripeSubscriptionService } from "../../data";

type CancelSubscriptionDialogProps = {
  subscription: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const formSchema = z.object({
  reason: z.string().optional(),
});

export function CancelSubscriptionDialog({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: CancelSubscriptionDialogProps) {
  const t = useTranslations();
  const fmt = useBillingFormatOptions();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
    },
  });

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (_values) => {
    setIsSubmitting(true);

    try {
      await StripeSubscriptionService.cancelSubscription({
        id: subscription.id,
        cancelImmediately: false,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[CancelSubscriptionDialog] Failed to cancel subscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const periodEndDate = formatDate(subscription.currentPeriodEnd, fmt);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("billing.ui.subscription.cancel.title")}</DialogTitle>
          <DialogDescription>{t("billing.ui.subscription.cancel.description")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <div className="bg-primary/10 border-primary/30 text-foreground rounded-lg border p-3 text-sm">
              {t("billing.ui.subscription.cancel.remains_active", { date: periodEndDate })}
            </div>

            <FormTextarea
              form={form}
              id="reason"
              name={t("billing.ui.subscription.cancel.reason")}
              placeholder={t("billing.ui.subscription.cancel.reason_placeholder")}
              className="min-h-24"
            />

            <div className="flex gap-x-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                {t("billing.ui.subscription.cancel.keep")}
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting
                  ? t("billing.ui.subscription.cancel.canceling")
                  : t("billing.ui.subscription.cancel.confirm")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
