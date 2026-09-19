"use client";

import Link from "next/link";

import {
  ShoppingBag,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import CartItemRow from "./CartItemRow";

import CartRecommendations from "./CartRecommendations";

import CartSummary from "./CartSummary";

import CouponSection from "@/components/storefront/checkout/CouponSection";

import TabbyPromo from "@/components/storefront/tabby/TabbyPromo";

import TamaraWidget from "@/components/storefront/tamara/TamaraWidget";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearCart,
  selectAppliedCoupon,
  selectCartHydrated,
  selectCartItemCount,
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";

export default function CartPageClient() {
  const dispatch =
    useAppDispatch();

  const hydrated =
    useAppSelector(
      selectCartHydrated
    );

  const items =
    useAppSelector(
      selectCartItems
    );

  const itemCount =
    useAppSelector(
      selectCartItemCount
    );

  const cartTotal =
    useAppSelector(
      selectCartTotal
    );

  const appliedCoupon =
    useAppSelector(
      selectAppliedCoupon
    );

/*
  |--------------------------------------------------------------------------
  | Shipping
  |--------------------------------------------------------------------------
  */

  const baseShippingFee =
    0;

  /*
  |--------------------------------------------------------------------------
  | Coupon
  |--------------------------------------------------------------------------
  */

  const discountAmount =
    appliedCoupon
      ?.merchandiseDiscount ||
    0;

  const shippingFee =
    appliedCoupon
      ? appliedCoupon
          .finalDeliveryAmount
      : baseShippingFee;

  /*
  |--------------------------------------------------------------------------
  | Currency / Total
  |--------------------------------------------------------------------------
  */

  const currencyCode =
    items[0]
      ?.currencyCode ||
    "AED";

  const mobileTotal =
    Math.max(
      0,
      cartTotal +
        shippingFee -
        discountAmount
    );

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    !hydrated
  ) {
    return (
      <div className="py-20 text-center text-sm text-storefront-muted">
        Loading cart…
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Empty Cart
  |--------------------------------------------------------------------------
  */

  if (
    !items.length
  ) {
    return (
      <div className="py-20">
        <div className="mx-auto max-w-xl rounded-[22px] border border-[#D8DDE3] bg-storefront-surface p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
            <ShoppingBag
              size={
                24
              }
            />
          </div>

          <h1 className="mt-5 text-2xl font-black text-storefront-text">
            Your cart is empty
          </h1>

          <p className="mt-3 text-sm text-storefront-muted">
            Browse products and add your favourite items to continue.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-storefront-primary px-6 text-sm font-black text-white"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Cart
  |--------------------------------------------------------------------------
  */

  return (
    <div className="pb-24 md:pb-0">
      {/* Header */}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-storefront-primary">
            Shopping cart
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            Your cart
          </h1>

          <p className="mt-2 text-sm text-storefront-muted">
            {itemCount}{" "}
            {itemCount ===
            1
              ? "item"
              : "items"}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            dispatch(
              clearCart()
            )
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-red-600 hover:bg-red-50"
        >
          <Trash2
            size={
              15
            }
          />

          Clear cart
        </button>
      </div>

      {/* Main Cart / Summary */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        {/* Left Column */}

        <div className="space-y-5">
          {items.map(
            (
              item
            ) => (
              <CartItemRow
                key={
                  item.key
                }
                item={
                  item
                }
              />
            )
          )}

          {/* Manual Backend Attachments */}

          <CartRecommendations
            mode="ATTACHMENT"
          />
        </div>

        {/* Right Column */}

        <div className="space-y-5">
          <CartSummary
            discountAmount={
              discountAmount
            }
            shippingFee={
              shippingFee
            }
          />

            {mobileTotal > 0 ? (
            <section className="rounded-[22px] border border-[#D8DDE3] bg-white p-5 shadow-sm">
              <TabbyPromo
                key={`cart-${mobileTotal}`}
                amount={mobileTotal}
                currencyCode={currencyCode}
                source="cart"
              />
            </section>
          ) : null}

          <section className="rounded-[22px] border border-[#D8DDE3] bg-white p-5 shadow-sm">
            <CouponSection
              merchandiseTotal={
                cartTotal
              }
              deliveryAmount={
                baseShippingFee
              }
              currencyCode={
                currencyCode
              }
            />

            {appliedCoupon ? (
              <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold text-emerald-700">
                  Coupon{" "}
                  <span className="font-black">
                    {
                      appliedCoupon.code
                    }
                  </span>{" "}
                  will continue with you to checkout.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </div>

      {/* Automatic Full Width Recommendations */}

      <div className="mt-8">
        <CartRecommendations
          mode="AUTOMATIC"
        />
      </div>

      {/* Mobile Sticky Checkout */}

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#D8DDE3] bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-storefront-muted">
              Cart total
            </p>

            <StorefrontMoney
              amount={
                mobileTotal
              }
              currencyCode={
                currencyCode
              }
              className="text-base font-black text-storefront-text"
            />

            {appliedCoupon ? (
              <p className="mt-0.5 text-[10px] font-bold text-emerald-700">
                {
                  appliedCoupon.code
                }{" "}
                applied
              </p>
            ) : null}
          </div>

          <Link
            href="/checkout"
            className="flex h-12 min-w-[150px] items-center justify-center rounded-xl bg-[#111111] px-5 text-sm font-black text-white transition hover:bg-black"
          >
            Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}