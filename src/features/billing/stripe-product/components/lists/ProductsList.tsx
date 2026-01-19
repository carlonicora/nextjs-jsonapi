"use client";

import { Archive, ChevronDown, ChevronUp, Edit, Package, RefreshCw } from "lucide-react";
import { useState } from "react";
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
import { PricesList } from "../../../stripe-price/components/lists/PricesList";
import { StripeProductInterface } from "../../data/stripe-product.interface";
import { StripeProductService } from "../../data/stripe-product.service";
import { ProductEditor } from "../forms/ProductEditor";

type ProductsListProps = {
  products: StripeProductInterface[];
  onProductsChange: () => void;
};

export function ProductsList({ products, onProductsChange }: ProductsListProps) {
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<StripeProductInterface | null>(null);
  const [archivingProductId, setArchivingProductId] = useState<string | null>(null);
  const [reactivatingProductId, setReactivatingProductId] = useState<string | null>(null);
  const [productToArchive, setProductToArchive] = useState<StripeProductInterface | null>(null);
  const [productToReactivate, setProductToReactivate] = useState<StripeProductInterface | null>(null);

  const handleArchive = async () => {
    if (!productToArchive) {
      return;
    }

    setArchivingProductId(productToArchive.id);
    try {
      const _archivedProduct = await StripeProductService.archiveProduct({ id: productToArchive.id });
      setProductToArchive(null); // Close dialog on success
      onProductsChange();
    } catch (_error) {
      console.error("[ProductsList] Failed to archive product:", _error);
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setArchivingProductId(null);
    }
  };

  const handleReactivate = async () => {
    if (!productToReactivate) {
      return;
    }

    setReactivatingProductId(productToReactivate.id);
    try {
      const _reactivatedProduct = await StripeProductService.reactivateProduct({ id: productToReactivate.id });
      setProductToReactivate(null); // Close dialog on success
      onProductsChange();
    } catch (_error) {
      // Keep dialog open on error so user can retry or cancel
    } finally {
      setReactivatingProductId(null);
    }
  };

  const toggleExpand = (productId: string) => {
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  return (
    <div className="flex flex-col gap-y-4">
      {products.map((product) => {
        const isExpanded = expandedProductId === product.id;
        const isArchiving = archivingProductId === product.id;
        const isReactivating = reactivatingProductId === product.id;

        return (
          <div key={product.id} className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Product Card Header */}
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-x-4 flex-1">
                <Package className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <div className="flex items-center gap-x-3">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    {product.active ? (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  {product.description && <p className="text-muted-foreground text-sm mt-1">{product.description}</p>}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-x-2">
                <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                {product.active ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductToArchive(product)}
                    disabled={isArchiving}
                  >
                    <Archive className="h-4 w-4 mr-1" />
                    {isArchiving ? "Archiving..." : "Archive"}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductToReactivate(product)}
                    disabled={isReactivating}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    {isReactivating ? "Reactivating..." : "Reactivate"}
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => toggleExpand(product.id)}>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </Button>
              </div>
            </div>

            {/* Expandable Prices Section */}
            {isExpanded && (
              <div className="border-t bg-muted/30 p-6">
                <PricesList productId={product.id} onPricesChange={onProductsChange} />
              </div>
            )}
          </div>
        );
      })}

      {/* Edit Product Modal */}
      {editingProduct && (
        <ProductEditor
          product={editingProduct}
          open={!!editingProduct}
          onOpenChange={(open) => !open && setEditingProduct(null)}
          onSuccess={() => {
            onProductsChange();
            setEditingProduct(null);
          }}
        />
      )}

      {/* Archive Product Confirmation Dialog */}
      <AlertDialog open={!!productToArchive} onOpenChange={(open) => !open && setProductToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive &quot;{productToArchive?.name}&quot;? This will deactivate it and it will
              no longer be available for new subscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!archivingProductId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={!!archivingProductId}
              className="bg-red-600 hover:bg-red-700"
            >
              {archivingProductId ? "Archiving..." : "Archive"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reactivate Product Confirmation Dialog */}
      <AlertDialog open={!!productToReactivate} onOpenChange={(open) => !open && setProductToReactivate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reactivate &quot;{productToReactivate?.name}&quot;? This will make it available
              for new subscriptions again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!reactivatingProductId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReactivate}
              disabled={!!reactivatingProductId}
              className="bg-green-600 hover:bg-green-700"
            >
              {reactivatingProductId ? "Reactivating..." : "Reactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
