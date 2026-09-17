"use client";

import {
  Heart,
  ImageIcon,
  ShoppingCart,
  Tag,
  Zap,
} from "lucide-react";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  makeSelectIsProductWishlisted,
  toggleWishlistItem,
} from "@/store/slices/wishlistSlice";

import type {
  StorefrontProduct,
} from "@/types/storefront";

import {
  trackStorefrontActivity,
} from "@/lib/storefront/storefront-activity-api";

import ProductQuickAddModal from "@/components/storefront/products/ProductQuickAddModal";
import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

import {
  useProductDeliveryEligibility,
} from "@/hooks/useProductDeliveryEligibility";

interface Props {
  product:
    StorefrontProduct;

  showPrice?:
    boolean;

  showBrand?:
    boolean;

  showWishlist?:
    boolean;

  showAddToCart?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| Product Image
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Product Image
|--------------------------------------------------------------------------
|
| Preference:
|
| MEDIUM
| → SMALL
| → THUMBNAIL
| → PRIMARY
|
| A cache version is appended so regenerated DAM variants
| are not stuck behind an older browser/CDN cached image.
|
|--------------------------------------------------------------------------
*/

const getImageUrl = (
  product:
    StorefrontProduct
): string | null => {
  const asset =
    product.image
      ?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "MEDIUM"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "SMALL"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "THUMBNAIL"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.isPrimary
    );

  /*
  |--------------------------------------------------------------------------
  | Base URL
  |--------------------------------------------------------------------------
  */

  const baseUrl =
    preferred
      ?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null;

  if (!baseUrl) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Cache Version
  |--------------------------------------------------------------------------
  |
  | We intentionally read these safely because your current
  | StorefrontProduct TypeScript type may not yet contain
  | checksum / updatedAt.
  |
  |--------------------------------------------------------------------------
  */

  const preferredRecord =
    preferred
      ? (
          preferred as unknown as
            Record<
              string,
              unknown
            >
        )
      : null;

  const assetRecord =
    asset as unknown as
      Record<
        string,
        unknown
      >;

  const checksum =
    preferredRecord
      ?.checksum;

  const variantUpdatedAt =
    preferredRecord
      ?.updatedAt;

  const assetUpdatedAt =
    assetRecord
      ?.updatedAt;

  const version =
    String(
      checksum ||
        variantUpdatedAt ||
        assetUpdatedAt ||
        ""
    ).trim();

  /*
  |--------------------------------------------------------------------------
  | No Version Available
  |--------------------------------------------------------------------------
  */

  if (!version) {
    return baseUrl;
  }

  /*
  |--------------------------------------------------------------------------
  | Append ?v=
  |--------------------------------------------------------------------------
  */

  const separator =
    baseUrl.includes(
      "?"
    )
      ? "&"
      : "?";

