"use client";

import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../shadcnui";
import { PaymentMethodInterface, StripeCustomerService } from "../../data";
import { PaymentMethodEditor } from "../forms/PaymentMethodEditor";
import { PaymentMethodsList } from "../lists/PaymentMethodsList";

export function PaymentMethodsContainer() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState<boolean>(false);

  const loadPaymentMethods = async () => {
    console.log("[PaymentMethodsContainer] Loading payment methods...");
    setLoading(true);
    try {
      const fetchedPaymentMethods = await StripeCustomerService.listPaymentMethods();
      console.log("[PaymentMethodsContainer] Loaded payment methods:", fetchedPaymentMethods);
      setPaymentMethods(fetchedPaymentMethods);
    } catch (error) {
      console.error("[PaymentMethodsContainer] Failed to load payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading payment methods...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Payment Methods</h1>
        </div>
        <Button onClick={() => setShowAddPaymentMethod(true)}>Add Payment Method</Button>
      </div>

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed border-gray-300 bg-muted/50 p-12">
          <CreditCard className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">No payment methods</h3>
            <p className="mb-4 text-muted-foreground">
              Add a payment method to enable subscriptions and secure checkout.
            </p>
            <Button onClick={() => setShowAddPaymentMethod(true)}>Add Your First Card</Button>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      {paymentMethods.length > 0 && (
        <PaymentMethodsList paymentMethods={paymentMethods} onUpdate={loadPaymentMethods} />
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentMethod && (
        <PaymentMethodEditor
          open={showAddPaymentMethod}
          onOpenChange={setShowAddPaymentMethod}
          onSuccess={loadPaymentMethods}
        />
      )}
    </div>
  );
}
