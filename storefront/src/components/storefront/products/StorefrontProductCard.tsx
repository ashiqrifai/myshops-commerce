"use client";

import { Heart, ImageIcon, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addItem } from "@/store/slices/cartSlice";
import {
  makeSelectIsProductWishlisted,
  toggleWishlistItem,
} from "@/store/slices/wishlistSlice";
import type { StorefrontProduct } from "@/types/storefront";

interface Props {
  product: StorefrontProduct;
  showPrice?: boolean;
  showBrand?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;
}

const getImageUrl = (product: StorefrontProduct): string | null => {
  const asset = product.image?.mediaAsset;
  if (!asset) return null;

  const preferred =
    asset.variants?.find((item) => item.variantType === "MEDIUM") ||
    asset.variants?.find((item) => item.variantType === "SMALL") ||
    asset.variants?.find((item) => item.variantType === "THUMBNAIL") ||
    asset.variants?.find((item) => item.isPrimary);

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

const formatMoney = (
  value: number | string | null | undefined,
  currencyCode: string
) => {
  if (value == null || !Number.isFinite(Number(value))) return null;

  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currencyCode || "AED",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
};

export default function StorefrontProductCard({
  product,
  showPrice = true,
  showBrand = true,
  showWishlist = true,
  showAddToCart = true,
}: Props) {
  const dispatch = useAppDispatch();

  const selector = useMemo(
    () => makeSelectIsProductWishlisted(product.id),
    [product.id]
  );

  const isWishlisted = useAppSelector(selector);
  const imageUrl = getImageUrl(product);
  const currencyCode = product.price?.currencyCode || "AED";
  const sellingPrice = formatMoney(
    product.price?.sellingPrice,
    currencyCode
  );
  const compareAtPrice = formatMoney(
    product.price?.compareAtPrice,
    currencyCode
  );

  const hasDiscount =
    product.price?.compareAtPrice != null &&
    product.price?.sellingPrice != null &&
    Number(product.price.compareAtPrice) >
      Number(product.price.sellingPrice);

  const productUrl =
    product.productUrl || `/products/${product.slug}`;

  const toggleWishlist = () => {
    dispatch(
      toggleWishlistItem({
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        productType: product.productType,
        imageUrl,
        brandName: product.brand?.name || null,
        categoryName: product.primaryCategory?.name || null,
        variantId: product.defaultVariant?.id || null,
        sku: product.defaultVariant?.sku || null,
        unitPrice: product.price?.sellingPrice ?? null,
        compareAtPrice: product.price?.compareAtPrice ?? null,
        currencyCode,
        taxPercent: product.taxPercent || 0,
        isTaxInclusive: product.price?.isTaxInclusive !== false,
        addedAt: new Date().toISOString(),
      })
    );
  };

  const addToCart = () => {
    const variant = product.defaultVariant;
    const unitPrice = Number(product.price?.sellingPrice);

    if (!variant || !Number.isFinite(unitPrice)) return;

    dispatch(
      addItem({
        key: `${product.id}:${variant.id}:STANDARD`,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variantId: variant.id,
        sku: variant.sku,
        imageUrl,
        unitPrice,
        compareAtPrice: product.price?.compareAtPrice ?? null,
        currencyCode,
        taxPercent: product.taxPercent || 0,
        isTaxInclusive: product.price?.isTaxInclusive !== false,
        quantity: 1,
        extendedWarranty: null,
        selectedAttributes: [],
      })
    );
  };

  const canAddToCart =
    Boolean(product.defaultVariant?.id) &&
    product.price?.sellingPrice != null;

  return (
    <article className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-storefront-card border border-storefront bg-storefront-surface transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative">
        <Link
          href={productUrl}
          className="relative flex aspect-square items-center justify-center overflow-hidden bg-white"
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.image?.altText || product.name}
              className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-storefront-secondary">
              <ImageIcon size={34} className="text-storefront-muted" />
            </div>
          )}
        </Link>

        {product.isFeatured ? (
          <span className="absolute left-3 top-3 rounded-full bg-storefront-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            Featured
          </span>
        ) : null}

        {showWishlist ? (
          <button
            type="button"
            onClick={toggleWishlist}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? `Remove ${product.name} from wishlist`
                : `Add ${product.name} to wishlist`
            }
            className={[
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition",
              isWishlisted
                ? "border-storefront-primary bg-storefront-primary text-white"
                : "border-black/10 bg-white/95 text-storefront-text hover:bg-storefront-primary hover:text-white",
            ].join(" ")}
          >
            <Heart
              size={17}
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {showBrand && product.brand?.name ? (
          <p className="mb-1 truncate text-[11px] font-bold uppercase tracking-[0.12em] text-storefront-muted">
            {product.brand.name}
          </p>
        ) : null}

        <Link
          href={productUrl}
          className="line-clamp-2 min-h-11 text-sm font-bold leading-5 text-storefront-text transition hover:text-storefront-primary"
        >
          {product.name}
        </Link>

        {product.defaultVariant?.sku ? (
          <p className="mt-1 truncate text-xs text-storefront-muted">
            {product.defaultVariant.sku}
          </p>
        ) : null}

        <div className="mt-auto pt-4">
          {showPrice ? (
            <div className="min-h-12">
              {sellingPrice ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-lg font-black text-storefront-text">
                      {sellingPrice}
                    </span>

                    {hasDiscount && compareAtPrice ? (
                      <span className="text-xs text-storefront-muted line-through">
                        {compareAtPrice}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-[10px] text-storefront-muted">
                    {product.price?.isTaxInclusive
                      ? "VAT included"
                      : "VAT calculated at checkout"}
                  </p>
                </>
              ) : (
                <p className="text-sm font-semibold text-storefront-muted">
                  Price unavailable
                </p>
              )}
            </div>
          ) : null}

          {showAddToCart ? (
            <button
              type="button"
              disabled={!canAddToCart}
              onClick={addToCart}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-4 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={16} />
              Add to cart
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
