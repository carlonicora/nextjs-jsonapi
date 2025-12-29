"use client";

import { DollarSign, Edit } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../shadcnui";
import { BillingAdminService } from "../../data/billing-admin.service";
import { StripePriceInterface } from "../../data/billing.interface";
import { PriceEditor } from "../forms/PriceEditor";
import { formatCurrency } from "../utils/currency";

type PricesListProps = {
  productId: string;
  onPricesChange: () => void;
};

export function PricesList({ productId, onPricesChange }: PricesListProps) {
  const [prices, setPrices] = useState<StripePriceInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreatePrice, setShowCreatePrice] = useState<boolean>(false);
  const [editingPrice, setEditingPrice] = useState<StripePriceInterface | null>(null);

  const loadPrices = async () => {
    console.log("[PricesList] Loading prices for product:", productId);
    setLoading(true);
    try {
      const fetchedPrices = await BillingAdminService.listPrices({ productId });
      console.log("[PricesList] Loaded prices:", fetchedPrices);
      setPrices(fetchedPrices);
    } catch (error) {
      console.error("[PricesList] Failed to load prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [productId]);

  const formatInterval = (price: StripePriceInterface): string => {
    if (price.type === "one_time") {
      return "one-time";
    }

    if (price.recurring) {
      const count = price.recurring.intervalCount;
      const interval = price.recurring.interval;

      if (count === 1) {
        return `/ ${interval}`;
      } else {
        return `/ ${count} ${interval}s`;
      }
    }

    return "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading prices...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold">Prices</h4>
        <Button size="sm" onClick={() => setShowCreatePrice(true)}>
          Add Price
        </Button>
      </div>

      {/* Empty State */}
      {prices.length === 0 && (
        <div className="bg-background flex flex-col items-center justify-center gap-y-3 rounded-lg border border-dashed p-8">
          <DollarSign className="text-muted-foreground h-12 w-12" />
          <p className="text-muted-foreground text-sm">No prices yet. Add a price to enable subscriptions.</p>
          <Button size="sm" onClick={() => setShowCreatePrice(true)}>
            Add Price
          </Button>
        </div>
      )}

      {/* Prices Grid */}
      {prices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {prices.map((price) => (
            <div key={price.stripePriceId} className="border rounded-lg bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <DollarSign className="h-5 w-5 text-primary" />
                <Button variant="ghost" size="sm" onClick={() => setEditingPrice(price)} className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="mb-2">
                <div className="text-2xl font-bold">
                  {formatCurrency(price.unitAmount, price.currency)}{" "}
                  <span className="text-muted-foreground text-sm font-normal">{formatInterval(price)}</span>
                </div>
              </div>

              {price.metadata?.nickname && <p className="text-sm font-medium mb-2">{price.metadata.nickname}</p>}

              <div className="flex flex-wrap gap-2">
                {price.active ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">Active</span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">Inactive</span>
                )}

                {price.recurring?.usageType === "metered" && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Metered</span>
                )}

                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium uppercase">
                  {price.currency}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Price Modal */}
      {showCreatePrice && (
        <PriceEditor
          productId={productId}
          open={showCreatePrice}
          onOpenChange={setShowCreatePrice}
          onSuccess={() => {
            loadPrices();
            onPricesChange();
          }}
        />
      )}

      {/* Edit Price Modal */}
      {editingPrice && (
        <PriceEditor
          productId={productId}
          price={editingPrice}
          open={!!editingPrice}
          onOpenChange={(open) => !open && setEditingPrice(null)}
          onSuccess={() => {
            loadPrices();
            onPricesChange();
            setEditingPrice(null);
          }}
        />
      )}
    </div>
  );
}
