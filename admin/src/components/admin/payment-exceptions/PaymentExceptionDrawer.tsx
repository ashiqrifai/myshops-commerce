"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RotateCcw,
  X,
} from "lucide-react";

import type {
  PaymentException,
} from "@/types/paymentException";

interface Props {
  open: boolean;
  exception:
    | PaymentException
    | null;
  loading?: boolean;
  busy?: boolean;
  onClose: () => void;
  onRetry: () => void;
  onManualReview: () => void;
  onResolve: () => void;
  onRefundRequired: () => void;
  onRefunded: () => void;
}

function money(
  value:
    number | string | null | undefined,
  currencyCode?:
    string | null
) {
  return new Intl.NumberFormat(
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
}

function dateTime(
  value?:
    string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      dateStyle:
        "medium",
      timeStyle:
        "short",
    }
  ).format(
    date
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value:
    React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-[#eceeef] py-3 last:border-b-0">
      <span className="text-xs font-medium text-[#6d7175]">
        {label}
      </span>

      <span
        className={[
          "min-w-0 break-words text-sm text-[#202223]",
          mono
            ? "font-mono text-xs"
            : "",
        ].join(
          " "
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function PaymentExceptionDrawer({
  open,
  exception,
  loading = false,
  busy = false,
  onClose,
  onRetry,
  onManualReview,
  onResolve,
  onRefundRequired,
  onRefunded,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close exception details"
        className="absolute inset-0 bg-black/25"
        onClick={
          onClose
        }
      />

      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[720px] flex-col border-l border-[#dfe3e8] bg-[#f6f6f7] shadow-2xl">
        <header className="flex min-h-16 items-center justify-between border-b border-[#dfe3e8] bg-white px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8c9196]">
              Payment exception
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[#202223]">
              {exception
                ?.order
                ?.orderNumber ||
                "Exception details"}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8dadd] bg-white text-[#303030] hover:bg-[#f6f6f7]"
          >
            <X
              size={
                18
              }
            />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {loading ||
          !exception ? (
            <div className="rounded-xl border border-[#e1e3e5] bg-white p-8 text-center text-sm text-[#6d7175]">
              Loading exception details...
            </div>
          ) : (
            <div className="space-y-5">
              <section className="rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle
                    size={
                      20
                    }
                    className="mt-0.5 shrink-0 text-red-700"
                  />

                  <div>
                    <p className="font-semibold text-red-900">
                      {
                        exception.title
                      }
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      {
                        exception.message ||
                        "This payment requires operational review."
                      }
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-[#e1e3e5] bg-white p-4">
                <h3 className="font-semibold text-[#202223]">
                  Exception
                </h3>

                <div className="mt-2">
                  <InfoRow
                    label="Code"
                    value={
                      exception.exceptionCode
                    }
                    mono
                  />

                  <InfoRow
                    label="Provider"
                    value={
                      exception.provider
                    }
                  />

                  <InfoRow
                    label="Provider state"
                    value={
                      exception.providerState ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Status"
                    value={
                      exception.status
                    }
                  />

                  <InfoRow
                    label="Severity"
                    value={
                      exception.severity
                    }
                  />

                  <InfoRow
                    label="Retry count"
                    value={
                      exception.retryCount
                    }
                  />

                  <InfoRow
                    label="Created"
                    value={
                      dateTime(
                        exception.createdAt
                      )
                    }
                  />

                  <InfoRow
                    label="Last retry"
                    value={
                      dateTime(
                        exception.lastRetryAt
                      )
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border border-[#e1e3e5] bg-white p-4">
                <h3 className="font-semibold text-[#202223]">
                  Order & payment
                </h3>

                <div className="mt-2">
                  <InfoRow
                    label="Order"
                    value={
                      exception.order
                        ?.orderNumber ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Customer"
                    value={
                      [
                        exception.order
                          ?.customerFirstName,
                        exception.order
                          ?.customerLastName,
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          " "
                        ) ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Email"
                    value={
                      exception.order
                        ?.customerEmail ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Phone"
                    value={
                      exception.order
                        ?.customerPhone ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Amount"
                    value={
                      money(
                        exception.amount ??
                          exception.order
                            ?.grandTotal,
                        exception.currencyCode ??
                          exception.order
                            ?.currencyCode
                      )
                    }
                  />

                  <InfoRow
                    label="Payment"
                    value={
                      exception.order
                        ?.paymentStatus ||
                      exception.payment
                        ?.status ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Order status"
                    value={
                      exception.order
                        ?.orderStatus ||
                      "—"
                    }
                  />

                  <InfoRow
                    label="Provider reference"
                    value={
                      exception.payment
                        ?.providerReference ||
                      "—"
                    }
                    mono
                  />
                </div>
              </section>

              {exception.order
                ?.shipments
                ?.length ? (
                <section className="rounded-xl border border-[#e1e3e5] bg-white p-4">
                  <h3 className="font-semibold text-[#202223]">
                    Shipment allocation
                  </h3>

                  <div className="mt-3 space-y-3">
                    {exception.order.shipments.map(
                      (
                        shipment
                      ) => (
                        <div
                          key={
                            shipment.id
                          }
                          className="rounded-lg border border-[#e1e3e5] bg-[#fafafa] p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold">
                              {
                                shipment.shipmentNumber
                              }
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {
                                shipment.status
                              }
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[#6d7175]">
                            {
                              shipment.deliveryLabel ||
                              shipment.deliveryZoneCode ||
                              shipment.deliveryMethod
                            }
                          </p>

                          {shipment.allocations
                            ?.length ? (
                            <div className="mt-3 space-y-2">
                              {shipment.allocations.map(
                                (
                                  allocation
                                ) => (
                                  <div
                                    key={
                                      allocation.id
                                    }
                                    className="flex items-center justify-between gap-4 rounded-md bg-white px-3 py-2 text-xs"
                                  >
                                    <span>
                                      {
                                        allocation.inventoryLocation
                                          ?.name ||
                                        allocation.inventoryLocation
                                          ?.code ||
                                        "Location"
                                      }
                                    </span>

                                    <span className="font-semibold">
                                      Qty{" "}
                                      {
                                        allocation.quantityAllocated
                                      }{" "}
                                      ·{" "}
                                      {
                                        allocation.status
                                      }
                                    </span>
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
              ) : null}

              {exception.resolutionNote ? (
                <section className="rounded-xl border border-[#e1e3e5] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      size={
                        18
                      }
                      className="mt-0.5 text-emerald-600"
                    />

                    <div>
                      <p className="text-sm font-semibold text-[#202223]">
                        Resolution note
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#6d7175]">
                        {
                          exception.resolutionNote
                        }
                      </p>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </div>

        {exception ? (
          <footer className="border-t border-[#dfe3e8] bg-white p-4">
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={
                  busy
                }
                onClick={
                  onManualReview
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] hover:bg-[#f6f6f7] disabled:opacity-50"
              >
                <Clock3
                  size={
                    15
                  }
                />
                Manual review
              </button>

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={
                  onRefundRequired
                }
                className="inline-flex h-10 items-center rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                Refund required
              </button>

              {exception.status ===
              "REFUND_REQUIRED" ? (
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={
                    onRefunded
                  }
                  className="inline-flex h-10 items-center rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  Mark refunded
                </button>
              ) : null}

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={
                  onRetry
                }
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50"
              >
                <RotateCcw
                  size={
                    15
                  }
                />
                Retry allocation
              </button>

              <button
                type="button"
                disabled={
                  busy
                }
                onClick={
                  onResolve
                }
                className="inline-flex h-10 items-center rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] hover:bg-[#f6f6f7] disabled:opacity-50"
              >
                Resolve
              </button>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
