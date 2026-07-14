"use client";

import { MoreVertical } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../shadcnui";
import { PaymentMethodInterface, StripeCustomerInterface, StripeCustomerService } from "../../data";

type PaymentMethodCardProps = {
  paymentMethod: PaymentMethodInterface;
  onUpdate: () => void;
};

// Card brand icons mapping
const brandIcons: Record<string, string> = {
  visa: "💳",
  mastercard: "💳",
  amex: "💳",
  discover: "💳",
};

export function PaymentMethodCard({ paymentMethod, onUpdate }: PaymentMethodCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [customer, setCustomer] = useState<StripeCustomerInterface | null>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState<boolean>(false);

  // Load customer to check default payment method
  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const fetchedCustomer = await StripeCustomerService.getCustomer();
        setCustomer(fetchedCustomer);
      } catch (error) {
        console.error("[PaymentMethodCard] Failed to load customer:", error);
      }
    };

    loadCustomer();
  }, []);

  const isDefault = customer?.defaultPaymentMethodId === paymentMethod.id;
  const brand = paymentMethod.card?.brand || "card";
  const last4 = paymentMethod.card?.last4 || "****";
  const expMonth = paymentMethod.card?.expMonth || 0;
  const expYear = paymentMethod.card?.expYear || 0;
  const brandIcon = brandIcons[brand.toLowerCase()] || "💳";

  const handleSetDefault = async () => {
    setLoading(true);
    try {
      await StripeCustomerService.setDefaultPaymentMethod({ paymentMethodId: paymentMethod.id });
      onUpdate();
    } catch (error) {
      console.error("[PaymentMethodCard] Failed to set as default:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await StripeCustomerService.removePaymentMethod({ paymentMethodId: paymentMethod.id });
      setShowRemoveDialog(false);
      onUpdate();
    } catch (error) {
      console.error("[PaymentMethodCard] Failed to remove:", error);
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="relative">
        {/* Default Badge */}
        {isDefault && (
          <Badge variant="softGreen" className="absolute right-2 top-2">
            Default
          </Badge>
        )}

        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-x-2">
            <span className="text-2xl">{brandIcon}</span>
            <span className="text-sm font-medium capitalize">{brand}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                render={<div />}
                nativeButton={false}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isDefault && (
                <DropdownMenuItem onClick={handleSetDefault} disabled={loading}>
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowRemoveDialog(true)}
                disabled={loading}
                className="text-destructive"
              >
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col gap-y-1">
            <p className="text-lg font-semibold">•••• {last4}</p>
            <p className="text-sm text-muted-foreground">
              Expires {String(expMonth).padStart(2, "0")}/{expYear}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this payment method? This action cannot be undone.
              {isDefault && " This is your default payment method."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
