"use client";

import { ExternalLink, User } from "lucide-react";
import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "../../../../shadcnui";
import { StripeCustomerInterface, StripeCustomerService } from "../../stripe-customer";

type CustomerInfoCardProps = {
  customer: StripeCustomerInterface | null;
  loading?: boolean;
  error?: string;
};

function formatBalance(balance: number | undefined, currency: string | undefined): string {
  if (balance === undefined || balance === 0) return "$0.00";
  const currencyCode = currency?.toUpperCase() || "USD";
  // Balance in Stripe is negative when customer has credit
  const displayBalance = -balance;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
  }).format(displayBalance / 100);
}

export function CustomerInfoCard({ customer, loading, error }: CustomerInfoCardProps) {
  const [portalLoading, setPortalLoading] = useState(false);

  const handlePortalClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPortalLoading(true);
    try {
      const { url } = await StripeCustomerService.createPortalSession();
      window.open(url, "_blank");
    } catch (err) {
      console.error("[CustomerInfoCard] Failed to create portal session:", err);
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Billing Account</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48 mb-1" />
          <Skeleton className="h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Billing Account</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Billing Account</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xl font-bold text-muted-foreground">Not set up</p>
          <p className="text-xs text-muted-foreground">Billing account will be created when you subscribe</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Billing Account</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {customer.name && <p className="text-xl font-bold">{customer.name}</p>}
          {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
          {customer.balance !== undefined && customer.balance !== 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Credit Balance: </span>
              <span className={customer.balance < 0 ? "text-green-600" : "text-destructive"}>
                {formatBalance(customer.balance, customer.currency)}
              </span>
            </p>
          )}
          <Button variant="outline" size="sm" className="mt-2" onClick={handlePortalClick} disabled={portalLoading}>
            {portalLoading ? "Loading..." : "Manage in Stripe Portal"}
            <ExternalLink className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
