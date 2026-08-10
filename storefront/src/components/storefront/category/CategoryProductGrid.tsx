import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  StorefrontProduct,
} from "@/types/storefront";

export default function CategoryProductGrid({
  products,
}: {
  products: StorefrontProduct[];
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-storefront bg-storefront-surface px-6 py-16 text-center">
        <h2 className="text-xl font-black text-storefront-text">
          No products found
        </h2>

        <p className="mt-2 text-sm text-storefront-muted">
          Try clearing some filters or selecting another category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {products.map(
        (product) => (
          <StorefrontProductCard
            key={product.id}
            product={product}
          />
        )
      )}
    </div>
  );
}
