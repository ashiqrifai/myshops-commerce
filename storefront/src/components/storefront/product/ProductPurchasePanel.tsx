"use client";

import Link from "next/link";

import {
  BadgeCheck,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  WalletCards,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import ProductGallery from "./ProductGallery";
import ExtendedWarrantyDrawer from "./ExtendedWarrantyDrawer";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  addItem,
  setItemExtendedWarranty,
} from "@/store/slices/cartSlice";

import {
  makeSelectIsProductWishlisted,
  toggleWishlistItem,
} from "@/store/slices/wishlistSlice";

import {
  addRecentlyViewed,
} from "@/store/slices/recentlyViewedSlice";

import type {
  CartItem,
} from "@/store/slices/cartSlice";

import type {
  PublicProductData,
  PublicProductImage,
  PublicProductVariant,
} from "@/types/publicProduct";

const money = (
  value:
    | number
    | null
    | undefined,
  currencyCode = "AED"
) => {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-AE",
    {
      style: "currency",
      currency:
        currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(Number(value));
};

const getImageUrl = (
  image:
    | PublicProductImage
    | undefined
) => {
  const asset =
    image?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "SMALL" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.isPrimary &&
        variant.publicUrl
    );

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

const variantMatches = (
  variant:
    PublicProductVariant,
  selections:
    Record<string, string>
) =>
  Object.entries(
    selections
  ).every(
    ([
      attributeId,
      optionId,
    ]) =>
      variant.attributes.some(
        (value) =>
          value.attributeId ===
            attributeId &&
          (value.option?.id ||
            value.optionId ||
            value.displayValue) ===
            optionId
      )
  );

export default function ProductPurchasePanel({
  data,
}: {
  data:
    PublicProductData;
}) {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

  const {
    product,
  } = data;

  const wishlistSelector =
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
      wishlistSelector
    );

  const initialVariant =
    product.variants.find(
      (variant) =>
        variant.id ===
        product.defaultVariantId
    ) ||
    product.variants[0];

  const initialSelections =
    Object.fromEntries(
      initialVariant.attributes
        .filter(
          (value) =>
            value.attribute
              ?.isVariantDefining
        )
        .map((value) => [
          value.attributeId,
          value.option?.id ||
            value.optionId ||
            value.displayValue ||
            "",
        ])
    );

  const [
    selections,
    setSelections,
  ] =
    useState<
      Record<string, string>
    >(
      initialSelections
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  const [
    addedMessage,
    setAddedMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    warrantyDrawerOpen,
    setWarrantyDrawerOpen,
  ] =
    useState(false);

  const [
    pendingCartItem,
    setPendingCartItem,
  ] =
    useState<CartItem | null>(
      null
    );

  const selectedVariant =
    useMemo(
      () =>
        product.variants.find(
          (variant) =>
            variantMatches(
              variant,
              selections
            )
        ) ||
        initialVariant,
      [
        product.variants,
        selections,
        initialVariant,
      ]
    );

    const gallery = useMemo(() => {
      const variantImages =
        Array.isArray(
          selectedVariant.images
        )
          ? selectedVariant.images
          : [];
    
      const productImages =
        Array.isArray(
          product.gallery
        )
          ? product.gallery
          : [];
    
      return variantImages.length
        ? [...variantImages].sort(
            (first, second) =>
              Number(
                first.displayOrder || 0
              ) -
              Number(
                second.displayOrder || 0
              )
          )
        : [...productImages].sort(
            (first, second) =>
              Number(
                first.displayOrder || 0
              ) -
              Number(
                second.displayOrder || 0
              )
          );
    }, [
      selectedVariant.id,
      selectedVariant.images,
      product.gallery,
    ]);

  useEffect(
    () => {
      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

      dispatch(
        addRecentlyViewed({
          productId:
            product.id,

          productSlug:
            product.slug,

          productName:
            product.name,

          productType:
            product.productType,

          variantId:
            selectedVariant.id,

          variantName:
            selectedVariant.name,

          sku:
            selectedVariant.sku,

          imageUrl:
            getImageUrl(
              image
            ),

          brandName:
            product.brand
              ?.name ||
            null,

          categoryName:
            product
              .primaryCategory
              ?.name ||
            null,

          unitPrice:
            selectedVariant
              .price
              ?.sellingPrice ===
              null ||
            selectedVariant
              .price
              ?.sellingPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .sellingPrice
                ),

          compareAtPrice:
            selectedVariant
              .price
              ?.compareAtPrice ===
              null ||
            selectedVariant
              .price
              ?.compareAtPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .compareAtPrice
                ),

          currencyCode:
            selectedVariant
              .price
              ?.currencyCode ||
            data.company
              .currency ||
            "AED",

          taxPercent:
            Number(
              product.taxPercent ||
              0
            ),

          isTaxInclusive:
            selectedVariant
              .price
              ?.isTaxInclusive !==
            false,

          viewedAt:
            new Date()
              .toISOString(),
        })
      );
    },
    [
      dispatch,
      product.id,
      product.slug,
      product.name,
      product.productType,
      product.brand
        ?.name,
      product
        .primaryCategory
        ?.name,
      product.taxPercent,
      product.gallery,
      selectedVariant.id,
      selectedVariant.name,
      selectedVariant.sku,
      selectedVariant.images,
      selectedVariant.price,
      data.company
        .currency,
    ]
  );

  const currencyCode =
    selectedVariant.price
      ?.currencyCode ||
    data.company.currency ||
    "AED";

  const sellingPrice =
    money(
      selectedVariant.price
        ?.sellingPrice,
      currencyCode
    );

  const compareAtPrice =
    money(
      selectedVariant.price
        ?.compareAtPrice,
      currencyCode
    );

  const hasDiscount =
    selectedVariant.price
      ?.compareAtPrice !==
      null &&
    selectedVariant.price
      ?.compareAtPrice !==
      undefined &&
    Number(
      selectedVariant.price
        .compareAtPrice
    ) >
      Number(
        selectedVariant.price
          .sellingPrice
      );

  const discountAmount =
    hasDiscount
      ? Number(
          selectedVariant.price
            ?.compareAtPrice ||
            0
        ) -
        Number(
          selectedVariant.price
            ?.sellingPrice ||
            0
        )
      : 0;

  const numericSellingPrice =
    Number(
      selectedVariant.price
        ?.sellingPrice ||
        0
    );

  const tabbyFourPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            4
        )
      : 0;

  const tabbyTwelvePayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            12
        )
      : 0;

  const tamaraFourPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            4
        )
      : 0;

  const tamaraMonthlyPayment =
    numericSellingPrice > 0
      ? Math.round(
          numericSellingPrice /
            12
        )
      : 0;

  const availabilityMessage =
    selectedVariant
      .availability
      .message ||
    "Available to order";

  const isUnavailable =
    /out of stock|unavailable/i.test(
      availabilityMessage
    );

  const selectOption = (
    attributeId: string,
    optionId: string
  ) => {
    const next = {
      ...selections,
      [attributeId]:
        optionId,
    };

    const exact =
      product.variants.find(
        (variant) =>
          variantMatches(
            variant,
            next
          )
      );

    if (exact) {
      setSelections(
        Object.fromEntries(
          exact.attributes
            .filter(
              (value) =>
                value.attribute
                  ?.isVariantDefining
            )
            .map((value) => [
              value.attributeId,
              value.option?.id ||
                value.optionId ||
                value.displayValue ||
                "",
            ])
        )
      );

      return;
    }

    setSelections(next);
  };

  const buildCartItem =
    (): CartItem | null => {
      const price =
        selectedVariant.price;

      if (
        !price ||
        !Number.isFinite(
          Number(
            price.sellingPrice
          )
        )
      ) {
        return null;
      }

      const selectedAttributes =
        selectedVariant.attributes
          .filter(
            (value) =>
              value.attribute
                ?.isVariantDefining
          )
          .map((value) => ({
            attributeId:
              value.attributeId,

            attributeName:
              value.attribute
                ?.name ||
              "Option",

            optionId:
              value.option?.id ||
              value.optionId ||
              value.displayValue ||
              "",

            optionLabel:
              value.option
                ?.label ||
              value.displayValue ||
              "",

            swatchValue:
              value.option
                ?.swatchValue ||
              null,
          }));

      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

      return {
        key:
          `${product.id}:${selectedVariant.id}`,

        productId:
          product.id,

        productSlug:
          product.slug,

        productName:
          product.name,

        variantId:
          selectedVariant.id,

        sku:
          selectedVariant.sku,

        imageUrl:
          getImageUrl(
            image
          ),

        unitPrice:
          Number(
            price.sellingPrice
          ),

        compareAtPrice:
          price.compareAtPrice ===
            null ||
          price.compareAtPrice ===
            undefined
            ? null
            : Number(
                price.compareAtPrice
              ),

        currencyCode:
          price.currencyCode ||
          currencyCode,

        taxPercent:
          Number(
            product.taxPercent ||
              0
          ),

        isTaxInclusive:
          price.isTaxInclusive,

        quantity,

        selectedAttributes,
      };
    };

  const addToCart = (
    buyNow = false
  ) => {
    if (
      isUnavailable
    ) {
      setAddedMessage(
        "This selected variant is currently unavailable."
      );

      return;
    }

    const cartItem =
      buildCartItem();

    if (!cartItem) {
      setAddedMessage(
        "This variant does not have a valid price."
      );

      return;
    }

    dispatch(
      addItem(cartItem)
    );

    if (buyNow) {
      router.push(
        "/cart"
      );

      return;
    }

    setPendingCartItem(
      cartItem
    );

    setWarrantyDrawerOpen(
      true
    );

    setAddedMessage(
      `${product.name} added to your cart.`
    );
  };


  const toggleWishlist =
    () => {
      const image =
        selectedVariant
          .images[0] ||
        product.gallery[0];

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

          imageUrl:
            getImageUrl(
              image
            ),

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
            selectedVariant.id,

          sku:
            selectedVariant.sku,

          unitPrice:
            selectedVariant
              .price
              ?.sellingPrice ===
              null ||
            selectedVariant
              .price
              ?.sellingPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .sellingPrice
                ),

          compareAtPrice:
            selectedVariant
              .price
              ?.compareAtPrice ===
              null ||
            selectedVariant
              .price
              ?.compareAtPrice ===
              undefined
              ? null
              : Number(
                  selectedVariant
                    .price
                    .compareAtPrice
                ),

          currencyCode,

          taxPercent:
            Number(
              product.taxPercent ||
              0
            ),

          isTaxInclusive:
            selectedVariant
              .price
              ?.isTaxInclusive !==
            false,

          addedAt:
            new Date()
              .toISOString(),
        })
      );
    };

  return (
    <>
    <section className="grid gap-8 md:grid-cols-2 xl:grid-cols-[minmax(0,1.06fr)_minmax(360px,0.9fr)_330px]">
      <div className="md:col-start-1 md:row-start-1 xl:col-auto xl:row-auto">
      <ProductGallery
        key={selectedVariant.id}
        images={gallery}
        productName={product.name}
        variantName={
          selectedVariant.name
        }
        isWishlisted={
          isWishlisted
        }
        onToggleWishlist={
          toggleWishlist
        }
      />
        
      </div>

      <div className="min-w-0 py-1 md:col-start-2 md:row-start-1 xl:col-auto xl:row-auto">
        {product.brand ? (
          <Link
            href={`/brand/${product.brand.slug}`}
            className="inline-block text-2xl font-black uppercase tracking-tight text-storefront-primary"
          >
            {
              product.brand
                .name
            }
          </Link>
        ) : null}

        <h1 className="mt-2 text-3xl font-black tracking-tight text-storefront-text sm:text-4xl">
          {product.name}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-black tracking-wide text-amber-500">
            ★★★★★
          </span>

          <span className="text-storefront-muted">
            4.9 (1,250 reviews)
          </span>

          <span className="text-storefront-muted">
            |
          </span>

          <span className="text-storefront-muted">
            145 Questions answered
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-end gap-3">
          {sellingPrice ? (
            <span className="text-4xl font-black text-storefront-text">
              {sellingPrice}
            </span>
          ) : (
            <span className="text-xl font-black text-storefront-text">
              Price unavailable
            </span>
          )}

          {hasDiscount &&
          compareAtPrice ? (
            <>
              <span className="pb-1 text-lg font-bold text-storefront-muted line-through">
                {
                  compareAtPrice
                }
              </span>

              <span className="rounded-lg bg-red-500 px-3 py-1.5 text-sm font-black text-white">
                Save{" "}
                {money(
                  discountAmount,
                  currencyCode
                )}
              </span>
            </>
          ) : null}
        </div>

        <p className="mt-3 text-sm font-bold text-storefront-muted">
          {selectedVariant
            .price
            ?.isTaxInclusive
            ? "All prices include VAT"
            : "VAT calculated at checkout"}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <span
            className={[
              "inline-flex items-center gap-2 font-black",
              isUnavailable
                ? "text-red-600"
                : "text-emerald-700",
            ].join(
              " "
            )}
          >
            <span
              className={[
                "h-3 w-3 rounded-full",
                isUnavailable
                  ? "bg-red-600"
                  : "bg-emerald-600",
              ].join(
                " "
              )}
            />

            {
              availabilityMessage
            }
          </span>

          <Link
            href="#related-products"
            className="font-black text-indigo-700 underline"
          >
            Related Products
          </Link>
        </div>

        {product.shortDescription ? (
          <p className="mt-5 text-sm leading-7 text-storefront-muted">
            {
              product.shortDescription
            }
          </p>
        ) : null}

        <div className="mt-8 space-y-7">
          {product.variantSelectors.map(
            (selector) => (
              <div
                key={selector.id}
              >
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-base font-black text-storefront-text">
                    {
                      selector.name
                    }:
                  </h2>

                  <span className="text-sm font-bold text-storefront-muted">
                    {
                      selector.options.find(
                        (option) =>
                          option.id ===
                          selections[
                            selector.id
                          ]
                      )?.label
                    }
                  </span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {selector.options.map(
                    (option) => {
                      const selected =
                        selections[
                          selector.id
                        ] ===
                        option.id;

                      return (
                        <button
                          key={
                            option.id
                          }
                          type="button"
                          onClick={() =>
                            selectOption(
                              selector.id,
                              option.id
                            )
                          }
                          className={[
                            "inline-flex min-h-14 min-w-24 items-center justify-center gap-3 rounded-xl border px-5 text-sm font-black transition",
                            selected
                              ? "border-storefront-primary bg-storefront-secondary text-storefront-text ring-1 ring-storefront-primary"
                              : "border-storefront bg-white text-storefront-muted hover:border-storefront-primary",
                          ].join(
                            " "
                          )}
                        >
                          {option.swatchValue ? (
                            <span
                              className="h-6 w-6 rounded-full border border-black/10"
                              style={{
                                backgroundColor:
                                  option.swatchValue,
                              }}
                            />
                          ) : null}

                          {
                            option.label
                          }
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="text-sm font-black text-storefront-text">
            Quantity:
          </span>

          <div className="flex h-12 items-center rounded-xl border border-storefront bg-white">
            <button
              type="button"
              onClick={() =>
                setQuantity(
                  Math.max(
                    1,
                    quantity - 1
                  )
                )
              }
              className="flex h-full w-12 items-center justify-center"
              aria-label="Decrease quantity"
            >
              <Minus
                size={17}
              />
            </button>

            <span className="min-w-10 text-center text-base font-black">
              {quantity}
            </span>

            <button
              type="button"
              onClick={() =>
                setQuantity(
                  quantity + 1
                )
              }
              className="flex h-full w-12 items-center justify-center"
              aria-label="Increase quantity"
            >
              <Plus
                size={17}
              />
            </button>
          </div>
        </div>

      </div>

      <div className="md:col-span-2 xl:col-span-1 xl:col-start-3 xl:row-start-1">
        <div className="rounded-[24px] border border-storefront bg-white p-5 shadow-sm xl:sticky xl:top-6">
          <div>
            <p className="text-base font-black text-storefront-text">
              Flexible payment options
            </p>

            <p className="mt-1 text-xs leading-5 text-storefront-muted">
              Select your preferred payment option during checkout.
            </p>
          </div>

          {numericSellingPrice > 0 ? (
            <div className="mt-5 space-y-3">
              <div
                data-provider="tabby"
                className="rounded-2xl border border-storefront bg-storefront-secondary/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-storefront-text">
                      Tabby
                    </p>

                    <p className="mt-1 text-xs leading-5 text-storefront-muted">
                      4 payments of approximately{" "}
                      <strong className="text-storefront-text">
                        {money(
                          tabbyFourPayment,
                          currencyCode
                        )}
                      </strong>
                      , or monthly plans from approximately{" "}
                      <strong className="text-storefront-text">
                        {money(
                          tabbyTwelvePayment,
                          currencyCode
                        )}
                      </strong>
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 text-xs font-black text-storefront-primary underline"
                  >
                    Learn more
                  </button>
                </div>
              </div>

              <div
                data-provider="tamara"
                className="rounded-2xl border border-storefront bg-storefront-secondary/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-storefront-text">
                      Tamara
                    </p>

                    <p className="mt-1 text-xs leading-5 text-storefront-muted">
                      4 payments of approximately{" "}
                      <strong className="text-storefront-text">
                        {money(
                          tamaraFourPayment,
                          currencyCode
                        )}
                      </strong>
                      , or monthly plans from approximately{" "}
                      <strong className="text-storefront-text">
                        {money(
                          tamaraMonthlyPayment,
                          currencyCode
                        )}
                      </strong>
                      .
                    </p>
                  </div>

                  <button
                    type="button"
                    className="shrink-0 text-xs font-black text-storefront-primary underline"
                  >
                    More options
                  </button>
                </div>
              </div>

              <p className="text-[10px] leading-4 text-storefront-muted">
                Plans are subject to provider eligibility and final approval at checkout.
              </p>
            </div>
          ) : null}

          <div className="my-5 border-t border-storefront" />

          <div className="space-y-4">
            {[
              {
                icon:
                  BadgeCheck,
                text:
                  product.warrantyText ||
                  "Official warranty",
              },
              {
                icon: Truck,
                text:
                  "UAE delivery options shown at checkout",
              },
              {
                icon:
                  RotateCcw,
                text:
                  "Easy returns support",
              },
              {
                icon:
                  WalletCards,
                text:
                  "Secure payment",
              },
            ].map(
              (item) => (
                <div
                  key={
                    item.text
                  }
                  className="flex items-center gap-3 text-sm font-semibold text-storefront-text"
                >
                  <item.icon
                    size={20}
                    className="shrink-0 text-storefront-primary"
                  />

                  {
                    item.text
                  }
                </div>
              )
            )}
          </div>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(
                false
              )
            }
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-storefront-primary px-5 text-base font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart
              size={21}
            />

            {isUnavailable
              ? "Unavailable"
              : "Add to Cart"}
          </button>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(true)
            }
            className="mt-3 h-12 w-full rounded-xl border-2 border-storefront-primary bg-white text-sm font-black text-storefront-primary transition hover:bg-storefront-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>

          <button
            type="button"
            onClick={
              toggleWishlist
            }
            aria-pressed={
              isWishlisted
            }
            className={[
              "mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-bold transition",
              isWishlisted
                ? "border-storefront-primary bg-storefront-primary text-white"
                : "border-storefront bg-white text-storefront-text hover:border-storefront-primary hover:text-storefront-primary",
            ].join(
              " "
            )}
          >
            <Heart
              size={17}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />

            {isWishlisted
              ? "Remove from wishlist"
              : "Add to wishlist"}
          </button>

          {addedMessage ? (
            <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
              {
                addedMessage
              }
            </p>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-storefront bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-lg grid-cols-[1fr_1fr_auto] gap-2">
          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(
                false
              )
            }
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-storefront-primary px-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart
              size={17}
            />

            {isUnavailable
              ? "Unavailable"
              : "Add to Cart"}
          </button>

          <button
            type="button"
            disabled={
              isUnavailable
            }
            onClick={() =>
              addToCart(true)
            }
            className="h-12 rounded-xl border-2 border-storefront-primary bg-white px-3 text-xs font-black text-storefront-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Buy now
          </button>

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
                ? "Remove from wishlist"
                : "Add to wishlist"
            }
            className={[
              "flex h-12 w-12 items-center justify-center rounded-xl border transition",
              isWishlisted
                ? "border-storefront-primary bg-storefront-primary text-white"
                : "border-storefront bg-white text-storefront-text",
            ].join(
              " "
            )}
          >
            <Heart
              size={18}
              fill={
                isWishlisted
                  ? "currentColor"
                  : "none"
              }
            />
          </button>
        </div>
      </div>
    </section>

    <ExtendedWarrantyDrawer
      open={
        warrantyDrawerOpen
      }
      onClose={() =>
        setWarrantyDrawerOpen(
          false
        )
      }
      onContinueWithoutWarranty={() => {
        setWarrantyDrawerOpen(
          false
        );

        router.push(
          "/cart"
        );
      }}
      productId={
        product.id
      }
      variantId={
        selectedVariant.id
      }
      productName={
        product.name
      }
      imageUrl={
        pendingCartItem
          ?.imageUrl ||
        getImageUrl(
          gallery[0]
        )
      }
      productPrice={
        Number(
          selectedVariant.price
            ?.sellingPrice ||
            0
        )
      }
      currencyCode={
        currencyCode
      }
      quantity={
        quantity
      }
      onWarrantyAdded={(plan) => {
        if (
          !pendingCartItem
        ) {
          return;
        }

        dispatch(
          setItemExtendedWarranty({
            key:
              pendingCartItem.key,

            warranty: {
              code:
                plan.code,

              periodYears:
                plan.periodYears,

              percentage:
                plan.percentage,

              unitPrice:
                plan.unitPrice,

              currencyCode:
                plan.currencyCode,
            },
          })
        );

        setWarrantyDrawerOpen(
          false
        );

        router.push(
          "/cart"
        );
      }}
    />
    </>
  );
}
