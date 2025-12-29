"use client";

import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleId } from "../../../../roles";
import { Button } from "../../../../shadcnui";
import { useCurrentUserContext } from "../../../user/contexts";
import { BillingAdminService } from "../../data/billing-admin.service";
import { StripeProductInterface } from "../../data/billing.interface";
import { ProductEditor } from "../forms/ProductEditor";
import { ProductsList } from "../lists/ProductsList";

export function ProductsAdminContainer() {
  const { hasRole } = useCurrentUserContext();
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateProduct, setShowCreateProduct] = useState<boolean>(false);

  // Check if user has Administrator role
  if (!hasRole(getRoleId().Administrator)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-600 font-semibold">Permission denied. Administrator access required.</p>
      </div>
    );
  }

  const loadProducts = async () => {
    console.log("[ProductsAdminContainer] Loading products...");
    setLoading(true);
    try {
      const fetchedProducts = await BillingAdminService.listProducts();
      console.log("[ProductsAdminContainer] Loaded products:", fetchedProducts);
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("[ProductsAdminContainer] Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Package className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Product & Price Management</h1>
        </div>
        <Button onClick={() => setShowCreateProduct(true)}>Create Product</Button>
      </div>

      {/* Empty State */}
      {products.length === 0 && (
        <div className="bg-muted/50 flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed p-12">
          <Package className="text-muted-foreground h-16 w-16" />
          <div className="text-center">
            <h3 className="mb-2 text-xl font-semibold">No products yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first product to start offering subscriptions to your customers.
            </p>
            <Button onClick={() => setShowCreateProduct(true)}>Create Your First Product</Button>
          </div>
        </div>
      )}

      {/* Products List */}
      {products.length > 0 && <ProductsList products={products} onProductsChange={loadProducts} />}

      {/* Create Product Modal */}
      {showCreateProduct && (
        <ProductEditor open={showCreateProduct} onOpenChange={setShowCreateProduct} onSuccess={loadProducts} />
      )}
    </div>
  );
}
