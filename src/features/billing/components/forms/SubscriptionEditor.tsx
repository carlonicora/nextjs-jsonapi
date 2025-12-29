"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { FormSelect } from "../../../../components";
import { CommonEditorButtons } from "../../../../components/forms/CommonEditorButtons";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Form } from "../../../../shadcnui";
import { BillingAdminService } from "../../data/billing-admin.service";
import { BillingService } from "../../data/billing.service";
import {
  ProrationPreview as ProrationPreviewType,
  StripePriceInterface,
  StripeProductInterface,
  SubscriptionInterface,
} from "../../data/billing.interface";
import { ProrationPreview } from "../widgets/ProrationPreview";
import { formatCurrency } from "../utils";

type SubscriptionEditorProps = {
  subscription?: SubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const formSchema = z.object({
  productId: z.string().min(1, { message: "Product is required" }),
  priceId: z.string().min(1, { message: "Price is required" }),
});

export function SubscriptionEditor({ subscription, open, onOpenChange, onSuccess }: SubscriptionEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [prices, setPrices] = useState<StripePriceInterface[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreviewType | null>(null);
  const [loadingProration, setLoadingProration] = useState<boolean>(false);

  // Get current subscription item if editing
  const currentItem = subscription?.items?.[0];
  const currentPriceId = currentItem?.priceId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      priceId: currentPriceId || "",
    },
  });

  const selectedProductId = form.watch("productId");
  const selectedPriceId = form.watch("priceId");

  // Load active products on mount
  useEffect(() => {
    const loadProducts = async () => {
      console.log("[SubscriptionEditor] Loading active products...");
      setLoadingProducts(true);
      try {
        const fetchedProducts = await BillingAdminService.listProducts({ active: true });
        console.log("[SubscriptionEditor] Loaded products:", fetchedProducts);
        setProducts(fetchedProducts);

        // If editing, find the product for the current price
        if (subscription && currentPriceId) {
          const allPrices = await BillingAdminService.listPrices({ active: true });
          const currentPrice = allPrices.find((p) => p.stripePriceId === currentPriceId);
          if (currentPrice) {
            form.setValue("productId", currentPrice.productId);
          }
        }
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to load products:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  // Load prices when product changes
  useEffect(() => {
    const loadPrices = async () => {
      if (!selectedProductId) {
        setPrices([]);
        return;
      }

      console.log("[SubscriptionEditor] Loading prices for product:", selectedProductId);
      setLoadingPrices(true);
      try {
        const fetchedPrices = await BillingAdminService.listPrices({
          productId: selectedProductId,
          active: true,
        });
        console.log("[SubscriptionEditor] Loaded prices:", fetchedPrices);
        setPrices(fetchedPrices);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to load prices:", error);
      } finally {
        setLoadingPrices(false);
      }
    };

    loadPrices();
  }, [selectedProductId]);

  // Load proration preview when editing and price changes
  useEffect(() => {
    const loadProration = async () => {
      if (!subscription || !selectedPriceId || selectedPriceId === currentPriceId) {
        setProrationPreview(null);
        return;
      }

      console.log("[SubscriptionEditor] Loading proration preview...");
      setLoadingProration(true);
      try {
        const preview = await BillingService.getProrationPreview({
          subscriptionId: subscription.id,
          newPriceId: selectedPriceId,
        });
        console.log("[SubscriptionEditor] Loaded proration preview:", preview);
        setProrationPreview(preview);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to load proration preview:", error);
        setProrationPreview(null);
      } finally {
        setLoadingProration(false);
      }
    };

    loadProration();
  }, [selectedPriceId, subscription, currentPriceId]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async (values) => {
    console.log("[SubscriptionEditor] Submitting subscription:", values);
    setIsSubmitting(true);

    try {
      if (subscription) {
        // Change plan
        await BillingService.changePlan({
          subscriptionId: subscription.id,
          newPriceId: values.priceId,
        });
        console.log("[SubscriptionEditor] Plan changed successfully");
      } else {
        // Create new subscription
        await BillingService.createSubscription({
          priceId: values.priceId,
        });
        console.log("[SubscriptionEditor] Subscription created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("[SubscriptionEditor] Failed to save subscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format product options for select
  const productOptions = products.map((product) => ({
    id: product.stripeProductId,
    text: product.name,
  }));

  // Format price options for select
  const priceOptions = prices.map((price) => {
    const interval = price.recurring?.interval || "one-time";
    const amount = formatCurrency(price.unitAmount, price.currency);
    return {
      id: price.stripePriceId,
      text: `${amount} / ${interval}`,
    };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{subscription ? "Change Plan" : "Subscribe to a Plan"}</DialogTitle>
          <DialogDescription>
            {subscription
              ? "Select a new plan to switch to. You'll see a proration preview before confirming."
              : "Choose a product and pricing plan to start your subscription."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            <FormSelect
              form={form}
              id="productId"
              name="Product"
              placeholder={loadingProducts ? "Loading products..." : "Select a product"}
              disabled={loadingProducts}
              values={productOptions}
            />

            <FormSelect
              form={form}
              id="priceId"
              name="Price"
              placeholder={
                !selectedProductId
                  ? "Select a product first"
                  : loadingPrices
                    ? "Loading prices..."
                    : "Select a price"
              }
              disabled={!selectedProductId || loadingPrices}
              values={priceOptions}
            />

            {loadingProration && (
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground text-center">
                Loading proration preview...
              </div>
            )}

            {prorationPreview && !loadingProration && <ProrationPreview preview={prorationPreview} />}

            <CommonEditorButtons isEdit={!!subscription} form={form} disabled={isSubmitting} setOpen={onOpenChange} />
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
