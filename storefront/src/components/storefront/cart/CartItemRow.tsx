"use client";

import Link from "next/link";

import {
  BadgeCheck,
  CalendarDays,
  Gift,
  ImageIcon,
  Info,
  Minus,
  Plus,
  Store,
  Tag,
  Trash2,
  Truck,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useAppDispatch,
} from "@/store/hooks";

import {
  decrementItem,
  incrementItem,
  removeItem,
  setItemQuantity,
  setItemExtendedWarranty,
  setItemFulfilment,
} from "@/store/slices/cartSlice";

import type {
  CartItem,
} from "@/store/slices/cartSlice";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

import {
  useProductDeliveryEligibility,
} from "@/hooks/useProductDeliveryEligibility";

import {
  getPublicPickupLocations,
} from "@/lib/storefront/public-pickup-api";

import type {
  PublicPickupLocation,
} from "@/lib/storefront/public-pickup-api";

export default function CartItemRow({
  item,
}: {
  item: CartItem;
}) {
  const dispatch =
    useAppDispatch();

  /*
  |--------------------------------------------------------------------------
  | Pickup Locations
  |--------------------------------------------------------------------------
  */

  const [
    pickupLocations,
    setPickupLocations,
  ] =
    useState<
      PublicPickupLocation[]
    >([]);

  const [
    pickupLoading,
    setPickupLoading,
  ] =
    useState(
      false
    );

  const [
    pickupError,
    setPickupError,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const fulfilmentMethod =
    item.fulfilmentMethod ||
    "DELIVERY";

  /*
  |--------------------------------------------------------------------------
  | Live Express Delivery Eligibility
  |--------------------------------------------------------------------------
  |
  | No customer IP/location is used.
  |
  | Dubai / Sharjah:
  | DXB_WAREHOUSE + DXB_WAFI + DXB_DEIRA_CC
  |
  | Abu Dhabi:
  | AUH_SAJ
  |
  | Cart quantity is used, so the badge automatically updates if quantity
  | changes and the express pool no longer has enough stock.
  |
  |--------------------------------------------------------------------------
  */

  const {
    eligibility:
      deliveryEligibility,

    loading:
      deliveryEligibilityLoading,
  } =
    useProductDeliveryEligibility({
      productVariantId:
        item.variantId,

      quantity:
        item.quantity,
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

  /*
  |--------------------------------------------------------------------------
  | Load Stores For Pickup
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        fulfilmentMethod !==
        "PICKUP"
      ) {
        setPickupLocations(
          []
        );

        setPickupError(
          null
        );

        return;
      }

      const controller =
        new AbortController();

      setPickupLoading(
        true
      );

      setPickupError(
        null
      );

      getPublicPickupLocations({
        variantId:
          item.variantId,

        quantity:
          item.quantity,

        signal:
          controller.signal,
      })
        .then(
          (
            locations
          ) => {
            setPickupLocations(
              locations
            );

            /*
             * If a previously selected store
             * no longer has enough stock after
             * quantity changes, clear it.
             */
            if (
              item.pickupLocationId
            ) {
              const selected =
                locations.find(
                  (
                    location
                  ) =>
                    location.id ===
                    item.pickupLocationId
                );

              if (
                !selected ||
                !selected.available
              ) {
                dispatch(
                  setItemFulfilment({
                    key:
                      item.key,

                    fulfilmentMethod:
                      "PICKUP",

                    pickupLocationId:
                      null,

                    pickupLocationCode:
                      null,

                    pickupLocationName:
                      null,

                    pickupLeadTimeMinutes:
                      null,
                  })
                );
              }
            }
          }
        )
        .catch(
          (
            error
          ) => {
            if (
              controller.signal
                .aborted
            ) {
              return;
            }

            setPickupLocations(
              []
            );

            setPickupError(
              error instanceof
                Error
                ? error.message
                : "Unable to load pickup stores."
            );
          }
        )
        .finally(
          () => {
            if (
              !controller.signal
                .aborted
            ) {
              setPickupLoading(
                false
              );
            }
          }
        );

      return () => {
        controller.abort();
      };
    },
    [
      dispatch,
      fulfilmentMethod,
      item.key,
      item.pickupLocationId,
      item.quantity,
      item.variantId,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Pricing
  |--------------------------------------------------------------------------
  */

  const regularUnitPrice =
    item.regularPrice !=
      null
      ? Number(
          item.regularPrice
        )
      : item.compareAtPrice !=
          null
        ? Number(
            item.compareAtPrice
          )
        : null;

  const regularTotal =
    regularUnitPrice != null &&
    regularUnitPrice >
      item.unitPrice
      ? regularUnitPrice *
        item.quantity
      : null;

  const totalDiscountUnit =
    item.totalDiscountAmount !=
      null
      ? Number(
          item.totalDiscountAmount
        )
      : regularUnitPrice != null &&
          regularUnitPrice >
            item.unitPrice
        ? regularUnitPrice -
          item.unitPrice
        : 0;

  const totalDiscountLine =
    totalDiscountUnit *
    item.quantity;

  const discountPercent =
    item.totalDiscountPercent !=
      null &&
    Number(
      item.totalDiscountPercent
    ) >
      0
      ? Math.round(
          Number(
            item.totalDiscountPercent
          )
        )
      : regularUnitPrice != null &&
          regularUnitPrice >
            item.unitPrice
        ? Math.round(
            (
              (
                regularUnitPrice -
                item.unitPrice
              ) /
              regularUnitPrice
            ) *
              100
          )
        : null;

  const giftVoucherDiscountUnit =
    item.giftVoucherDiscountAmount !=
      null
      ? Number(
          item.giftVoucherDiscountAmount
        )
      : 0;

  const giftVoucherDiscountLine =
    giftVoucherDiscountUnit *
    item.quantity;

  const hasGiftVoucherDiscount =
    giftVoucherDiscountUnit >
      0;

  const giftVoucherValidUntil =
    item.giftVoucher
      ?.validUntil ||
    null;

  const formattedGiftVoucherValidUntil =
    giftVoucherValidUntil
      ? new Intl.DateTimeFormat(
          "en-GB",
          {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
        ).format(
          new Date(
            giftVoucherValidUntil
          )
        )
      : null;

  /*
  |--------------------------------------------------------------------------
  | Selected Pickup Location
  |--------------------------------------------------------------------------
  */

  const selectedPickupLocation =
    item.pickupLocationId
      ? pickupLocations.find(
          (
            location
          ) =>
            location.id ===
            item.pickupLocationId
        ) ||
        null
      : null;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <article className="rounded-[18px] border border-[#D8DDE3] bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[120px_minmax(0,1fr)_180px]">
        {/* Product Image */}

        <div>
          <Link
            href={`/products/${item.productSlug}`}
            className="flex h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-xl bg-storefront-secondary/35 lg:h-[120px] lg:w-[120px]"
          >
            {item.imageUrl ? (
              <img
                src={
                  item.imageUrl
                }
                alt={
                  item.productName
                }
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <ImageIcon
                size={
                  34
                }
                className="text-storefront-muted"
              />
            )}
          </Link>
        </div>

        {/* Product Details */}

        <div className="min-w-0">
          <Link
            href={`/products/${item.productSlug}`}
            className="text-lg font-black leading-7 text-storefront-text hover:text-storefront-primary"
          >
            {
              item.productName
            }
          </Link>

          {/* Selected Attributes */}

          {item.selectedAttributes
            .length ? (
            <div className="mt-3 inline-flex flex-wrap gap-x-2 gap-y-1 rounded-lg bg-storefront-secondary px-3 py-2 text-xs font-bold text-storefront-text">
              {item.selectedAttributes.map(
                (
                  attribute,
                  index
                ) => (
                  <span
                    key={
                      attribute.attributeId
                    }
                  >
                    {index >
                    0 ? (
                      <span className="mr-2 text-storefront-muted">
                        •
                      </span>
                    ) : null}

                    {
                      attribute.attributeName
                    }
                    :{" "}
                    {
                      attribute.optionLabel
                    }
                  </span>
                )
              )}
            </div>
          ) : null}

          {/* Bundle Promotions */}

          {item.bundleSelections?.length ? (
            <div className="mt-4 rounded-xl border border-storefront-primary/30 bg-storefront-secondary/45 p-4">
              <div className="flex items-center gap-2">
                <Gift
                  size={18}
                  className="text-storefront-primary"
                />

                <p className="text-sm font-black text-storefront-text">
                  Bundle included
                </p>
              </div>

              <div className="mt-2 space-y-3">
                {item.bundleSelections.map(
                  (bundle) => (
                    <div
                      key={
                        bundle.bundlePromotionId
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-storefront-text">
                          {
                            bundle.name
                          }
                        </p>

                        <span className="text-xs font-black text-storefront-text">
                          {bundle.priceMode ===
                          "FREE" ? (
                            "FREE"
                          ) : bundle.priceMode ===
                              "FIXED_TOTAL" &&
                            bundle.priceAmount !=
                              null ? (
                            <>
                              <StorefrontMoney
                                amount={
                                  Number(
                                    bundle.priceAmount
                                  )
                                }
                                currencyCode={
                                  bundle.currencyCode ||
                                  item.currencyCode
                                }
                              />{" "}
                              total
                            </>
                          ) : (
                            <>
                              +{" "}
                              <StorefrontMoney
                                amount={
                                  Number(
                                    bundle.priceAmount ||
                                    0
                                  ) *
                                  Number(
                                    bundle.selectionQuantity ||
                                    1
                                  )
                                }
                                currencyCode={
                                  bundle.currencyCode ||
                                  item.currencyCode
                                }
                              />
                            </>
                          )}
                        </span>
                      </div>

                      <div className="mt-1 space-y-1">
                        {bundle.items.map(
                          (
                            bundleItem
                          ) => (
                            <p
                              key={
                                bundleItem.id
                              }
                              className="text-[11px] text-storefront-muted"
                            >
                              •{" "}
                              {
                                bundleItem.label
                              }
                              {bundleItem.quantity >
                              1
                                ? ` × ${bundleItem.quantity}`
                                : ""}
                            </p>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}

          {/* Warranty */}

          {item.extendedWarranty ? (
            <div className="mt-4 rounded-xl border border-storefront-primary/40 bg-storefront-secondary/55 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <BadgeCheck
                    size={
                      20
                    }
                    className="mt-0.5 shrink-0 text-storefront-primary"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-black text-storefront-text">
                      {
                        item.extendedWarranty
                          .periodYears
                      }{" "}
                      Year Extended Warranty
                    </p>

                    <p className="mt-1 text-xs leading-5 text-storefront-muted">
                      {
                        item.extendedWarranty
                          .percentage
                      }
                      % of product price ×{" "}
                      {
                        item.quantity
                      }{" "}
                      {item.quantity ===
                      1
                        ? "item"
                        : "items"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <StorefrontMoney
                    amount={
                      item.extendedWarranty
                        .unitPrice *
                      item.quantity
                    }
                    currencyCode={
                      item.extendedWarranty
                        .currencyCode ||
                      item.currencyCode
                    }
                    className="text-sm font-black text-storefront-text"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        setItemExtendedWarranty({
                          key:
                            item.key,

                          warranty:
                            null,
                        })
                      )
                    }
                    className="mt-1 block text-[11px] font-black text-red-600"
                  >
                    Remove warranty
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {/* =========================================================
    FULFILMENT + QUANTITY + REMOVE
========================================================== */}

<div className="mt-4">
  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-storefront-muted">
    Fulfilment
  </p>

  <div className="flex flex-wrap items-center gap-2">
    {/* Delivery */}

    <button
      type="button"
      onClick={() =>
        dispatch(
          setItemFulfilment({
            key:
              item.key,

            fulfilmentMethod:
              "DELIVERY",
          })
        )
      }
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition",

        fulfilmentMethod ===
        "DELIVERY"
          ? "border-[#111111] bg-[#111111] text-white"
          : "border-[#D8DDE3] bg-white text-storefront-text hover:border-[#111111]",
      ].join(
        " "
      )}
      style={
        fulfilmentMethod ===
        "DELIVERY"
          ? {
              color:
                "#ffffff",

              WebkitTextFillColor:
                "#ffffff",
            }
          : undefined
      }
    >
      <Truck
        size={
          15
        }
      />

      Delivery
    </button>

    {/* Store Pickup */}

    <button
      type="button"
      onClick={() =>
        dispatch(
          setItemFulfilment({
            key:
              item.key,

            fulfilmentMethod:
              "PICKUP",
          })
        )
      }
      className={[
        "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition",

        fulfilmentMethod ===
        "PICKUP"
          ? "border-[#111111] bg-[#111111] text-white"
          : "border-[#D8DDE3] bg-white text-storefront-text hover:border-[#111111]",
      ].join(
        " "
      )}
      style={
        fulfilmentMethod ===
        "PICKUP"
          ? {
              color:
                "#ffffff",

              WebkitTextFillColor:
                "#ffffff",
            }
          : undefined
      }
    >
      <Store
        size={
          15
        }
      />

      Store pickup
    </button>

    {/* Divider - Desktop */}

    <div className="mx-1 hidden h-7 w-px bg-[#E5E7EB] sm:block" />

    {/* Quantity */}

    <div className="flex h-10 w-[118px] items-center rounded-xl border border-[#D8DDE3] bg-white">
      <button
        type="button"
        onClick={() =>
          dispatch(
            decrementItem(
              item.key
            )
          )
        }
        className="flex h-full w-9 shrink-0 items-center justify-center text-storefront-text transition hover:bg-storefront-secondary"
        aria-label="Decrease quantity"
      >
        <Minus
          size={
            14
          }
        />
      </button>

      <input
        type="number"
        min={
          1
        }
        max={
          999
        }
        value={
          item.quantity
        }
        onChange={(
          event
        ) =>
          dispatch(
            setItemQuantity({
              key:
                item.key,

              quantity:
                Number(
                  event.target
                    .value
                ),
            })
          )
        }
        className="min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-bold outline-none"
      />

      <button
        type="button"
        onClick={() =>
          dispatch(
            incrementItem(
              item.key
            )
          )
        }
        className="flex h-full w-9 shrink-0 items-center justify-center text-storefront-text transition hover:bg-storefront-secondary"
        aria-label="Increase quantity"
      >
        <Plus
          size={
            14
          }
        />
      </button>
    </div>

    {/* Remove */}

    <button
      type="button"
      onClick={() =>
        dispatch(
          removeItem(
            item.key
          )
        )
      }
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold text-red-600 transition hover:bg-red-50"
    >
      <Trash2
        size={
          14
        }
      />

      Remove
    </button>
  </div>

  {/* =========================================================
      LIVE EXPRESS DELIVERY
  ========================================================== */}

  {fulfilmentMethod ===
  "DELIVERY" ? (
    <div className="mt-3 max-w-lg">
      {deliveryEligibilityLoading ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#D8DDE3] bg-white px-3 py-2 text-[11px] font-semibold text-storefront-muted">
          Checking express delivery…
        </div>
      ) : null}

      {!deliveryEligibilityLoading &&
      (showDubaiSharjahExpress ||
        showAbuDhabiExpress) ? (
        <div className="flex flex-wrap gap-2">
          {showDubaiSharjahExpress ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#ccebe8] bg-[#f1fbfa] px-2.5 py-2 text-[10px] font-black text-[#138c83]">
              <Zap
                size={
                  13
                }
                strokeWidth={
                  2.5
                }
                className="shrink-0"
              />

              <span>
                2-Hour Delivery — Dubai / Sharjah
              </span>
            </div>
          ) : null}

          {showAbuDhabiExpress ? (
            <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#ccebe8] bg-[#f1fbfa] px-2.5 py-2 text-[10px] font-black text-[#138c83]">
              <Zap
                size={
                  13
                }
                strokeWidth={
                  2.5
                }
                className="shrink-0"
              />

              <span>
                1-Hour Delivery — Abu Dhabi
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : null}

  {/* =========================================================
      PICKUP STORE SELECTOR
  ========================================================== */}

  {fulfilmentMethod ===
  "PICKUP" ? (
    <div className="mt-3 max-w-lg rounded-xl border border-[#D8DDE3] bg-[#FAFAFA] p-3">
      <div className="flex items-center gap-2">
        <Store
          size={
            15
          }
          className="shrink-0 text-storefront-primary"
        />

        <p className="text-xs font-bold text-storefront-text">
          Choose pickup store
        </p>
      </div>

      <select
        value={
          item.pickupLocationId ||
          ""
        }
        disabled={
          pickupLoading
        }
        onChange={(
          event
        ) => {
          const location =
            pickupLocations.find(
              (
                pickupLocation
              ) =>
                pickupLocation.id ===
                event.target.value
            );

          if (
            !location
          ) {
            dispatch(
              setItemFulfilment({
                key:
                  item.key,

                fulfilmentMethod:
                  "PICKUP",

                pickupLocationId:
                  null,

                pickupLocationCode:
                  null,

                pickupLocationName:
                  null,

                pickupLeadTimeMinutes:
                  null,
              })
            );

            return;
          }

          dispatch(
            setItemFulfilment({
              key:
                item.key,

              fulfilmentMethod:
                "PICKUP",

              pickupLocationId:
                location.id,

              pickupLocationCode:
                location.code,

              pickupLocationName:
                location.name,

              pickupLeadTimeMinutes:
                location.pickupLeadTimeMinutes,
            })
          );
        }}
        className="mt-3 h-11 w-full rounded-xl border border-[#D8DDE3] bg-white px-3 text-sm font-medium text-storefront-text outline-none transition focus:border-storefront-primary"
      >
        <option value="">
          {pickupLoading
            ? "Loading pickup stores..."
            : "Select pickup store"}
        </option>

        {pickupLocations.map(
          (
            location
          ) => (
            <option
              key={
                location.id
              }
              value={
                location.id
              }
              disabled={
                !location.available
              }
            >
              {
                location.name
              }

              {location.city
                ? ` - ${location.city}`
                : ""}

              {location.available
                ? ` (${location.availableQuantity} available)`
                : " - Insufficient stock"}
            </option>
          )
        )}
      </select>

      {/* Loading */}

      {pickupLoading ? (
        <p className="mt-2 text-[11px] text-storefront-muted">
          Checking stock at pickup locations…
        </p>
      ) : null}

      {/* Error */}

      {pickupError ? (
        <p className="mt-2 text-[11px] font-medium text-red-600">
          {
            pickupError
          }
        </p>
      ) : null}

      {/* No Locations */}

      {!pickupLoading &&
      !pickupError &&
      pickupLocations.length ===
        0 ? (
        <p className="mt-2 text-[11px] text-storefront-muted">
          No pickup stores are currently available for this product.
        </p>
      ) : null}

      {/* Selected Store */}

      {selectedPickupLocation ? (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2">
          <p className="text-xs font-bold text-emerald-800">
            Pickup from{" "}
            {
              selectedPickupLocation.name
            }
          </p>

          <p className="mt-1 text-[11px] text-emerald-700">
            {
              selectedPickupLocation.availableQuantity
            }{" "}
            available

            {selectedPickupLocation.pickupLeadTimeMinutes >
            0
              ? ` · Ready in approximately ${selectedPickupLocation.pickupLeadTimeMinutes} minutes`
              : ""}
          </p>

          {selectedPickupLocation.area ||
          selectedPickupLocation.city ? (
            <p className="mt-1 text-[11px] text-emerald-700">
              {[
                selectedPickupLocation.area,
                selectedPickupLocation.city,
              ]
                .filter(
                  Boolean
                )
                .join(
                  ", "
                )}
            </p>
          ) : null}
        </div>
      ) : null}

      {!selectedPickupLocation &&
      !pickupLoading &&
      pickupLocations.length >
        0 ? (
        <p className="mt-2 text-[11px] text-storefront-muted">
          Select a store with enough stock for{" "}
          {
            item.quantity
          }{" "}
          {item.quantity ===
          1
            ? "unit"
            : "units"}.
        </p>
      ) : null}
    </div>
  ) : null}
</div>

     
        </div>

        {/* Pricing */}

        <div className="text-left lg:text-right">
          <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
            <StorefrontMoney
              amount={
                item.unitPrice *
                item.quantity
              }
              currencyCode={
                item.currencyCode
              }
              className="text-2xl font-black text-storefront-text"
            />

            {regularTotal ? (
              <StorefrontMoney
                amount={
                  regularTotal
                }
                currencyCode={
                  item.currencyCode
                }
                className="text-sm font-semibold text-storefront-muted line-through"
              />
            ) : null}

            {discountPercent ? (
              <span className="inline-flex items-center rounded-full bg-[#E52E3A] px-2.5 py-1 text-[11px] font-black text-white">
                {discountPercent}% OFF
              </span>
            ) : null}
          </div>

          {discountPercent &&
          totalDiscountLine >
            0 ? (
            <div className="mt-3 flex items-center gap-2 border-t border-[#ECEFF2] pt-3 lg:justify-end">
              <Tag
                size={16}
                strokeWidth={2.5}
                className="shrink-0 text-[#E52E3A]"
              />

              <div className="flex flex-wrap items-baseline gap-1 text-[#E52E3A]">
                <StorefrontMoney
                  amount={
                    totalDiscountLine
                  }
                  currencyCode={
                    item.currencyCode
                  }
                  className="text-xs font-black text-[#E52E3A]"
                  symbolClassName="h-[0.75em]"
                />

                <span className="text-xs font-black">
                  ({discountPercent}%)
                </span>
              </div>
            </div>
          ) : null}

          {hasGiftVoucherDiscount ? (
            <div className="mt-3 flex items-start gap-2 border-t border-[#ECEFF2] pt-3 lg:justify-end">
              <Gift
                size={17}
                strokeWidth={2.4}
                className="mt-0.5 shrink-0 text-[#6C2CF5]"
              />

              <p className="text-[11px] font-semibold leading-4 text-storefront-text">
                Gift voucher discount{" "}
                <StorefrontMoney
                  amount={
                    giftVoucherDiscountLine
                  }
                  currencyCode={
                    item.currencyCode
                  }
                  className="inline font-black text-[#6C2CF5]"
                  symbolClassName="h-[0.75em]"
                />{" "}
                applied
              </p>

              <Info
                size={14}
                strokeWidth={2.2}
                className="mt-0.5 shrink-0 text-storefront-muted"
                aria-hidden="true"
              />
            </div>
          ) : null}

          {hasGiftVoucherDiscount &&
          formattedGiftVoucherValidUntil ? (
            <div className="mt-2 flex items-center gap-2 lg:justify-end">
              <CalendarDays
                size={14}
                strokeWidth={2.2}
                className="shrink-0 text-storefront-muted"
              />

              <p className="text-[10px] font-semibold leading-4 text-storefront-muted">
                Offer valid till{" "}
                {formattedGiftVoucherValidUntil}
              </p>
            </div>
          ) : null}

          <div className="mt-2 flex items-center gap-1 text-xs text-storefront-muted lg:justify-end">
            <StorefrontMoney
              amount={
                item.unitPrice
              }
              currencyCode={
                item.currencyCode
              }
            />

            <span>
              each
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}