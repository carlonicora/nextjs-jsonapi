"use client";

import { Archive, ChevronDown, ChevronUp, Edit, Package } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../shadcnui";
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

  const handleArchive = async (productId: string) => {
    console.log("[ProductsList] Archiving product:", productId);

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to archive this product? This will deactivate it and it will no longer be available for new subscriptions.",
    );

    if (!confirmed) {
      console.log("[ProductsList] Archive cancelled by user");
      return;
    }

    setArchivingProductId(productId);
    try {
      await StripeProductService.archiveProduct({ id: productId });
      console.log("[ProductsList] Product archived successfully");
      onProductsChange();
    } catch (error) {
      console.error("[ProductsList] Failed to archive product:", error);
    } finally {
      setArchivingProductId(null);
    }
  };

  const toggleExpand = (productId: string) => {
    console.log("[ProductsList] Toggling product expansion:", productId);
    setExpandedProductId(expandedProductId === productId ? null : productId);
  };

  return (
    <div className="flex flex-col gap-y-4">
      {products.map((product) => {
        const isExpanded = expandedProductId === product.id;
        const isArchiving = archivingProductId === product.id;

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
                <Button variant="outline" size="sm" onClick={() => handleArchive(product.id)} disabled={isArchiving}>
                  <Archive className="h-4 w-4 mr-1" />
                  {isArchiving ? "Archiving..." : "Archive"}
                </Button>
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
    </div>
  );
}
