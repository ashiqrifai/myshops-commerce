"use client";

import {
  Check,
  ChevronRight,
  Clock3,
  Mail,
  Package,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import {
  useSearchParams,
} from "next/navigation";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  getTrackedOrder,
  requestOrderTrackingOtp,
  verifyOrderTrackingOtp,
} from "@/lib/order-tracking/orderTrackingApi";

import type {
  TrackedOrder,
} from "@/lib/order-tracking/orderTrackingApi";

const money =
  (
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
      value
    );

const formatDate =
  (
    value:
      string
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

export default function TrackOrderClient() {
  const searchParams =
    useSearchParams();

  const [
    orderNumber,
    setOrderNumber,
  ] =
    useState(
      ""
    );

  const [
    email,
    setEmail,
  ] =
    useState(
      ""
    );

  const [
    otp,
    setOtp,
  ] =
    useState(
      ""
    );

  const [
    step,
    setStep,
  ] =
    useState<
      "IDENTIFY" |
      "VERIFY" |
      "TRACK"
    >(
      "IDENTIFY"
    );

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
    message,
    setMessage,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const [
    trackedOrder,
    setTrackedOrder,
  ] =
    useState<
      TrackedOrder |
      null
    >(
      null
    );

  useEffect(
    () => {
      const order =
        searchParams.get(
          "order"
        );

      const emailValue =
        searchParams.get(
          "email"
        );

      if (
        order
      ) {
        setOrderNumber(
          order
        );
      }

      if (
        emailValue
      ) {
        setEmail(
          emailValue
        );
      }
    },
    [
      searchParams,
    ]
  );

  const sendOtp =
    async (
      event:
        FormEvent
    ) => {
      event
        .preventDefault();

      setError(
        null
      );

      setMessage(
        null
      );

      if (
        !orderNumber
          .trim() ||
        !email
          .trim()
      ) {
        setError(
          "Enter your order number and the email used during checkout."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        const result =
          await requestOrderTrackingOtp({
            orderNumber:
              orderNumber
                .trim(),

            email:
              email
                .trim(),
          });

        setMessage(
          result.message
        );

        setStep(
          "VERIFY"
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to send verification code."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const verify =
    async (
      event:
        FormEvent
    ) => {
      event
        .preventDefault();

      setError(
        null
      );

      if (
        !/^\d{6}$/.test(
          otp.trim()
        )
      ) {
        setError(
          "Enter the 6-digit verification code."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        const verification =
          await verifyOrderTrackingOtp({
            orderNumber:
              orderNumber
                .trim(),

            email:
              email
                .trim(),

            otp:
              otp
                .trim(),
          });

        const order =
          await getTrackedOrder({
            orderNumber:
              verification
                .orderNumber,

            accessToken:
              verification
                .accessToken,
          });

        sessionStorage.setItem(
          `myshops_tracking_${verification.orderNumber}`,
          verification
            .accessToken
        );

        setTrackedOrder(
          order
        );

        setStep(
          "TRACK"
        );
      } catch (
        requestError
      ) {
        setError(
          requestError instanceof
            Error
            ? requestError.message
            : "Unable to verify this order."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  const startAgain =
    () => {
      setStep(
        "IDENTIFY"
      );

      setOtp(
        ""
      );

      setTrackedOrder(
        null
      );

      setError(
        null
      );

      setMessage(
        null
      );
    };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
          MyShops
        </p>

        <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
          Track your order
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-storefront-muted">
          Guest checkout customers can securely track an order using the order number and the email address used at checkout.
        </p>
      </div>

      {step !==
      "TRACK" ? (
        <div className="mx-auto mt-8 max-w-xl rounded-[22px] border border-storefront bg-storefront-surface p-6 shadow-sm sm:p-8">
          {step ===
          "IDENTIFY" ? (
            <form
              onSubmit={
                sendOtp
              }
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-black text-storefront-text">
                  Order number
                </label>

                <div className="relative">
                  <Package className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-storefront-muted" />

                  <input
                    value={
                      orderNumber
                    }
                    onChange={
                      event =>
                        setOrderNumber(
                          event.target.value
                        )
                    }
                    placeholder="WEB-20260831..."
                    className="h-12 w-full rounded-xl border border-storefront bg-white pl-12 pr-4 text-sm outline-none focus:border-storefront-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-storefront-text">
                  Email used at checkout
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-storefront-muted" />

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={
                      event =>
                        setEmail(
                          event.target.value
                        )
                    }
                    placeholder="you@example.com"
                    className="h-12 w-full rounded-xl border border-storefront bg-white pl-12 pr-4 text-sm outline-none focus:border-storefront-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-storefront-primary px-5 text-sm font-black text-white disabled:opacity-60"
              >
                {loading
                  ? "Sending..."
                  : "Send verification code"}

                {!loading ? (
                  <ChevronRight
                    size={
                      18
                    }
                  />
                ) : null}
              </button>
            </form>
          ) : (
            <form
              onSubmit={
                verify
              }
              className="space-y-5"
            >
              <div className="rounded-xl bg-storefront-secondary p-4 text-sm text-storefront-text">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-storefront-primary" />

                  <div>
                    <p className="font-black">
                      Verification code sent
                    </p>

                    <p className="mt-1 text-xs leading-5 text-storefront-muted">
                      Enter the 6-digit code sent to the email address used for this order.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-storefront-text">
                  6-digit code
                </label>

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={
                    6
                  }
                  value={
                    otp
                  }
                  onChange={
                    event =>
                      setOtp(
                        event.target.value.replace(
                          /\D/g,
                          ""
                        )
                      )
                  }
                  placeholder="000000"
                  className="h-14 w-full rounded-xl border border-storefront bg-white px-4 text-center text-2xl font-black tracking-[0.35em] outline-none focus:border-storefront-primary"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading
                }
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-storefront-primary px-5 text-sm font-black text-white disabled:opacity-60"
              >
                {loading
                  ? "Verifying..."
                  : "Verify & track order"}
              </button>

              <button
                type="button"
                onClick={
                  startAgain
                }
                className="w-full text-sm font-black text-storefront-primary"
              >
                Change order details
              </button>
            </form>
          )}

          {message ? (
            <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              {message}
            </p>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}

      {step ===
        "TRACK" &&
      trackedOrder ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
                  Order
                </p>

                <h2 className="mt-2 text-2xl font-black text-storefront-text">
                  {
                    trackedOrder
                      .orderNumber
                  }
                </h2>

                <p className="mt-1 text-sm text-storefront-muted">
                  Placed{" "}
                  {formatDate(
                    trackedOrder
                      .placedAt
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                  {
                    trackedOrder
                      .orderStatus
                  }
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                  Payment:{" "}
                  {
                    trackedOrder
                      .paymentStatus
                  }
                </span>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            {trackedOrder
              .items
              .map(
                item => (
                  <section
                    key={
                      item.id
                    }
                    className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black text-storefront-text">
                          {
                            item.productName
                          }
                        </h3>

                        <p className="mt-1 text-xs text-storefront-muted">
                          SKU:{" "}
                          {
                            item.sku
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-storefront-secondary px-3 py-1 text-xs font-black text-storefront-primary">
                            {
                              item.fulfillmentLabel
                            }
                          </span>

                          {item
                            .fulfillmentLocation ? (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                              {item.fulfillmentMethod ===
                              "PICKUP"
                                ? "Pickup: "
                                : "Source: "}
                              {
                                item.fulfillmentLocation
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-sm font-black text-storefront-text">
                        {money(
                          item.lineTotal,
                          trackedOrder
                            .currencyCode
                        )}
                      </div>
                    </div>

                    <div className="mt-6 border-t border-storefront pt-6">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {item.timeline.map(
                          timelineStep => (
                            <div
                              key={
                                timelineStep.code
                              }
                              className={[
                                "rounded-xl border p-3",
                                timelineStep.completed
                                  ? "border-emerald-200 bg-emerald-50"
                                  : "border-storefront bg-white",
                              ].join(
                                " "
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={[
                                    "flex h-7 w-7 items-center justify-center rounded-full",
                                    timelineStep.completed
                                      ? "bg-emerald-600 text-white"
                                      : "bg-slate-100 text-slate-400",
                                  ].join(
                                    " "
                                  )}
                                >
                                  {timelineStep.completed ? (
                                    <Check
                                      size={
                                        15
                                      }
                                    />
                                  ) : (
                                    <Clock3
                                      size={
                                        14
                                      }
                                    />
                                  )}
                                </div>

                                <span className="text-xs font-black text-storefront-text">
                                  {
                                    timelineStep.label
                                  }
                                </span>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </section>
                )
              )}
          </div>

          <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-storefront-primary" />

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                    Fulfillment
                  </p>

                  <p className="mt-1 font-black text-storefront-text">
                    {
                      trackedOrder
                        .fulfillmentStatus
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-storefront-primary" />

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-storefront-muted">
                    Total
                  </p>

                  <p className="mt-1 font-black text-storefront-text">
                    {money(
                      trackedOrder
                        .grandTotal,
                      trackedOrder
                        .currencyCode
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <button
            type="button"
            onClick={
              startAgain
            }
            className="mx-auto block text-sm font-black text-storefront-primary"
          >
            Track another order
          </button>
        </div>
      ) : null}
    </main>
  );
}
