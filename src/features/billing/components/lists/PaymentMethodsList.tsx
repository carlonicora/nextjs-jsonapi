"use client";

import { PaymentMethodInterface } from "../../data/payment-method.interface";
import { PaymentMethodCard } from "../details/PaymentMethodCard";

type PaymentMethodsListProps = {
  paymentMethods: PaymentMethodInterface[];
  onUpdate: () => void;
};

export function PaymentMethodsList({ paymentMethods, onUpdate }: PaymentMethodsListProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {paymentMethods.map((paymentMethod) => (
        <PaymentMethodCard key={paymentMethod.id} paymentMethod={paymentMethod} onUpdate={onUpdate} />
      ))}
    </div>
  );
}
