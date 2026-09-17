"use client";

import {
  Check,
  ImageIcon,
  LoaderCircle,
  ShoppingCart,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAppDispatch,
} from "@/store/hooks";

import {
  addItem,
} from "@/store/slices/cartSlice";

import {
  trackStorefrontActivity,
} from "@/lib/storefront/storefront-activity-api";

import type {
  PublicProductApiResponse,
  PublicProductImage,
  PublicProductVariant,
} from "@/types/publicProduct";

import type {
  StorefrontProduct,
} from "@/types/storefront";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

interface ProductQuickAddModalProps {
  product:
    StorefrontProduct;

  open:
    boolean;

  onClose:
    () => void;
}

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Money
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Product Image
|--------------------------------------------------------------------------
*/

function getImageUrl(
  image:
    PublicProductImage |
    undefined
): string | null {
  const asset =
    image?.mediaAsset;

  if (
    !asset
  ) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "MEDIUM" &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "SMALL" &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    asset.variants?.find(
      (
        variant
      ) =>
        variant.variantType ===
          "THUMBNAIL" &&
        Boolean(
          variant.publicUrl
        )
    );

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
}

/*
|--------------------------------------------------------------------------
| Variant Match
|--------------------------------------------------------------------------
*/

function variantMatches(
  variant:
    PublicProductVariant,

  selections:
    Record<
      string,
      string
    >
) {
  return Object.entries(
    selections
  ).every(
    ([
      attributeId,
      optionId,
    ]) =>
      variant.attributes.some(
        (
          value
        ) =>
          value.attributeId ===
            attributeId &&
          (
            value.option?.id ||
            value.optionId ||
            value.displayValue
          ) ===
            optionId
      )
  );
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function ProductQuickAddModal({
  product:
    cardProduct,

  open,

  onClose,
}: ProductQuickAddModalProps) {
  const dispatch =
    useAppDispatch();

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    productData,
    setProductData,
  ] =
    useState<
      PublicProductApiResponse["data"] |
      null
    >(
      null
    );

  const [
    selections,
    setSelections,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {}
    );

  const [
    quantity,
    setQuantity,
  ] =
    useState(
      1
    );

  const autoAddedRef =
    useRef(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !open
      ) {
        setProductData(
          null
        );

        setSelections(
          {}
        );

        setQuantity(
          1
        );

        setError(
          null
        );

        autoAddedRef.current =
          false;
      }
    },
    [
      open,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Escape
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const handleKeyDown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            onClose();
          }
        };

      window.addEventListener(
        "keydown",
        handleKeyDown
      );

      return () =>
        window.removeEventListener(
          "keydown",
          handleKeyDown
        );
    },
    [
      open,
      onClose,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Load Full Product
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const controller =
        new AbortController();

      const load =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              null
            );

            const normalizedSlug =
              decodeURIComponent(
                cardProduct.slug
              )
                .trim()
                .replace(
                  /^\/+|\/+$/g,
                  ""
                )
                .toLowerCase();

            const response =
              await fetch(
                `${API_URL}/public/storefront/products/${encodeURIComponent(
                  normalizedSlug
                )}?channel=WEBSITE`,
                {
                  method:
                    "GET",

                  headers: {
                    Accept:
                      "application/json",

                    "x-company-code":
                      COMPANY_CODE,
                  },

                  cache:
                    "no-store",

                  signal:
                    controller.signal,
                }
              );

            const payload =
              (
                await response
                  .json()
              ) as
                PublicProductApiResponse;

            if (
              !response.ok ||
              !payload.success ||
              !payload.data
            ) {
              throw new Error(
                "Unable to load product options."
              );
            }

            if (
              controller.signal
                .aborted
            ) {
              return;
            }

            setProductData(
              payload.data
            );

            const detailProduct =
              payload.data
                .product;

            const initialVariant =
              detailProduct.variants.find(
                (
                  variant
                ) =>
                  variant.id ===
                  detailProduct.defaultVariantId
              ) ||
              detailProduct.variants[0];

            if (
              initialVariant
            ) {
              setSelections(
                Object.fromEntries(
                  detailProduct.variantSelectors.map(
                    (
                      selector
                    ) => {
                      const matchingAttribute =
                        initialVariant.attributes.find(
                          (
                            value
                          ) =>
                            value.attributeId ===
                            selector.id
                        );

                      const selectedOptionId =
                        matchingAttribute
                          ?.option
                          ?.id ||
                        matchingAttribute
                          ?.optionId ||
                        matchingAttribute
                          ?.displayValue ||
                        selector.options[0]
                          ?.id ||
                        "";

                      return [
                        selector.id,
                        selectedOptionId,
                      ];
                    }
                  )
                )
              );
            }
          } catch (
            loadError
          ) {
            if (
              loadError instanceof
                DOMException &&
              loadError.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "[Quick Add]",
              loadError
            );

            setError(
              "Unable to load product options."
            );
          } finally {
            if (
              !controller.signal
                .aborted
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void load();

      return () => {
        controller.abort();
      };
    },
    [
      open,
      cardProduct.slug,
    ]
  );

  const detailProduct =
    productData
      ?.product ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Selected Variant
  |--------------------------------------------------------------------------
  */

  const selectedVariant =
    useMemo(
      () => {
        if (
          !detailProduct
        ) {
          return null;
        }

        return (
          detailProduct.variants.find(
            (
              variant
            ) =>
              variantMatches(
                variant,
                selections
              )
          ) ||
          detailProduct.variants.find(
            (
              variant
            ) =>
              variant.id ===
              detailProduct.defaultVariantId
          ) ||
          detailProduct.variants[0] ||
          null
        );
      },
      [
        detailProduct,
        selections,
      ]
    );

  const currencyCode =
    selectedVariant
      ?.price
      ?.currencyCode ||
    productData
      ?.company
      ?.currency ||
    cardProduct.price
      ?.currencyCode ||
    "AED";

  const selectedPrice =
    selectedVariant
      ?.price
      ?.sellingPrice;

   const selectedImage =
    selectedVariant
      ?.images?.[0] ||
    detailProduct
      ?.gallery?.[0];

  const imageUrl =
    selectedImage
      ? getImageUrl(
          selectedImage
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Availability
  |--------------------------------------------------------------------------
  */

 /*
|--------------------------------------------------------------------------
| Purchase Availability
|--------------------------------------------------------------------------
|
| Variant availability remains physical inventory.
| Always Available controls whether zero-stock variants can still be sold.
|--------------------------------------------------------------------------
*/

const alwaysAvailableForSale =
detailProduct
  ?.alwaysAvailableForSale ===
true;

const physicalAvailabilityMessage =
selectedVariant
  ?.availability
  ?.message ||
"";

const physicallyOutOfStock =
!selectedVariant ||
selectedVariant
  .availability
  ?.status ===
  "OUT_OF_STOCK" ||
/out of stock|unavailable/i.test(
  physicalAvailabilityMessage
);

const isUnavailable =
!selectedVariant ||
(
  !alwaysAvailableForSale &&
  physicallyOutOfStock
);

const availabilityMessage =
alwaysAvailableForSale &&
physicallyOutOfStock
  ? "Available to order"
  : (
      physicalAvailabilityMessage ||
      "Available to order"
    );

  /*
  |--------------------------------------------------------------------------
  | Select Option
  |--------------------------------------------------------------------------
  */

  const selectOption =
    (
      attributeId:
        string,

      optionId:
        string
    ) => {
      if (
        !detailProduct
      ) {
        return;
      }

      const next = {
        ...selections,

        [attributeId]:
          optionId,
      };

      const exactVariant =
        detailProduct.variants.find(
          (
            variant
          ) =>
            variantMatches(
              variant,
              next
            )
        );

      if (
        exactVariant
      ) {
        const normalizedSelections =
          Object.fromEntries(
            detailProduct.variantSelectors.map(
              (
                selector
              ) => {
                const attributeValue =
                  exactVariant.attributes.find(
                    (
                      value
                    ) =>
                      value.attributeId ===
                      selector.id
                  );

                return [
                  selector.id,

                  attributeValue
                    ?.option
                    ?.id ||
                  attributeValue
                    ?.optionId ||
                  attributeValue
                    ?.displayValue ||
                  next[
                    selector.id
                  ] ||
                  "",
                ];
              }
            )
          );

        setSelections(
          normalizedSelections
        );

        return;
      }

      setSelections(
        next
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Add Selected Variant
  |--------------------------------------------------------------------------
  */

  const addSelectedVariant =
    () => {
      if (
        !detailProduct ||
        !selectedVariant ||
        isUnavailable
      ) {
        return;
      }

      const unitPrice =
        Number(
          selectedVariant
            .price
            ?.sellingPrice
        );

      if (
        !Number.isFinite(
          unitPrice
        )
      ) {
        return;
      }

      const selectedAttributes =
        detailProduct.variantSelectors
          .map(
            (
              selector
            ) => {
              const selectedOptionId =
                selections[
                  selector.id
                ];

              const selectedOption =
                selector.options.find(
                  (
                    option
                  ) =>
                    option.id ===
                    selectedOptionId
                );

              if (
                !selectedOption
              ) {
                return null;
              }

              return {
                attributeId:
                  selector.id,

                attributeName:
                  selector.name,

                optionId:
                  selectedOption.id,

                optionLabel:
                  selectedOption.label,

                swatchValue:
                  selectedOption.swatchValue ||
                  null,
              };
            }
          )
          .filter(
            (
              value
            ): value is {
              attributeId:
                string;

              attributeName:
                string;

              optionId:
                string;

              optionLabel:
                string;

              swatchValue:
                string | null;
            } =>
              value !==
              null
          );

      dispatch(
        addItem({
          key:
            `${detailProduct.id}:${selectedVariant.id}:STANDARD`,

          productId:
            detailProduct.id,

          productSlug:
            detailProduct.slug,

          productName:
            detailProduct.name,

          variantId:
            selectedVariant.id,

          sku:
            selectedVariant.sku,

          imageUrl,

          unitPrice,

          compareAtPrice:
            selectedVariant
              .price
              ?.compareAtPrice ??
            null,

          /*
          |--------------------------------------------------------------------------
          | Gift Voucher / Combined Discount Pricing
          |--------------------------------------------------------------------------
          |
          | Preserve the authoritative product-detail pricing breakdown in the
          | cart. CartItemRow must not fall back to compareAtPrice when these
          | fields are available.
          |--------------------------------------------------------------------------
          */

          regularPrice:
            selectedVariant
              .price
              ?.regularPrice ??
            null,

          baseSellingPrice:
            selectedVariant
              .price
              ?.baseSellingPrice ??
            selectedVariant
              .price
              ?.sellingPrice ??
            null,

          priceDiscountAmount:
            selectedVariant
              .price
              ?.priceDiscountAmount ??
            null,

          giftVoucherDiscountAmount:
            selectedVariant
              .price
              ?.giftVoucherDiscountAmount ??
            null,

          totalDiscountAmount:
            selectedVariant
              .price
              ?.totalDiscountAmount ??
            null,

          totalDiscountPercent:
            selectedVariant
              .price
              ?.totalDiscountPercent ??
            null,

          giftVoucher:
            selectedVariant
              .price
              ?.giftVoucher
              ? {
                  ...selectedVariant
                    .price
                    .giftVoucher,

                  discountAmount:
                    Number(
                      selectedVariant
                        .price
                        .giftVoucher
                        .discountAmount ||
                      selectedVariant
                        .price
                        .giftVoucherDiscountAmount ||
                      0
                    ),

                  internalValue:
                    Number(
                      selectedVariant
                        .price
                        .giftVoucher
                        .internalValue ||
                      0
                    ),

                  externalValue:
                    Number(
                      selectedVariant
                        .price
                        .giftVoucher
                        .externalValue ||
                      0
                    ),
                }
              : null,

          currencyCode,

          taxPercent:
            Number(
              detailProduct.taxPercent ||
                0
            ),

          isTaxInclusive:
            selectedVariant
              .price
              ?.isTaxInclusive !==
            false,

          quantity:
            Math.max(
              1,
              quantity
            ),

          extendedWarranty:
            null,

          selectedAttributes,
        })
      );

      void trackStorefrontActivity({
        activityType:
          "ADD_TO_CART",

        productId:
          detailProduct.id,

        variantId:
          selectedVariant.id,

        categoryId:
          detailProduct
            .primaryCategory
            ?.id ||
          null,

        brandId:
          detailProduct
            .brand
            ?.id ||
          null,

        quantity:
          Math.max(
            1,
            quantity
          ),

        source:
          "PRODUCT_CARD",
      });

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | Auto Add Products Without Choices
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !open ||
        loading ||
        !detailProduct ||
        !selectedVariant ||
        autoAddedRef.current
      ) {
        return;
      }

      const hasChoices =
        detailProduct
          .variantSelectors
          .length >
          0 &&
        detailProduct
          .variants
          .length >
          1;

      if (
        hasChoices
      ) {
        return;
      }

      autoAddedRef.current =
        true;

      addSelectedVariant();
    },
    // Intentionally triggered only after product resolves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      open,
      loading,
      detailProduct,
      selectedVariant,
    ]
  );

  if (
    !open
  ) {
    return null;
  }

  return (
    <>
      {/* Overlay */}

      <button
        type="button"
        aria-label="Close product options"
        onClick={
          onClose
        }
        className="fixed inset-0 z-[100] cursor-default bg-black/40 backdrop-blur-[1px]"
      />

      {/* Modal */}

      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Choose options for ${cardProduct.name}`}
          className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
        >
          {/* Header */}

          <div className="flex items-start justify-between border-b border-[#E5E7EB] px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                Quick add
              </p>

              <h2 className="mt-1 text-lg font-black text-[#111111]">
                {
                  detailProduct
                    ?.name ||
                  cardProduct.name
                }
              </h2>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6]"
            >
              <X
                size={
                  19
                }
              />
            </button>
          </div>

          {/* Loading */}

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle
                  size={
                    28
                  }
                  className="mx-auto animate-spin text-[#6B7280]"
                />

                <p className="mt-3 text-sm text-[#6B7280]">
                  Loading product options...
                </p>
              </div>
            </div>
          ) : null}

          {/* Error */}

          {!loading &&
          error ? (
            <div className="p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">
                  {
                    error
                  }
                </p>
              </div>
            </div>
          ) : null}

          {/* Product */}

          {!loading &&
          !error &&
          detailProduct &&
          selectedVariant ? (
            <>
              <div className="max-h-[65vh] overflow-y-auto p-5">
                <div className="flex gap-4">

                  {/* Image */}

                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={
                          imageUrl
                        }
                        alt={
                          detailProduct.name
                        }
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon
                        size={
                          28
                        }
                        className="text-[#9CA3AF]"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {detailProduct
                      .brand
                      ?.name ? (
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
                        {
                          detailProduct
                            .brand
                            .name
                        }
                      </p>
                    ) : null}

                    <h3 className="mt-1 text-base font-black text-[#111111]">
                      {
                        detailProduct.name
                      }
                    </h3>

                    <p className="mt-1 text-xs text-[#6B7280]">
                      SKU:{" "}
                      {
                        selectedVariant.sku
                      }
                    </p>
                    {selectedPrice != null ? (
                        <StorefrontMoney
                            amount={
                            selectedPrice
                            }
                            currencyCode={
                            currencyCode
                            }
                            className="mt-3 text-xl font-black text-[#111111]"
                        />
                        ) : null}
                  </div>
                </div>

                {/* Variant Selectors */}

                {detailProduct
                  .variantSelectors
                  .length >
                0 ? (
                  <div className="mt-6 space-y-5">
                    {detailProduct.variantSelectors.map(
                      (
                        selector
                      ) => {
                        const selectedId =
                          selections[
                            selector.id
                          ];

                        const selectedLabel =
                          selector.options.find(
                            (
                              option
                            ) =>
                              option.id ===
                              selectedId
                          )?.label;

                        return (
                          <div
                            key={
                              selector.id
                            }
                          >
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm font-black text-[#111111]">
                                {
                                  selector.name
                                }
                                :
                              </span>

                              {selectedLabel ? (
                                <span className="text-sm text-[#6B7280]">
                                  {
                                    selectedLabel
                                  }
                                </span>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {selector.options.map(
                                (
                                  option
                                ) => {
                                  const selected =
                                    selectedId ===
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
                                        "inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-bold transition",

                                        selected
                                          ? "border-[#111111] bg-[#F3F4F6] text-[#111111] ring-1 ring-[#111111]"
                                          : "border-[#D1D5DB] bg-white text-[#4B5563] hover:border-[#111111]",
                                      ].join(
                                        " "
                                      )}
                                    >
                                      {option.swatchValue ? (
                                        <span
                                          className="h-5 w-5 rounded-full border border-black/10"
                                          style={{
                                            backgroundColor:
                                              option.swatchValue,
                                          }}
                                        />
                                      ) : null}

                                      {
                                        option.label
                                      }

                                      {selected ? (
                                        <Check
                                          size={
                                            14
                                          }
                                        />
                                      ) : null}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                ) : null}

                {/* Quantity */}

                <div className="mt-6">
                  <p className="mb-2 text-sm font-black text-[#111111]">
                    Quantity
                  </p>

                  <div className="inline-flex h-11 items-center rounded-xl border border-[#D1D5DB] bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (
                            current
                          ) =>
                            Math.max(
                              1,
                              current -
                                1
                            )
                        )
                      }
                      className="h-full w-11 text-lg"
                    >
                      −
                    </button>

                    <span className="min-w-10 text-center text-sm font-black">
                      {
                        quantity
                      }
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          (
                            current
                          ) =>
                            current +
                            1
                        )
                      }
                      className="h-full w-11 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Availability */}

                <p
                  className={[
                    "mt-4 text-sm font-bold",

                    isUnavailable
                      ? "text-red-600"
                      : "text-emerald-700",
                  ].join(
                    " "
                  )}
                >
                  {isUnavailable
                    ? "Selected option is unavailable."
                    : selectedVariant
                        .availability
                        ?.message ||
                      "In stock"}
                </p>
              </div>

              {/* Footer */}

              <div className="border-t border-[#E5E7EB] bg-white p-5">
                <button
                  type="button"
                  disabled={
                    isUnavailable
                  }
                  onClick={
                    addSelectedVariant
                  }
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-5 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShoppingCart
                    size={
                      17
                    }
                  />

                  Add to cart
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}