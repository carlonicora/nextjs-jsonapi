"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { FormCheckbox, FormTextarea } from "../../../../components";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Form } from "../../../../shadcnui";
import { BillingService } from "../../data/billing.service";
import { SubscriptionInterface } from "../../data/subscription.interface";
import { formatDate } from "../utils";

type CancelSubscriptionDialogProps = {
  subscription: SubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const formSchema = z.object({
  cancelImmediately: z.boolean(),
  reason: z.string().optional(),
});

export function CancelSubscriptionDialog({ subscription, open, onOpenChange, onSuccess }: CancelSubscriptionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cancelImmediately: false,
      reason: "",
    },
  });

  const cancelImmediately = form.watch("cancelImmediately");

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    console.log("[CancelSubscriptionDialog] Canceling subscription:", values);
    setIsSubmitting(true);

    try {
      await BillingService.cancelSubscription({
        subscriptionId: subscription.id,
        immediate: values.cancelImmediately,
        reason: values.reason,
      });
      console.log("[CancelSubscriptionDialog] Subscription canceled successfully");

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[CancelSubscriptionDialog] Failed to cancel subscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const periodEndDate = formatDate(subscription.currentPeriodEnd);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Subscription</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this subscription? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <FormCheckbox
              form={form}
              id="cancelImmediately"
              name="Cancel Immediately"
            />

            {cancelImmediately ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                Your subscription will be canceled immediately and you will lose access right away.
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                Your subscription will remain active until {periodEndDate}. You can continue using the service until
                then.
              </div>
            )}

            <FormTextarea
              form={form}
              id="reason"
              name="Reason (Optional)"
              placeholder="Let us know why you're canceling..."
              className="min-h-24"
            />

            <div className="flex gap-x-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Keep Subscription
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? "Canceling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
