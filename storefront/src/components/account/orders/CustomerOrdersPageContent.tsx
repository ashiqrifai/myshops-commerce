"use client";

import {
  ChevronRight,
  Package,
  ShoppingBag,
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
} from "@/store/slices/customerAuthSlice";

import {
  getCustomerOrders,
} from "@/lib/customer-orders/customerOrderApi";

import type {
  CustomerOrderSummary,
} from "@/lib/customer-orders/customerOrderApi";

const money = (
  value: number,
  currencyCode: string
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
    value
  );

const formatDate = (
  value: string
) =>
  new Intl.DateTimeFormat(
    "en-AE",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    new Date(
      value
    )
  );

const statusClass = (
  status: string
) => {
  switch (
    status
  ) {
    case "CONFIRMED":
    case "COMPLETED":
    case "PAID":
    case "FULFILLED":
      return "bg-emerald-50 text-emerald-700";

    case "CANCELLED":
    case "FAILED":
      return "bg-red-50 text-red-700";

    case "PROCESSING":
    case "PARTIALLY_FULFILLED":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-amber-50 text-amber-700";
  }
};

export default function CustomerOrdersPageContent() {
  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    orders,
    setOrders,
  ] =
    useState<
      CustomerOrderSummary[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null
    );

  useEffect(
    () => {
      let cancelled =
        false;

      const load =
        async () => {
          if (
            !accessToken
          ) {
            return;
          }

          try {
            setLoading(
              true
            );

            setError(
              null
            );

            const result =
              await getCustomerOrders({
                accessToken,
                page:
                  1,
                pageSize:
                  50,
              });

            if (
              !cancelled
            ) {
              setOrders(
                result.orders
              );
            }
          } catch (
            requestError
          ) {
            if (
              cancelled
            ) {
              return;
            }

            setError(
              requestError instanceof
                Error
                ? requestError.message
                : "Unable to load your orders."
            );
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
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
    ]
  );

  if (
    loading
  ) {
    return (
      <div className="py-16 text-center text-sm text-storefront-muted">
        Loading your
        orders…
      </div>
    );
  }

  if (
    error
  ) {
    return (
      <div className="rounded-[22px] border border-red-200 bg-red-50 p-6">
        <h2 className="font-black text-red-800">
          Unable to
          load orders
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
          My account
        </p>

        <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
          Orders
        </h1>

        <p className="mt-2 text-sm text-storefront-muted">
          Review your
          purchases,
          payment status
          and delivery
          progress.
        </p>
      </div>

      {!orders.length ? (
        <div className="rounded-[22px] border border-storefront bg-storefront-surface p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
            <ShoppingBag
              size={
                24
              }
            />
          </div>

          <h2 className="mt-5 text-xl font-black text-storefront-text">
            No orders yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-storefront-muted">
            Orders placed
            while signed
            into this
            account will
            appear here.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(
            (
              order
            ) => (
              <Link
                key={
                  order.id
                }
                href={`/account/orders/${order.id}`}
                className="block rounded-[22px] border border-storefront bg-storefront-surface p-5 transition hover:border-storefront-primary hover:shadow-md sm:p-6"
              >
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-storefront-secondary text-storefront-primary">
                    <Package
                      size={
                        22
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-storefront-text">
                        {
                          order.orderNumber
                        }
                      </h2>

                      <span
                        className={[
                          "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide",
                          statusClass(
                            order.orderStatus
                          ),
                        ].join(
                          " "
                        )}
                      >
                        {
                          order.orderStatus
                        }
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-storefront-muted">
                      {formatDate(
                        order.placedAt
                      )}
                      {" · "}
                      {
                        order.itemCount
                      }{" "}
                      item
                      {order.itemCount ===
                      1
                        ? ""
                        : "s"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-700">
                        Payment:{" "}
                        {
                          order.paymentStatus
                        }
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-700">
                        Delivery:{" "}
                        {
                          order.fulfillmentStatus
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                    <p className="text-lg font-black text-storefront-text">
                      {money(
                        order.grandTotal,
                        order.currencyCode
                      )}
                    </p>

                    <div className="mt-2 inline-flex items-center gap-1 text-xs font-black text-storefront-primary">
                      View order

                      <ChevronRight
                        size={
                          15
                        }
                      />
                    </div>
                  </div>
                </div>
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}