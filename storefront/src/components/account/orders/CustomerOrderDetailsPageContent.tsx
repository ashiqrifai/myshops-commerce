"use client";

import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCustomerAccessToken,
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

export default function CustomerOrderDetailsPageContent({
  orderId,
}: {
  orderId: string;
}) {
  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    order,
    setOrder,
  ] =
    useState<
      CustomerOrderDetails | null
    >(
      null
    );

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
              await getCustomerOrder({
                accessToken,
                orderId,
              });

            if (
              !cancelled
            ) {
              setOrder(
                result
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
                : "Unable to load this order."
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
      orderId,
    ]
  );

  const shippingAddress =
    useMemo(
      () =>
        order?.addresses
          ?.find(
            (
              address
            ) =>
              address.addressType ===
              "SHIPPING"
          ) ||
        null,
      [
        order,
      ]
    );

  if (
    loading
  ) {
    return (
      <div className="py-16 text-center text-sm text-storefront-muted">
        Loading order…
      </div>
    );
  }

  if (
    error ||
    !order
  ) {
    return (
      <div>
        <Link
          href="/account/orders"
          className="mb-6 inline-flex items-center gap-2 text-sm font-black text-storefront-primary"
        >
          <ArrowLeft
            size={
              16
            }
          />

          Back to orders
        </Link>

        <div className="rounded-[22px] border border-red-200 bg-red-50 p-6">
          <h2 className="font-black text-red-800">
            Unable to
            load order
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              "Order was not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm font-black text-storefront-primary"
      >
        <ArrowLeft
          size={
            16
          }
        />

        Back to orders
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Order
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            {
              order.orderNumber
            }
          </h1>

          <p className="mt-2 text-sm text-storefront-muted">
            Placed{" "}
            {formatDate(
              order.placedAt
            )}
          </p>
        </div>

        <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
          {
            order.orderStatus
          }
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Package
                size={
                  20
                }
                className="text-storefront-primary"
              />

              <h2 className="text-lg font-black text-storefront-text">
                Items
              </h2>
            </div>

            <div className="mt-5 divide-y divide-storefront">
            {order.items.map(
  (
    item
  ) => (
    <div
      key={
        item.id
      }
      className="py-4 first:pt-0 last:pb-0"
    >
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-black text-storefront-text">
            {
              item.productName
            }
          </p>

          {item.variantName &&
          item.variantName !==
            item.productName ? (
            <p className="mt-1 text-xs text-storefront-muted">
              {
                item.variantName
              }
            </p>
          ) : null}

          <p className="mt-1 text-xs text-storefront-muted">
            SKU:{" "}
            {
              item.sku
            }
          </p>

          <p className="mt-2 text-xs font-bold text-storefront-muted">
            Qty:{" "}
            {
              item.quantity
            }{" "}
            ×{" "}
            {money(
              item.unitPrice,
              order.currencyCode
            )}
          </p>
        </div>

        <div className="font-black text-storefront-text">
          {money(
            item.lineTotal,
            order.currencyCode
          )}
        </div>
      </div>

      {Array.isArray(
        item.protectionPlans
      ) &&
      item.protectionPlans.length >
        0 ? (
        <div className="mt-4 space-y-3">
          {item.protectionPlans.map(
            (
              protection
            ) => (
              <div
                key={
                  protection.id
                }
                className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
                    <ShieldCheck
                      size={
                        18
                      }
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-emerald-900">
                      {
                        protection.schemeName
                      }
                    </p>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-emerald-800">
                      {protection.durationMonths ? (
                        <span>
                          {
                            protection.durationMonths
                          }{" "}
                          months
                        </span>
                      ) : null}

                      <span>
                        Qty:{" "}
                        {
                          protection.quantity
                        }{" "}
                        ×{" "}
                        {money(
                          protection.protectionUnitPrice,
                          protection.currencyCode ||
                            order.currencyCode
                        )}
                      </span>
                    </div>

                    {protection.coverageStartMode ===
                    "AFTER_MANUFACTURER_WARRANTY" ? (
                      <p className="mt-2 text-xs text-emerald-700">
                        Coverage starts after the manufacturer warranty.
                      </p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-sm font-black text-emerald-900">
                    {money(
                      protection.totalAmount,
                      protection.currencyCode ||
                        order.currencyCode
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      ) : null}
    </div>
  )
)}
            </div>
          </section>

          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Truck
                size={
                  20
                }
                className="text-storefront-primary"
              />

              <h2 className="text-lg font-black text-storefront-text">
                Delivery
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                  Method
                </p>

                <p className="mt-1 font-black text-storefront-text">
                  {
                    order.deliveryMethod
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                  Status
                </p>

                <p className="mt-1 font-black text-storefront-text">
                  {
                    order.fulfillmentStatus
                  }
                </p>
              </div>
            </div>

            {shippingAddress ? (
              <div className="mt-5 border-t border-storefront pt-5">
                <div className="flex gap-3">
                  <MapPin
                    size={
                      18
                    }
                    className="mt-0.5 shrink-0 text-storefront-primary"
                  />

                  <div className="text-sm leading-6 text-storefront-text">
                    <p className="font-black">
                      {
                        shippingAddress.firstName
                      }{" "}
                      {
                        shippingAddress.lastName
                      }
                    </p>

                    {shippingAddress.addressLine1 ? (
                      <p>
                        {
                          shippingAddress.addressLine1
                        }
                      </p>
                    ) : null}

                    {shippingAddress.addressLine2 ? (
                      <p>
                        {
                          shippingAddress.addressLine2
                        }
                      </p>
                    ) : null}

                    <p>
                      {[
                        shippingAddress.area,
                        shippingAddress.city,
                        shippingAddress.emirate,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          ", "
                        )}
                    </p>

                    {shippingAddress.landmark ? (
                      <p>
                        Landmark:{" "}
                        {
                          shippingAddress.landmark
                        }
                      </p>
                    ) : null}

                    <p>
                      {
                        shippingAddress.mobile
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <CreditCard
                size={
                  20
                }
                className="text-storefront-primary"
              />

              <h2 className="text-lg font-black text-storefront-text">
                Payment
              </h2>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                  Method
                </p>

                <p className="mt-1 font-black text-storefront-text">
                  {
                    order.paymentMethod
                  }
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                  Status
                </p>

                <p className="mt-1 font-black text-storefront-text">
                  {
                    order.paymentStatus
                  }
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-storefront-text">
              Order summary
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-storefront-muted">
                  Subtotal
                </dt>

                <dd className="font-bold text-storefront-text">
                  {money(
                    order.subtotal,
                    order.currencyCode
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-storefront-muted">
                  VAT
                </dt>

                <dd className="font-bold text-storefront-text">
                  {money(
                    order.taxAmount,
                    order.currencyCode
                  )}
                </dd>
              </div>

              <div className="flex justify-between gap-4">
                <dt className="text-storefront-muted">
                  Delivery
                </dt>

                <dd className="font-bold text-storefront-text">
                  {order.deliveryAmount ===
                  0
                    ? "Free"
                    : money(
                        order.deliveryAmount,
                        order.currencyCode
                      )}
                </dd>
              </div>

              {order.discountAmount >
              0 ? (
                <div className="flex justify-between gap-4 text-emerald-700">
                  <dt>
                    Discount
                  </dt>

                  <dd className="font-black">
                    -
                    {money(
                      order.discountAmount,
                      order.currencyCode
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>

            <div className="my-5 border-t border-storefront" />

            <div className="flex items-end justify-between gap-4">
              <span className="font-black text-storefront-text">
                Total
              </span>

              <span className="text-2xl font-black text-storefront-text">
                {money(
                  order.grandTotal,
                  order.currencyCode
                )}
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}