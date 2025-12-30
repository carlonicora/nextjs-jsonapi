"use client";

import { Archive, DollarSign, Edit, RotateCcw } from "lucide-react";
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
  Button,
} from "../../../../../shadcnui";
import { formatCurrency } from "../../../components/utils/currency";
import { StripePriceService } from "../../data";
import { StripePriceInterface } from "../../data/stripe-price.interface";
import { PriceEditor } from "../forms/PriceEditor";

type PricesListProps = {
  productId: string;
  onPricesChange: () => void;
};

export function PricesList({ productId, onPricesChange }: PricesListProps) {
  const [prices, setPrices] = useState<StripePriceInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreatePrice, setShowCreatePrice] = useState<boolean>(false);
  const [editingPrice, setEditingPrice] = useState<StripePriceInterface | null>(null);
  const [priceToArchive, setPriceToArchive] = useState<StripePriceInterface | null>(null);
  const [priceToReactivate, setPriceToReactivate] = useState<StripePriceInterface | null>(null);
  const [archivingPriceId, setArchivingPriceId] = useState<string | null>(null);
  const [reactivatingPriceId, setReactivatingPriceId] = useState<string | null>(null);

  const loadPrices = async () => {
    setLoading(true);
    try {
      const fetchedPrices = await StripePriceService.listPrices({ productId });
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

  const handleArchive = async () => {
    if (!priceToArchive) {
      return;
    }

    setArchivingPriceId(priceToArchive.id);
    try {
      await StripePriceService.archivePrice({ id: priceToArchive.id });
      setPriceToArchive(null); // Close dialog on success
      await loadPrices();
      onPricesChange();
    } catch (error) {
      console.error("[PricesList] Failed to archive price:", error);
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setArchivingPriceId(null);
    }
  };

  const handleReactivate = async () => {
    if (!priceToReactivate) {
      return;
    }

    setReactivatingPriceId(priceToReactivate.id);
    try {
      await StripePriceService.reactivatePrice({ id: priceToReactivate.id });
      setPriceToReactivate(null); // Close dialog on success
      await loadPrices();
      onPricesChange();
    } catch (error) {
      console.error("[PricesList] Failed to reactivate price:", error);
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setReactivatingPriceId(null);
    }
  };

  const formatInterval = (price: StripePriceInterface): string => {
    if (price.priceType === "one_time") {
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
          {prices.map((price) => {
            const isArchiving = archivingPriceId === price.id;
            const isReactivating = reactivatingPriceId === price.id;

            return (
              <div key={price.id} className="border rounded-lg bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingPrice(price)} className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    {price.active ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPriceToArchive(price)}
                        className="h-8 w-8 p-0"
                        disabled={isArchiving}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPriceToReactivate(price)}
                        className="h-8 w-8 p-0"
                        disabled={isReactivating}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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
            );
          })}
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

      {/* Archive Price Confirmation Dialog */}
      <AlertDialog open={!!priceToArchive} onOpenChange={(open) => !open && setPriceToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Price</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive the price for{" "}
              {priceToArchive && `${formatCurrency(priceToArchive.unitAmount, priceToArchive.currency)} ${formatInterval(priceToArchive)}`}
              ? This will prevent new subscriptions but existing ones will continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!archivingPriceId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={!!archivingPriceId}
              className="bg-red-600 hover:bg-red-700"
            >
              {archivingPriceId ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Price Confirmation Dialog */}
      <AlertDialog open={!!priceToReactivate} onOpenChange={(open) => !open && setPriceToReactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Price</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate the price for{" "}
              {priceToReactivate && `${formatCurrency(priceToReactivate.unitAmount, priceToReactivate.currency)} ${formatInterval(priceToReactivate)}`}
              ? This will allow new subscriptions again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!reactivatingPriceId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={!!reactivatingPriceId}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivatingPriceId ? "Reactivating..." : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
