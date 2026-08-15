"use client";

import { Package } from "lucide-react";
import { useEffect, useState } from "react";
import { getRoleId } from "../../../../../roles";
import { Button } from "../../../../../shadcnui";
import { useCurrentUserContext } from "../../../../user/contexts";
import { useOptionalBillingContext } from "../../../contexts/BillingContext";
import { StripeProductInterface } from "../../data/stripe-product.interface";
import { StripeProductService } from "../../data/stripe-product.service";
import { ProductEditor } from "../forms/ProductEditor";
import { ProductsList } from "../lists/ProductsList";

export function ProductsAdminContainer() {
  const { hasRole } = useCurrentUserContext();
  // Optional on purpose: the create action lives in BillingProvider's title
  // functions when this container is a page, but the container is still mounted
  // bare elsewhere, where it keeps its own inline create button.
  const billing = useOptionalBillingContext();
  const [products, setProducts] = useState<StripeProductInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateProduct, setShowCreateProduct] = useState<boolean>(false);

  // Check if user has Administrator role
  if (!hasRole(getRoleId().Administrator)) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-destructive text-xs/relaxed">Permission denied. Administrator access required.</p>
      </div>
    );
  }

  const loadProducts = async () => {
    setLoading(true);
    try {
      const fetchedProducts = await StripeProductService.listProducts();
      setProducts(fetchedProducts);
    } catch (error) {
      console.error("[ProductsAdminContainer] Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reloads on mount and whenever the provider's create action succeeds.
  useEffect(() => {
    loadProducts();
  }, [billing?.refreshToken]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col">
      {/* No header here. The page name and the create action belong to
          BillingProvider, which publishes them through `title.functions` for
          RoundPageContainerTitle to render — the same way CompanyProvider
          publishes CompanyEditor. A header drawn inside the content would
          duplicate the title bar and strand the button above the list. */}
      {/* Fallback for consumers mounting this container without BillingProvider:
          they have no title bar to host the action, so it stays inline. */}
      {!billing && (
        <div className="flex w-full items-center justify-end px-4 pt-4">
          <Button onClick={() => setShowCreateProduct(true)}>Create Product</Button>
        </div>
      )}

      <div className="flex w-full flex-col gap-y-6 px-4 pb-4">
        {/* Empty State */}
        {products.length === 0 && (
          <div className="bg-muted/50 flex flex-col items-center justify-center gap-y-4 rounded-lg border-2 border-dashed p-12">
            <Package className="text-muted-foreground h-16 w-16" />
            <div className="text-center">
              <h3 className="mb-2 text-sm font-medium">No products yet</h3>
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
    </div>
  );
}
