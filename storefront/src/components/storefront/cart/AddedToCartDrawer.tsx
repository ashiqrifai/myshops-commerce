"use client";

import {
  Check,
  ImageIcon,
  ShieldCheck,
  ShoppingBag,
  X,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  selectCartItems,
  selectCartSubtotal,
} from "@/store/slices/cartSlice";

import {
  closeAddedToCart,
  selectCartFeedbackOpen,
  selectCartFeedbackSequence,
  selectLastAddedItemKey,
} from "@/store/slices/cartFeedbackSlice";


import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

const AUTO_CLOSE_MS =
  4500;

const money = (
  value:
    number,

  currencyCode:
    string
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency:
        currencyCode ||
        "AED",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ||
        0
    )
  );

export default function AddedToCartDrawer() {
  const dispatch =
    useAppDispatch();

  const open =
    useAppSelector(
      selectCartFeedbackOpen
    );

  const sequence =
    useAppSelector(
      selectCartFeedbackSequence
    );

  const lastAddedItemKey =
    useAppSelector(
      selectLastAddedItemKey
    );

  const items =
    useAppSelector(
      selectCartItems
    );

  const cartSubtotal =
    useAppSelector(
      selectCartSubtotal
    );

  const [
    interacting,
    setInteracting,
  ] =
    useState(
      false
    );

  const timer =
    useRef<
      ReturnType<
        typeof setTimeout
      > |
      null
    >(
      null
    );

  const item =
    useMemo(
      () =>
        items.find(
          (
            entry
          ) =>
            entry.key ===
            lastAddedItemKey
        ) ||
        null,
      [
        items,
        lastAddedItemKey,
      ]
    );

  const close =
    () =>
      dispatch(
        closeAddedToCart()
      );

  useEffect(
    () => {
      if (
        !open ||
        interacting
      ) {
        return;
      }

      if (
        timer.current
      ) {
        clearTimeout(
          timer.current
        );
      }

      timer.current =
        setTimeout(
          () => {
            dispatch(
              closeAddedToCart()
            );
          },
          AUTO_CLOSE_MS
        );

      return () => {
        if (
          timer.current
        ) {
          clearTimeout(
            timer.current
          );
        }
      };
    },
    [
      dispatch,
      open,
      sequence,
      interacting,
    ]
  );

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const keydown =
        (
          event:
            KeyboardEvent
        ) => {
          if (
            event.key ===
            "Escape"
          ) {
            dispatch(
              closeAddedToCart()
            );
          }
        };

      window.addEventListener(
        "keydown",
        keydown
      );

      return () =>
        window.removeEventListener(
          "keydown",
          keydown
        );
    },
    [
      dispatch,
      open,
    ]
  );

  if (
    !open ||
    !item
  ) {
    return null;
  }

  const warranty =
    item.extendedWarranty ||
    null;
  
    console.log(
      "DRAWER CART ITEM:",
      item
    );
    
    console.log(
      "DRAWER SELECTED ATTRIBUTES:",
      item.selectedAttributes
    );

  const currencyCode =
    item.currencyCode ||
    "AED";

  const productLineTotal =
    item.unitPrice *
    item.quantity;

  const warrantyLineTotal =
    (
      warranty?.unitPrice ||
      0
    ) *
    item.quantity;

  return (
    <>
      {/* Overlay */}

      <button
        type="button"
        aria-label="Close added to cart"
        onClick={
          close
        }
        className="fixed inset-0 z-[80] cursor-default bg-black/20 backdrop-blur-[1px]"
      />

      {/* Drawer */}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Added to cart"
        onMouseEnter={() =>
          setInteracting(
            true
          )
        }
        onMouseLeave={() =>
          setInteracting(
            false
          )
        }
        onFocusCapture={() =>
          setInteracting(
            true
          )
        }
        onBlurCapture={() =>
          setInteracting(
            false
          )
        }
        className="fixed right-0 top-0 z-[90] flex h-dvh w-full max-w-[430px] flex-col border-l border-[#E5E7EB] bg-white shadow-2xl"
      >
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check
                size={
                  19
                }
                strokeWidth={
                  3
                }
              />
            </span>

            <div>
              <p className="font-black text-[#111111]">
                Added to your cart
              </p>

              <p className="text-xs text-[#6B7280]">
                Your cart has been updated.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              close
            }
            aria-label="Close"
            className="flex size-10 items-center justify-center rounded-full text-[#6B7280] transition hover:bg-[#F3F4F6] hover:text-[#111111]"
          >
            <X
              size={
                20
              }
            />
          </button>
        </div>

        {/* Content */}

        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* Product */}

          <div className="flex gap-4">
            <Link
              href={`/products/${item.productSlug}`}
              onClick={
                close
              }
              className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D1D5DB] bg-white"
            >
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    item.imageUrl
                  }
                  alt={
                    item.productName
                  }
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <ImageIcon
                  size={
                    26
                  }
                  className="text-[#9CA3AF]"
                />
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.productSlug}`}
                onClick={
                  close
                }
                className="line-clamp-2 text-sm font-black leading-5 text-[#111111] transition hover:text-storefront-primary"
              >
                {
                  item.productName
                }
              </Link>

              <p className="mt-1 text-xs text-[#6B7280]">
                SKU:{" "}
                {
                  item.sku
                }
              </p>

              {item.selectedAttributes?.length ? (
              <div className="mt-2 space-y-1.5">
                {item.selectedAttributes.map(
                  (
                    attribute
                  ) => (
                    <div
                      key={`${attribute.attributeId}:${attribute.optionId}`}
                      className="flex items-center gap-2"
                    >
                      {/* Color Swatch */}

                      {attribute.swatchValue ? (
                        <span
                          className="h-4 w-4 shrink-0 rounded-full border border-[#D1D5DB]"
                          style={{
                            backgroundColor:
                              attribute.swatchValue,
                          }}
                        />
                      ) : null}

                      {/* Attribute */}

                      <span className="text-xs font-medium text-[#6B7280]">
                        {attribute.attributeName}:
                      </span>

                      {/* Selected Value */}

                      <span className="text-xs font-bold text-[#111111]">
                        {attribute.optionLabel}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : null}

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#6B7280]">
                  Qty{" "}
                  {
                    item.quantity
                  }
                </span>

                <StorefrontMoney
                    amount={
                      productLineTotal
                    }
                    currencyCode={
                      currencyCode
                    }
                    className="text-sm font-black text-[#111111]"
                  />
              </div>
            </div>
          </div>

          {/* Warranty */}

          {warranty ? (
            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex gap-3">
                <ShieldCheck
                  size={
                    19
                  }
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-800">
                    Extended warranty
                  </p>

                  <p className="mt-1 text-sm font-bold text-emerald-950">
                    {
                      warranty.name
                    }
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span className="text-emerald-800">
                      {warranty
                        .periodYears
                        ? `${warranty.periodYears} ${
                            warranty.periodYears ===
                            1
                              ? "year"
                              : "years"
                          }`
                        : warranty
                              .durationMonths
                          ? `${warranty.durationMonths} months`
                          : "Protection plan"}
                    </span>
                    <StorefrontMoney
                        amount={
                          warrantyLineTotal
                        }
                        currencyCode={
                          warranty.currencyCode ||
                          currencyCode
                        }
                        className="font-black text-emerald-950"
                      />
                                        </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Subtotal */}

          <div className="mt-6 border-t border-[#E5E7EB] pt-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#6B7280]">
                Cart subtotal
              </span>

              <StorefrontMoney
                  amount={
                    cartSubtotal
                  }
                  currencyCode={
                    currencyCode
                  }
                  className="text-xl font-black text-[#111111]"
                />
            </div>
          </div>
        </div>

        {/* Footer */}

        <div className="border-t border-[#E5E7EB] bg-white p-5">
          <div className="grid grid-cols-2 gap-3">

            {/* View Cart */}

            <Link
              href="/cart"
              onClick={
                close
              }
              className="flex h-11 items-center justify-center rounded-storefront-button border border-[#D1D5DB] bg-white px-4 text-xs font-black text-[#111111] transition hover:bg-[#F9FAFB]"
            >
              View cart
            </Link>

            {/* Checkout */}

            <Link
              href="/checkout"
              onClick={
                close
              }
              className="flex h-11 items-center justify-center gap-2 rounded-storefront-button bg-[#111111] px-4 text-xs font-black !text-white transition hover:bg-black"
            >
              <ShoppingBag
                size={
                  16
                }
                className="text-white"
              />

              <span className="text-white">
                Checkout
              </span>
            </Link>
          </div>

          {/* Continue Shopping */}

          <button
            type="button"
            onClick={
              close
            }
            className="mt-3 h-10 w-full text-xs font-bold text-[#6B7280] transition hover:text-[#111111]"
          >
            Continue shopping
          </button>
        </div>
      </aside>
    </>
  );
}