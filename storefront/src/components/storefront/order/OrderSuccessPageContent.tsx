"use client";

import {
  CheckCircle2,
  ChevronRight,
  Home,
  Package,
  ReceiptText,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCustomerAccessToken,
  selectCustomerAuthenticated,
} from "@/store/slices/customerAuthSlice";

import {
  getCustomerOrder,
} from "@/lib/customer-orders/customerOrderApi";

import type {
  CustomerOrderDetails,
} from "@/lib/customer-orders/customerOrderApi";

const money = (
  value: number,
  currencyCode: string
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style: "currency",
      currency:
        currencyCode ||
        "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);

export default function OrderSuccessPageContent({
  orderId,
}: {
  orderId: string;
}) {
  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const authenticated =
    useAppSelector(
      selectCustomerAuthenticated
    );

  const [
    order,
    setOrder,
  ] =
    useState<CustomerOrderDetails | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const load =
        async () => {
          if (
            !authenticated ||
            !accessToken
          ) {
            setLoading(false);
            return;
          }

          try {
            const result =
              await getCustomerOrder({
                accessToken,
                orderId,
              });

            if (!cancelled) {
              setOrder(result);
            }
          } catch (
            requestError
          ) {
            if (!cancelled) {
              setError(
                requestError instanceof
                  Error
                  ? requestError.message
                  : "Unable to load order details."
              );
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };

      void load();

      return () => {
        cancelled =
          true;
      };
    },
    [
      accessToken,
      authenticated,
      orderId,
    ]
  );

  return (
    <div className="py-10 sm:py-14">
      <div className="mx-auto max-w-[760px]">
        <section className="rounded-[28px] border border-storefront bg-storefront-surface p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2
              size={34}
            />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-storefront-primary">
            Order confirmed
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            Thank you for your order
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-storefront-muted">
            Your order has been received successfully.
            We’ll keep you updated as it moves through processing and delivery.
          </p>

          {loading ? (
            <div className="mt-8 rounded-2xl border border-storefront bg-white p-6 text-sm text-storefront-muted">
              Loading order details…
            </div>
          ) : null}

          {!loading &&
          error ? (
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
              Your order was placed successfully, but the order details could not be loaded right now.
            </div>
          ) : null}

          {!loading &&
          order ? (
            <div className="mt-8 rounded-[22px] border border-storefront bg-white p-5 text-left sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                    Order number
                  </p>

                  <p className="mt-1 text-xl font-black text-storefront-text">
                    {order.orderNumber}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                    Total
                  </p>

                  <p className="mt-1 text-xl font-black text-storefront-text">
                    {money(
                      order.grandTotal,
                      order.currencyCode
                    )}
                  </p>
                </div>
              </div>

              <div className="my-5 border-t border-storefront" />

              <div className="grid gap-4 sm:grid-cols-3">
                <InfoItem
                  label="Payment"
                  value={
                    order.paymentMethod
                  }
                />

                <InfoItem
                  label="Payment status"
                  value={
                    order.paymentStatus
                  }
                />

                <InfoItem
                  label="Delivery"
                  value={
                    order.deliveryMethod
                  }
                />
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-storefront-muted">
                <Package
                  size={15}
                />

                Fulfillment status:{" "}
                <span className="font-black text-storefront-text">
                  {
                    order.fulfillmentStatus
                  }
                </span>
              </div>
            </div>
          ) : null}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {authenticated ? (
              <Link
                href={`/account/orders/${orderId}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
              >
                <ReceiptText
                  size={17}
                />

                View order

                <ChevronRight
                  size={16}
                />
              </Link>
            ) : null}

            <Link
              href="/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-storefront-button border border-storefront bg-white px-5 text-sm font-black text-storefront-text"
            >
              <Home
                size={17}
              />

              Continue shopping
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-storefront-text">
        {value}
      </p>
    </div>
  );
}