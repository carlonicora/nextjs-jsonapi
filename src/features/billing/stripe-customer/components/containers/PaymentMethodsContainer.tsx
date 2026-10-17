"use client";

import { useTranslations } from "next-intl";
import { CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../shadcnui";
import { PaymentMethodInterface, StripeCustomerService } from "../../data";
import { PaymentMethodEditor } from "../forms/PaymentMethodEditor";
import { PaymentMethodsList } from "../lists/PaymentMethodsList";

export function PaymentMethodsContainer() {
  const t = useTranslations();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState<boolean>(false);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const fetchedPaymentMethods = await StripeCustomerService.listPaymentMethods();
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
        <p className="text-muted-foreground">{t("billing.ui.payment_methods.loading")}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <CreditCard className="h-8 w-8" />
          <h1 className="text-primary text-3xl font-semibold">{t("billing.ui.payment_methods.title")}</h1>
        </div>
        <Button onClick={() => setShowAddPaymentMethod(true)}>{t("billing.ui.payment_methods.add")}</Button>
      </div>

      {/* Empty State */}
      {paymentMethods.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed border-gray-300 bg-muted/50 p-12">
          <CreditCard className="h-16 w-16 text-muted-foreground" />
          <div className="text-center">
            <h3 className="mb-2 text-sm font-medium">{t("billing.ui.payment_methods.empty_title")}</h3>
            <p className="mb-4 text-muted-foreground">{t("billing.ui.payment_methods.empty_description")}</p>
            <Button onClick={() => setShowAddPaymentMethod(true)}>{t("billing.ui.payment_methods.add_first")}</Button>
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