  return `${baseUrl}${separator}v=${encodeURIComponent(
    version
  )}`;
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function StorefrontProductCard({
  product,
  showPrice = true,
  showBrand = true,
  showWishlist = true,
  showAddToCart = true,
}: Props) {
  const dispatch =
    useAppDispatch();

  /*
  |--------------------------------------------------------------------------
  | Quick Add
  |--------------------------------------------------------------------------
  */

  const [
    quickAddOpen,
    setQuickAddOpen,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Wishlist
  |--------------------------------------------------------------------------
  */

  const selector =
    useMemo(
      () =>
        makeSelectIsProductWishlisted(
          product.id
        ),
      [
        product.id,
      ]
    );

  const isWishlisted =
    useAppSelector(
      selector
    );

  /*
  |--------------------------------------------------------------------------
  | Display
  |--------------------------------------------------------------------------
  */

  const imageUrl =
    getImageUrl(
      product
    );

  const currencyCode =
    product.price
      ?.currencyCode ||
    "AED";

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const regularPrice =
    product.price
      ?.regularPrice !=
      null
      ? Number(
          product.price
            .regularPrice
        )
      : null;

  const sellingPrice =
    product.price
      ?.sellingPrice !=
      null
      ? Number(
          product.price
            .sellingPrice
        )
      : null;

  const compareAtPrice =
    product.price
      ?.compareAtPrice !=
      null
      ? Number(
          product.price
            .compareAtPrice
        )
      : null;

  const backendTotalDiscountAmount =
    product.price
      ?.totalDiscountAmount !=
      null
      ? Number(
          product.price
            .totalDiscountAmount
        )
      : null;

  const backendTotalDiscountPercent =
    product.price
      ?.totalDiscountPercent !=
      null
      ? Number(
          product.price
            .totalDiscountPercent
        )
      : null;


  /*
  |--------------------------------------------------------------------------
  | Original Price
  |--------------------------------------------------------------------------
  */

  const displayOriginalPrice =
    regularPrice != null &&
    sellingPrice != null &&
    regularPrice >
      sellingPrice
      ? regularPrice
      : compareAtPrice != null &&
          sellingPrice != null &&
          compareAtPrice >
            sellingPrice
        ? compareAtPrice
        : null;

  /*
  |--------------------------------------------------------------------------
  | Discount Amount
  |--------------------------------------------------------------------------
  */

  const totalDiscountAmount =
    backendTotalDiscountAmount !=
      null &&
    Number.isFinite(
      backendTotalDiscountAmount
    ) &&
    backendTotalDiscountAmount >
      0
      ? backendTotalDiscountAmount
      : displayOriginalPrice !=
            null &&
          sellingPrice !=
            null &&
          displayOriginalPrice >
            sellingPrice
        ? displayOriginalPrice -
          sellingPrice
        : 0;

  /*
  |--------------------------------------------------------------------------
  | Discount Percentage
  |--------------------------------------------------------------------------
  */

  const discountPercentage =
    backendTotalDiscountPercent !=
      null &&
    Number.isFinite(
      backendTotalDiscountPercent
    ) &&
    backendTotalDiscountPercent >
      0
      ? Math.round(
          backendTotalDiscountPercent
        )
      : displayOriginalPrice !=
            null &&
          sellingPrice !=
            null &&
          displayOriginalPrice >
            sellingPrice
        ? Math.round(
            (
              (
                displayOriginalPrice -
                sellingPrice
              ) /
              displayOriginalPrice
            ) *
              100
          )
        : null;

  const hasDiscount =
    Number.isFinite(
      totalDiscountAmount
    ) &&
    totalDiscountAmount >
      0;

  /*
  |--------------------------------------------------------------------------
  | Product URL
  |--------------------------------------------------------------------------
  */

  const productUrl =
    product.productUrl ||
    `/products/${product.slug}`;

  /*
  |--------------------------------------------------------------------------
  | Wishlist
  |--------------------------------------------------------------------------
  */

  const toggleWishlist =
    () => {
      dispatch(
        toggleWishlistItem({
          productId:
            product.id,

          productSlug:
            product.slug,

          productName:
            product.name,

          productType:
            product.productType,

          imageUrl,

          brandName:
            product.brand
              ?.name ||
            null,

          categoryName:
            product
              .primaryCategory
              ?.name ||
            null,

          variantId:
            product
              .defaultVariant
              ?.id ||
            null,

          /*
           * SKU stays available internally.
           * It is not rendered on the card.
           */
          sku:
            product
              .defaultVariant
              ?.sku ||
            null,

          unitPrice:
            product.price
              ?.sellingPrice ??
            null,

          compareAtPrice:
            product.price
              ?.compareAtPrice ??
            null,

          currencyCode,

          taxPercent:
            product.taxPercent ||
            0,

          isTaxInclusive:
            product.price
              ?.isTaxInclusive !==
            false,

          addedAt:
            new Date()
              .toISOString(),
        })
      );

      if (
        !isWishlisted
      ) {
        void trackStorefrontActivity({
          activityType:
            "ADD_TO_WISHLIST",

          productId:
            product.id,

          variantId:
            product
              .defaultVariant
              ?.id ||
            null,

          categoryId:
            product
              .primaryCategory
              ?.id ||
            null,

          brandId:
            product.brand
              ?.id ||
            null,

          source:
            "PRODUCT_CARD",
        });
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Add To Cart
  |--------------------------------------------------------------------------
  */

  const addToCart =
    () => {
      setQuickAddOpen(
        true
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Can Add
  |--------------------------------------------------------------------------
  */

  const canAddToCart =
    Boolean(
      product
        .defaultVariant
        ?.id
    ) &&
    product.price
      ?.sellingPrice !=
      null &&
    product.availability
      ?.status !==
      "OUT_OF_STOCK";

  /*
  |--------------------------------------------------------------------------
  | Variant Summary
  |--------------------------------------------------------------------------
  */

  const variantSummary =
    product.variantSummary;

  const selectors =
    variantSummary
      ?.selectors ||
    [];

  const colorSelector =
    selectors.find(
      (selector) =>
        selector.code
          ?.toUpperCase() ===
        "COLOR"
    );

  const nonColorSelectors =
    selectors.filter(
      (selector) =>
        selector.code
          ?.toUpperCase() !==
        "COLOR"
    );

  /*
  |--------------------------------------------------------------------------
  | Delivery Eligibility
  |--------------------------------------------------------------------------
  */

  const {
    eligibility:
      deliveryEligibility,
  } =
    useProductDeliveryEligibility({
      productVariantId:
        product.defaultVariant
          ?.id,

      quantity:
        1,
    });

  const showDubaiSharjahExpress =
    deliveryEligibility
      ?.dubaiSharjah
      ?.eligible ===
    true;

  const showAbuDhabiExpress =
    deliveryEligibility
      ?.abuDhabi
      ?.eligible ===
    true;

  const showDeliveryBadge =
    showDubaiSharjahExpress ||
    showAbuDhabiExpress;

  /*
   * Delivery badge gets the top-left slot.
   * Otherwise show discount badge there.
   */
  const showDiscountBadge =
    hasDiscount;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <article
        className="
          group
          relative
          flex
          min-h-[390px]
          min-w-0
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[#D8DDE3]
          bg-white
          transition
          duration-200
          hover:-translate-y-0.5
          hover:shadow-md

        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Reserved Badge Row
        |--------------------------------------------------------------------------
        */}

        <div
          className={[
            "relative shrink-0",
            showDeliveryBadge &&
            showDiscountBadge
              ? "h-[58px]"
              : "h-[42px]",
          ].join(" ")}
        >
          {/*
          |--------------------------------------------------------------------------
          | Express Delivery
          |--------------------------------------------------------------------------
          */}

          {showDeliveryBadge ? (
            <div className="absolute left-0 top-0 z-30">
              {showDubaiSharjahExpress ? (
                <div className="inline-flex h-[27px] items-center gap-1.5 rounded-br-lg bg-[#138C83] px-2.5 text-[9px] font-bold leading-none text-white shadow-sm">
                  <Zap
                    size={
                      11
                    }
                    strokeWidth={
                      2.5
                    }
                    className="shrink-0"
                  />

                  <span className="whitespace-nowrap">
                    2-Hour Delivery
                    DXB/SHJ
                  </span>
                </div>
              ) : showAbuDhabiExpress ? (
                <div className="inline-flex h-[27px] items-center gap-1.5 rounded-br-lg bg-[#138C83] px-2.5 text-[9px] font-bold leading-none text-white shadow-sm">
                  <Zap
                    size={
                      11
                    }
                    strokeWidth={
                      2.5
                    }
                    className="shrink-0"
                  />

                  <span className="whitespace-nowrap">
                    1-Hour Delivery AUH
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Discount Badge
          |--------------------------------------------------------------------------
          |
          | Example:
          | AED 771.00 OFF (34%)
          |--------------------------------------------------------------------------
          */}

          {showDiscountBadge ? (
            <div
              className={[
                "absolute left-2.5 z-30",
                showDeliveryBadge
                  ? "top-[31px]"
                  : "top-1.5",
              ].join(" ")}
            >
              <span className="inline-flex h-[23px] items-center gap-1 whitespace-nowrap rounded-full bg-[#E52E3A] px-2.5 text-[9px] font-bold leading-none text-white shadow-sm">
                <Tag
                  size={
                    10
                  }
                  strokeWidth={
                    2.5
                  }
                  className="shrink-0"
                />

                <StorefrontMoney
                  amount={
                    totalDiscountAmount
                  }
                  currencyCode={
                    currencyCode
                  }
                  className="inline text-[9px] font-bold text-white"
                  symbolClassName="h-[0.66em]"
                />

                <span>
                  OFF
                </span>

                {discountPercentage !=
                null ? (
                  <span>
                    (
                    {
                      discountPercentage
                    }
                    %)
                  </span>
                ) : null}
              </span>
            </div>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Featured
          |--------------------------------------------------------------------------
          */}

          {product.isFeatured ? (
            <span className="absolute right-12 top-1.5 z-20 rounded-full bg-storefront-primary px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-white">
              Featured
            </span>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Wishlist
          |--------------------------------------------------------------------------
          */}

          {showWishlist ? (
            <button
              type="button"
              onClick={
                toggleWishlist
              }
              aria-pressed={
                isWishlisted
              }
              aria-label={
                isWishlisted
                  ? `Remove ${product.name} from wishlist`
                  : `Add ${product.name} to wishlist`
              }
              className={[
                "absolute right-2 top-1 z-40 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition",

                isWishlisted
                  ? "border-storefront-primary bg-storefront-primary text-white"
                  : "border-black/10 bg-white/95 text-storefront-text hover:bg-storefront-primary hover:text-white",
              ].join(
                " "
              )}
            >
              <Heart
                size={
                  15
                }
                fill={
                  isWishlisted
                    ? "currentColor"
                    : "none"
                }
              />
            </button>
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Product Image
        |--------------------------------------------------------------------------
        */}

        <Link
          href={
            productUrl
          }
          className="
            relative
            flex
            h-[125px]
            shrink-0
            items-center
            justify-center
            overflow-hidden
            bg-white

            sm:h-[130px]
            lg:h-[135px]
          "
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                imageUrl
              }
              alt={
                product.image
                  ?.altText ||
                product.name
              }
              className="
                h-full
                w-full
                object-contain
                p-2
                transition
                duration-300
                group-hover:scale-[1.03]
              "
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-storefront-secondary">
              <ImageIcon
                size={
                  28
                }
                className="text-storefront-muted"
              />
            </div>
          )}
        </Link>

        {/*
        |--------------------------------------------------------------------------
        | Product Information
        |--------------------------------------------------------------------------
        */}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3 pb-3 pt-1">
          {/*
          |--------------------------------------------------------------------------
          | Brand
          |--------------------------------------------------------------------------
          |
          | Fixed reserved height so it never gets squeezed.
          |--------------------------------------------------------------------------
          */}

          <div className="h-[14px] shrink-0">
            {showBrand &&
            product.brand
              ?.name ? (
              <p className="truncate text-[9px] font-bold uppercase leading-[12px] tracking-[0.11em] text-storefront-muted">
                {
                  product.brand
                    .name
                }
              </p>
            ) : null}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Product Title
          |--------------------------------------------------------------------------
          */}

          <Link
            href={
              productUrl
            }
            className="
              mt-0.5
              line-clamp-2
              min-h-[30px]
              break-words
              text-[11px]
              font-bold
              leading-[15px]
              text-storefront-text
              transition
              hover:text-storefront-primary
            "
          >
            {
              product.name
            }
          </Link>

          {/*
          |--------------------------------------------------------------------------
          | Variant Options
          |--------------------------------------------------------------------------
          */}

          <div className="shrink-0">
            {variantSummary ? (
              <div className="mt-0.5">
                {colorSelector &&
                colorSelector
                  .options
                  .length >
                  0 &&
                colorSelector
                  .optionCount >
                  1 ? (
                  <div className="flex items-center gap-1">
                    {colorSelector.options
                      .slice(
                        0,
                        4
                      )
                      .map(
                        (
                          option
                        ) => (
                          <span
                            key={
                              option.id
                            }
                            title={
                              option.label
                            }
                            className="h-3.5 w-3.5 rounded-full border border-black/15 shadow-sm"
                            style={{
                              backgroundColor:
                                option.swatchValue ||
                                "#f3f4f6",
                            }}
                          />
                        )
                      )}

                    {colorSelector
                      .options
                      .length >
                    4 ? (
                      <span className="text-[9px] font-bold text-storefront-muted">
                        +
                        {colorSelector
                          .options
                          .length -
                          4}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {variantSummary.hasVariants ? (
                  <p className="mt-0.5 truncate text-[8px] font-medium text-storefront-muted">
                    {[
                      colorSelector &&
                      colorSelector.optionCount >
                        1
                        ? `${colorSelector.optionCount} colours`
                        : null,

                      ...nonColorSelectors
                        .filter(
                          (
                            selector
                          ) =>
                            selector.optionCount >
                            1
                        )
                        .map(
                          (
                            selector
                          ) =>
                            `${selector.optionCount} ${selector.name.toLowerCase()}`
                        ),
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " · "
                      )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Price + Add To Cart
          |--------------------------------------------------------------------------
          */}

          <div className="mt-auto pt-2">
            {showPrice ? (
              sellingPrice !=
              null ? (
                <div>
                  <div className="flex flex-wrap items-baseline gap-1.5">
                    <StorefrontMoney
                      amount={
                        sellingPrice
                      }
                      currencyCode={
                        currencyCode
                      }
                      className="text-[16px] font-bold leading-none text-storefront-text"
                    />

                    {hasDiscount &&
                    displayOriginalPrice !=
                      null ? (
                      <StorefrontMoney
                        amount={
                          displayOriginalPrice
                        }
                        currencyCode={
                          currencyCode
                        }
                        className="text-[9px] text-storefront-muted line-through"
                        symbolClassName="h-[0.7em]"
                      />
                    ) : null}
                  </div>

                  <p className="mt-0.5 text-[8px] leading-3 text-storefront-muted">
                    {product.price
                      ?.isTaxInclusive
                      ? "VAT included"
                      : "VAT calculated at checkout"}
                  </p>
                </div>
              ) : (
                <p className="text-xs font-semibold text-storefront-muted">
                  Price unavailable
                </p>
              )
            ) : null}

            {showAddToCart ? (
              <button
                type="button"
                disabled={
                  !canAddToCart
                }
                onClick={
                  addToCart
                }
                className="
                  mt-1
                  flex
                  h-9
                  w-full
                  min-w-0
                  items-center
                  justify-center
                  gap-1.5
                  overflow-hidden
                  rounded-lg
                  bg-storefront-primary
                  px-3
                  text-[11px]
                  font-bold
                  leading-none
                  text-white
                  whitespace-nowrap
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <ShoppingCart
                  size={
                    14
                  }
                  className="shrink-0"
                />

                <span>
                  Add to cart
                </span>
              </button>
            ) : null}
          </div>
        </div>
      </article>

      {/*
      |--------------------------------------------------------------------------
      | Quick Add Modal
      |--------------------------------------------------------------------------
      */}

      <ProductQuickAddModal
        product={
          product
        }
        open={
          quickAddOpen
        }
        onClose={() =>
          setQuickAddOpen(
            false
          )
        }
      />
    </>
  );
}