"use client";

import {
  LockKeyhole,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCartItems,
  selectCartSubtotal,
  selectCartTax,
} from "@/store/slices/cartSlice";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

interface CartSummaryProps {
  discountAmount:
    number;

  shippingFee:
    number;
}

export default function CartSummary({
  discountAmount,
  shippingFee,
}: CartSummaryProps) {
  const router =
    useRouter();

  const items =
    useAppSelector(
      selectCartItems
    );

  const subtotal =
    useAppSelector(
      selectCartSubtotal
    );

  const tax =
    useAppSelector(
      selectCartTax
    );

  const currencyCode =
    items[0]
      ?.currencyCode ||
    "AED";

  const deliveryItemCount =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.fulfilmentMethod ===
          "PICKUP"
            ? 0
            : item.quantity
        ),
      0
    );

  const pickupItemCount =
    items.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.fulfilmentMethod ===
          "PICKUP"
            ? item.quantity
            : 0
        ),
      0
    );

  const pickupSelectionComplete =
    items.every(
      (
        item
      ) =>
        item.fulfilmentMethod !==
          "PICKUP" ||
        Boolean(
          item.pickupLocationId
        )
    );

  const total =
    Math.max(
      0,
      subtotal +
        tax +
        shippingFee -
        discountAmount
    );

  const goToCheckout =
    () => {
      if (
        !pickupSelectionComplete
      ) {
        return;
      }

      router.push(
        "/checkout"
      );
    };

  return (
    <aside className="rounded-[22px] border border-[#D8DDE3] bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-black text-storefront-text">
          Order summary
        </h2>

        <span className="text-sm font-bold text-storefront-muted">
          {
            items.length
          }{" "}
          {items.length ===
          1
            ? "item"
            : "items"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[#D8DDE3] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-storefront-muted">
            Delivery
          </p>

          <p className="mt-1 text-sm font-black text-storefront-text">
            {deliveryItemCount}{" "}
            {deliveryItemCount ===
            1
              ? "item"
              : "items"}
          </p>
        </div>

        <div className="rounded-xl border border-[#D8DDE3] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-storefront-muted">
            Store pickup
          </p>

          <p className="mt-1 text-sm font-black text-storefront-text">
            {pickupItemCount}{" "}
            {pickupItemCount ===
            1
              ? "item"
              : "items"}
          </p>
        </div>
      </div>

      {!pickupSelectionComplete ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold text-amber-800">
            Please select a pickup store for every pickup item before checkout.
          </p>
        </div>
      ) : null}

      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-storefront-text">
            Subtotal
          </dt>

          <dd className="font-black text-storefront-text">
            <StorefrontMoney
              amount={
                subtotal
              }
              currencyCode={
                currencyCode
              }
            />
          </dd>
        </div>

        <div className="flex justify-between gap-4">
          <dt className="text-storefront-text">
            Shipping fee
          </dt>

          <dd
            className={[
              "font-black",

              shippingFee > 0
                ? "text-storefront-text"
                : "text-emerald-600",
            ].join(
              " "
            )}
          >
            {shippingFee > 0 ? (
              <StorefrontMoney
                amount={
                  shippingFee
                }
                currencyCode={
                  currencyCode
                }
              />
            ) : (
              "FREE"
            )}
          </dd>
        </div>

        {discountAmount >
        0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-emerald-700">
              Discount
            </dt>

            <dd className="flex items-center font-black text-emerald-700">
              <span>
                -
              </span>

              <StorefrontMoney
                amount={
                  discountAmount
                }
                currencyCode={
                  currencyCode
                }
              />
            </dd>
          </div>
        ) : null}

        <div className="flex justify-between gap-4">
          <dt className="text-storefront-muted">
            VAT
          </dt>

          <dd className="font-bold text-storefront-text">
            {tax > 0 ? (
              <StorefrontMoney
                amount={
                  tax
                }
                currencyCode={
                  currencyCode
                }
              />
            ) : (
              "Included"
            )}
          </dd>
        </div>
      </dl>

      <div className="my-6 border-t border-[#D8DDE3]" />

      <div className="flex items-end justify-between gap-4">
        <span className="text-xl font-black text-storefront-text">
          Total
        </span>

        <StorefrontMoney
          amount={
            total
          }
          currencyCode={
            currencyCode
          }
          className="text-2xl font-black text-storefront-text"
        />
      </div>

      <button
        type="button"
        disabled={
          !pickupSelectionComplete
        }
        onClick={
          goToCheckout
        }
        className="mt-5 flex h-14 w-full items-center justify-center rounded-xl bg-[#111111] px-5 text-lg font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
      >
        Checkout
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-storefront-muted">
        <LockKeyhole
          size={
            14
          }
        />

        Secure checkout
      </div>
    </aside>
  );
}
