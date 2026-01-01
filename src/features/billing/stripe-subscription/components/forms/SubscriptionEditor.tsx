"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { FormSelect } from "../../../../../components";
import { CommonEditorButtons } from "../../../../../components/forms/CommonEditorButtons";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
} from "../../../../../shadcnui";
import { formatCurrency } from "../../../components/utils";
import { ProrationPreview } from "../widgets/ProrationPreview";
import { ProrationPreviewInterface } from "../../../stripe-invoice/data/stripe-invoice.interface";
import { StripeCustomerService } from "../../../stripe-customer/data/stripe-customer.service";
import { StripePriceService } from "../../../stripe-price";
import { StripePriceInterface } from "../../../stripe-price/data/stripe-price.interface";
import { StripeProductInterface, StripeProductService } from "../../../stripe-product";
import { StripeSubscriptionInterface, StripeSubscriptionService } from "../../data";

type SubscriptionEditorProps = {
  subscription?: StripeSubscriptionInterface;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  onAddPaymentMethod?: () => void;
};

const formSchema = z.object({
  productId: z.string().min(1, { message: "Product is required" }),
  priceId: z.string().min(1, { message: "Price is required" }),
});

export function SubscriptionEditor({
  subscription,
  open,
  onOpenChange,
  onSuccess,
  onAddPaymentMethod,
}: SubscriptionEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [prices, setPrices] = useState<StripePriceInterface[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [loadingPrices, setLoadingPrices] = useState<boolean>(false);
  const [prorationPreview, setProrationPreview] = useState<ProrationPreviewInterface | null>(null);
  const [loadingProration, setLoadingProration] = useState<boolean>(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(true);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState<boolean>(true);
  const [paymentRequiredError, setPaymentRequiredError] = useState<boolean>(false);

  // Get current subscription price if editing
  const currentPriceId = subscription?.price?.stripePriceId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: "",
      priceId: currentPriceId || "",
    },
  });

  const selectedProductId = form.watch("productId");
  const selectedPriceId = form.watch("priceId");

  // Check payment methods on mount (only for new subscriptions)
  useEffect(() => {
    const checkPaymentMethods = async () => {
      if (subscription) {
        // Editing existing subscription doesn't need payment method check
        setLoadingPaymentMethods(false);
        return;
      }

      console.log("[SubscriptionEditor] Checking payment methods...");
      setLoadingPaymentMethods(true);
      try {
        const paymentMethods = await StripeCustomerService.listPaymentMethods();
        const hasMethod = paymentMethods.length > 0;
        console.log("[SubscriptionEditor] Payment methods found:", hasMethod);
        setHasPaymentMethod(hasMethod);
      } catch (error) {
        console.error("[SubscriptionEditor] Failed to check payment methods:", error);
        setHasPaymentMethod(false);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    if (open) {
      checkPaymentMethods();
    }
  }, [open, subscription]);

  // Load active products on mount
  useEffect(() => {
    const loadProducts = async () => {
      console.log("[SubscriptionEditor] Loading active products...");
      setLoadingProducts(true);
      try {
        const fetchedProducts = await StripeProductService.listProducts({ active: true });
        console.log("[SubscriptionEditor] Loaded products:", fetchedProducts);
        setProducts(fetchedProducts);

        // If editing, find the product for the current price
        if (subscription && currentPriceId) {
          const allPrices = await StripePriceService.listPrices({ active: true });
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
        const fetchedPrices = await StripePriceService.listPrices({
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
        const preview = await StripeSubscriptionService.getProrationPreview({
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
        await StripeSubscriptionService.changePlan({
          subscriptionId: subscription.id,
          newPriceId: values.priceId,
        });
        console.log("[SubscriptionEditor] Plan changed successfully");
      } else {
        // Create new subscription
        await StripeSubscriptionService.createSubscription({
          id: crypto.randomUUID(),
          priceId: values.priceId,
        });
        console.log("[SubscriptionEditor] Subscription created successfully");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("[SubscriptionEditor] Failed to save subscription:", error);
      // Handle 402 Payment Required error
      if (error?.status === 402 || error?.response?.status === 402) {
        console.log("[SubscriptionEditor] Payment method required");
        setPaymentRequiredError(true);
        setHasPaymentMethod(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format product options for select
  const productOptions = products.map((product) => ({
    id: product.id,
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

        {loadingPaymentMethods && !subscription ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Checking payment methods...</div>
          </div>
        ) : !hasPaymentMethod && !subscription ? (
          <Alert variant="destructive">
            <AlertTitle>Payment Method Required</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-4">
                {paymentRequiredError
                  ? "Your subscription could not be created because no payment method is on file."
                  : "You need to add a payment method before you can subscribe to a plan."}
              </p>
              {onAddPaymentMethod && (
                <Button onClick={onAddPaymentMethod} variant="outline">
                  Add Payment Method
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : (
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
                  !selectedProductId ? "Select a product first" : loadingPrices ? "Loading prices..." : "Select a price"
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
        )}
      </DialogContent>
    </Dialog>
  );
}
