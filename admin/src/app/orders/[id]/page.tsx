"use client";

import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  Package,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  Truck,
  UserRound,
  Webhook,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import AdminShell from "@/components/admin/AdminShell";

import {
  useGetAdminOrderByIdQuery,
  useRefundTamaraPaymentMutation,
  useRetryZohoSalesOrderMutation,
  useUpdateAdminShipmentStatusMutation,
} from "@/store/api/orderApi";

import {
  useAppSelector,
} from "@/store/hooks";

import type {
  AdminOrderPayment,
} from "@/types/order";

const money = (
  value:
    number |
    string |
    null |
    undefined,
  currency =
    "AED"
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency,

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

const dateTime = (
  value?:
    string |
    null
) => {
  if (!value) {
    return "-";
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
    return "-";
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
};

const getApiErrorMessage = (
  error:
    unknown
) => {
  const apiError =
    error as {
      data?: {
        message?:
          string;

        error?: {
          message?:
            string;
        };
      };
    };

  return (
    apiError?.data
      ?.error
      ?.message ||
    apiError?.data
      ?.message ||
    "The request could not be completed."
  );
};

const paymentStatus = (
  payment:
    AdminOrderPayment
) =>
  String(
    payment.paymentStatus ||
      payment.status ||
      ""
  ).toUpperCase();

const getTamaraStatus = (
  payment?:
    AdminOrderPayment
) => {
  const payload =
    payment
      ?.providerPayload;

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return "";
  }

  const value =
    payload[
      "tamaraStatus"
    ];

  return String(
    value ||
    ""
  );
};

const getAcceptedRefundTotal = (
  payment?:
    AdminOrderPayment
) => {
  const payload =
    payment
      ?.providerPayload;

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return 0;
  }

  const refunds =
    payload[
      "refunds"
    ];

  if (
    !Array.isArray(
      refunds
    )
  ) {
    return 0;
  }

  return Number(
    refunds
      .filter(
        (
          item
        ) => {
          if (
            !item ||
            typeof item !==
              "object"
          ) {
            return false;
          }

          return (
            (
              item as Record<
                string,
                unknown
              >
            ).accepted ===
            true
          );
        }
      )
      .reduce(
        (
          total,
          item
        ) => {
          const row =
            item as Record<
              string,
              unknown
            >;

          return (
            total +
            Number(
              row.amount ||
                0
            )
          );
        },
        0
      )
      .toFixed(
        2
      )
  );
};

const getItemFulfillment =
  (
    item:
      unknown
  ) => {
    const row =
      item as {
        selectedDeliveryMethod?:
          string | null;

        fulfillmentMethod?:
          string | null;

        fulfilmentMethod?:
          string | null;

        deliveryMethod?:
          string | null;

        deliveryLabel?:
          string | null;

        fulfillmentLabel?:
          string | null;

        pickupLocationName?:
          string | null;

        selectedPickupLocationName?:
          string | null;

        pickupLocationCode?:
          string | null;

        selectedPickupLocationId?:
          string | null;

        allocatedLocationName?:
          string | null;

        sourceLocationName?:
          string | null;

        shipmentId?:
          string | null;

        shipmentNumber?:
          string | null;

        shipmentStatus?:
          string | null;
      };

    const method =
      String(
        row
          .selectedDeliveryMethod ||
        row
          .fulfillmentMethod ||
        row
          .fulfilmentMethod ||
        row
          .deliveryMethod ||
        "STANDARD"
      )
        .trim()
        .toUpperCase();

    const pickupName =
      row
        .pickupLocationName ||
      row
        .selectedPickupLocationName ||
      row
        .allocatedLocationName ||
      row
        .sourceLocationName ||
      row
        .pickupLocationCode ||
      null;

    const label =
      row
        .fulfillmentLabel ||
      row
        .deliveryLabel ||
      null;

    const shipmentId =
      row.shipmentId ||
      null;

    const shipmentNumber =
      row.shipmentNumber ||
      null;

    const shipmentStatus =
      String(
        row.shipmentStatus ||
        "PENDING"
      )
        .trim()
        .toUpperCase();

    if (
      method ===
      "PICKUP"
    ) {
      return {
        method,
        label:
          pickupName
            ? `Store Pickup - ${pickupName}`
            : (
                label ||
                "Store Pickup"
              ),

        location:
          pickupName ||
          null,

        pickupLocationId:
          row
            .selectedPickupLocationId ||
          null,

        shipmentId,
        shipmentNumber,
        shipmentStatus,
      };
    }

    if (
      method ===
      "EXPRESS"
    ) {
      return {
        method,
        label:
          label ||
          "Express Delivery",

        location:
          row
            .allocatedLocationName ||
          row
            .sourceLocationName ||
          null,

        pickupLocationId:
          null,

        shipmentId,
        shipmentNumber,
        shipmentStatus,
      };
    }

    return {
      method:
        "STANDARD",

      label:
        label ||
        "Standard Delivery",

      location:
        row
          .allocatedLocationName ||
        row
          .sourceLocationName ||
        null,

      pickupLocationId:
        null,

      shipmentId,
      shipmentNumber,
      shipmentStatus,
    };
  };

  type ShipmentAction = {
    status:
      | "READY"
      | "DISPATCHED"
      | "DELIVERED";
  
    label:
      string;
  };
  
  const getNextShipmentAction =
    ({
      method,
      status,
    }: {
      method:
        string;
  
      status:
        string;
    }): ShipmentAction | null => {
      const normalizedMethod =
        String(
          method ||
          ""
        )
          .trim()
          .toUpperCase();
  
      const normalizedStatus =
        String(
          status ||
          "PENDING"
        )
          .trim()
          .toUpperCase();
  
      if (
        [
          "PENDING",
          "ALLOCATED",
        ].includes(
          normalizedStatus
        )
      ) {
        return {
          status:
            "READY",
  
          label:
            normalizedMethod ===
            "PICKUP"
              ? "Mark Ready for Pickup"
              : "Ready to Dispatch",
        };
      }
  
      if (
        normalizedStatus ===
        "READY"
      ) {
        return normalizedMethod ===
          "PICKUP"
          ? {
              status:
                "DELIVERED",
  
              label:
                "Mark Collected",
            }
          : {
              status:
                "DISPATCHED",
  
              label:
                "Mark Dispatched",
            };
      }
  
      if (
        normalizedStatus ===
          "DISPATCHED" &&
        normalizedMethod !==
          "PICKUP"
      ) {
        return {
          status:
            "DELIVERED",
  
          label:
            "Mark Delivered",
        };
      }
  
      return null;
    };

export default function OrderDetailPage() {
  const params =
    useParams<{
      id:
        string;
    }>();

  const router =
    useRouter();

  const orderId =
    params.id;

  const {
    accessToken,
    initialized,
  } =
    useAppSelector(
      (
        state
      ) =>
        state.auth
    );

  const [
    refundOpen,
    setRefundOpen,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      if (
        initialized &&
        !accessToken
      ) {
        router.replace(
          "/login"
        );
      }
    },
    [
      initialized,
      accessToken,
      router,
    ]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetAdminOrderByIdQuery(
      orderId,
      {
        skip:
          !accessToken ||
          !orderId,
      }
    );

  const [
    retryZohoSalesOrder,
    {
      isLoading:
        isRetryingZoho,
    },
  ] =
    useRetryZohoSalesOrderMutation();

  const [
    updateAdminShipmentStatus,
    {
      isLoading:
        isUpdatingShipmentStatus,
    },
  ] =
    useUpdateAdminShipmentStatusMutation();

  const [
    updatingShipmentId,
    setUpdatingShipmentId,
  ] =
    useState<
      string |
      null
    >(
      null
    );

  const detail =
    data?.data;

  const order =
    detail?.order;

  const items =
    detail?.items ||
    [];

  const fulfillmentRows =
    items.map(
      item => ({
        item,
        ...getItemFulfillment(
          item
        ),
      })
    );

  const fulfillmentMethods =
    Array.from(
      new Set(
        fulfillmentRows.map(
          row =>
            row.method
        )
      )
    );

  const fulfillmentSummary =
    fulfillmentMethods.length >
      1
      ? "MIXED"
      : (
          fulfillmentMethods[0] ||
          order?.deliveryMethod ||
          "-"
        );

  const shipmentRows =
    Array.from(
      new Map(
        fulfillmentRows
          .filter(
            row =>
              Boolean(
                row.shipmentId
              )
          )
          .map(
            row => [
              String(
                row.shipmentId
              ),
              row,
            ]
          )
      ).values()
    );

  const zohoOrder =
    order as
      | (
          typeof order & {
            zohoSyncStatus?:
              string | null;

            zohoSyncError?:
              string | null;

            zohoSalesOrderNumber?:
              string | null;

            zohoSalesOrderId?:
              string | null;
          }
        )
      | undefined;

  const addresses =
    detail?.addresses ||
    [];

  const payments =
    detail?.payments ||
    [];

  const statusHistory =
    detail
      ?.statusHistory ||
    [];

  const webhookLogs =
    detail
      ?.webhookLogs ||
    [];

  const shippingAddress =
    addresses.find(
      (
        address
      ) =>
        String(
          address.addressType ||
            ""
        ).toUpperCase() ===
        "SHIPPING"
    ) ||
    addresses[0];

  const tamaraPayment =
    useMemo(
      () =>
        payments.find(
          (
            payment
          ) =>
            String(
              payment.provider ||
                payment.paymentMethod ||
                ""
            ).toUpperCase() ===
              "TAMARA"
        ),
      [
        payments,
      ]
    );

  const acceptedRefundTotal =
    getAcceptedRefundTotal(
      tamaraPayment
    );

  const refundableBalance =
    Math.max(
      0,
      Number(
        (
          Number(
            order?.grandTotal ||
              0
          ) -
          acceptedRefundTotal
        ).toFixed(
          2
        )
      )
    );

  const canRefundTamara =
    Boolean(
      order &&
        tamaraPayment &&
        refundableBalance >
          0 &&
        [
          "PAID",
          "PARTIALLY_REFUNDED",
        ].includes(
          String(
            order.paymentStatus
          ).toUpperCase()
        )
    );

  const retryZoho =
    async () => {
      if (
        !order
      ) {
        return;
      }

      try {
        const result =
          await retryZohoSalesOrder(
            order.id
          ).unwrap();

        toast.success(
          result
            ?.data
            ?.zohoSalesOrderNumber
            ? `Zoho Sales Order ${result.data.zohoSalesOrderNumber} posted successfully.`
            : "Zoho Sales Order posted successfully."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error
          )
        );
      }
    };


    const updateShipmentStatus =
    async ({
      shipmentId,
      status,
      label,
    }: {
      shipmentId:
        string;
  
      status:
        | "READY"
        | "DISPATCHED"
        | "DELIVERED";
  
      label:
        string;
    }) => {
      if (
        !order
      ) {
        return;
      }

      try {
        setUpdatingShipmentId(
          shipmentId
        );

        await updateAdminShipmentStatus({
          id:
            order.id,

          shipmentId,

          body: {
            status,
          },
        }).unwrap();

        toast.success(
          label
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error
          )
        );
      } finally {
        setUpdatingShipmentId(
          null
        );
      }
    };

  if (
    !initialized ||
    (
      initialized &&
      !accessToken
    )
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f1f2f3]">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#008060]" />
      </div>
    );
  }

  return (
    <AdminShell>
      <main className="min-h-screen bg-[#f1f2f3]">
        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <Link
                href="/orders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#006e52] hover:underline"
              >
                <ArrowLeft className="h-4 w-4" />

                Back to orders
              </Link>

              <h1 className="mt-2 text-2xl font-bold text-[#202223]">
                {order
                  ?.orderNumber ||
                  "Order"}
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                refetch()
              }
              disabled={
                isFetching
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold shadow-sm"
            >
              <RefreshCcw
                className={`h-4 w-4 ${
                  isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </button>
          </div>

          {isLoading ? (
            <div className="rounded-xl border border-[#e1e3e5] bg-white py-24 text-center">
              <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-[#008060]" />

              <p className="mt-3 text-sm text-[#6d7175]">
                Loading order...
              </p>
            </div>
          ) : isError ||
            !order ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">
              <p className="font-semibold text-red-700">
                Unable to load order.
              </p>
            </div>
          ) : (
            <>
              {/* Status row */}

              <div className="mb-5 grid gap-4 md:grid-cols-5">
                <Metric
                  label="Order"
                  value={
                    order.orderStatus
                  }
                  icon={
                    Package
                  }
                />

                <Metric
                  label="Payment"
                  value={
                    order.paymentStatus
                  }
                  icon={
                    CreditCard
                  }
                />

                <Metric
                  label="Fulfillment"
                  value={
                    order.fulfillmentStatus
                  }
                  icon={
                    Truck
                  }
                />

                <Metric
                  label="Zoho"
                  value={
                    zohoOrder
                      ?.zohoSyncStatus ||
                    "PENDING"
                  }
                  icon={
                    Webhook
                  }
                />

                <Metric
                  label="Total"
                  value={money(
                    order.grandTotal,
                    order.currencyCode
                  )}
                  icon={
                    CheckCircle2
                  }
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-5">
                  {/* Items */}

                  <Card
                    title="Order items"
                    icon={
                      Package
                    }
                  >
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-[#e1e3e5] text-left text-xs uppercase tracking-wide text-[#6d7175]">
                            <th className="pb-3">
                              Product
                            </th>

                            <th className="pb-3">
                              Fulfillment
                            </th>

                            <th className="pb-3">
                              Qty
                            </th>

                            <th className="pb-3 text-right">
                              Unit
                            </th>

                            <th className="pb-3 text-right">
                              Tax
                            </th>

                            <th className="pb-3 text-right">
                              Total
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {items.map(
                            (
                              item
                            ) => (
                              <tr
                                key={
                                  item.id
                                }
                                className="border-b border-[#f1f2f3] last:border-0"
                              >
                                <td className="py-4">
                                  <div className="font-semibold">
                                    {
                                      item.productName
                                    }
                                  </div>

                                  <div className="text-xs text-[#6d7175]">
                                    {
                                      item.variantName
                                    }

                                    {item.sku
                                      ? ` · ${item.sku}`
                                      : ""}
                                  </div>
                                </td>

                                <td className="py-4">
                                  {(() => {
                                    const fulfillment =
                                      getItemFulfillment(
                                        item
                                      );

                                    return (
                                      <div>
                                        <StatusBadge
                                          value={
                                            fulfillment.method
                                          }
                                        />

                                        <div className="mt-1 max-w-[260px] text-xs font-medium text-[#6d7175]">
                                          {
                                            fulfillment.label
                                          }
                                        </div>

                                        {fulfillment.location ? (
                                          <div className="mt-0.5 text-xs text-[#8c9196]">
                                            Location:{" "}
                                            {
                                              fulfillment.location
                                            }
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })()}
                                </td>

                                <td className="py-4">
                                  {
                                    item.quantity
                                  }
                                </td>

                                <td className="py-4 text-right">
                                  {money(
                                    item.unitPrice,
                                    order.currencyCode
                                  )}
                                </td>

                                <td className="py-4 text-right">
                                  {money(
                                    item.taxAmount,
                                    order.currencyCode
                                  )}
                                </td>

                                <td className="py-4 text-right font-semibold">
                                  {money(
                                    item.lineTotal,
                                    order.currencyCode
                                  )}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="ml-auto mt-5 max-w-sm space-y-2 border-t border-[#e1e3e5] pt-4 text-sm">
                      <TotalRow
                        label="Subtotal"
                        value={money(
                          order.subtotal,
                          order.currencyCode
                        )}
                      />

                      <TotalRow
                        label="Discount"
                        value={`-${money(
                          order.discountAmount,
                          order.currencyCode
                        )}`}
                      />

                      <TotalRow
                        label="Delivery"
                        value={money(
                          order.deliveryAmount,
                          order.currencyCode
                        )}
                      />

                      <TotalRow
                        label="Tax"
                        value={money(
                          order.taxAmount,
                          order.currencyCode
                        )}
                      />

                      <TotalRow
                        label="Grand total"
                        value={money(
                          order.grandTotal,
                          order.currencyCode
                        )}
                        strong
                      />
                    </div>
                  </Card>

                  {/* Payments */}

                  <Card
                    title="Payments"
                    icon={
                      CreditCard
                    }
                  >
                    {payments.length ? (
                      <div className="space-y-4">
                        {payments.map(
                          (
                            payment
                          ) => (
                            <div
                              key={
                                payment.id
                              }
                              className="rounded-lg border border-[#e1e3e5] p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="font-bold text-[#202223]">
                                    {payment.provider ||
                                      payment.paymentMethod ||
                                      "Payment"}
                                  </div>

                                  <div className="mt-1 text-xs text-[#6d7175]">
                                    MyShops payment ID:{" "}
                                    {
                                      payment.id
                                    }
                                  </div>
                                </div>

                                <StatusBadge
                                  value={paymentStatus(
                                    payment
                                  )}
                                />
                              </div>

                              <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                                <Info
                                  label="Amount"
                                  value={money(
                                    payment.amount ||
                                      order.grandTotal,
                                    payment.currencyCode ||
                                      payment.currency ||
                                      order.currencyCode
                                  )}
                                />

                                <Info
                                  label="Provider reference"
                                  value={
                                    payment.providerReference ||
                                    "-"
                                  }
                                />

                                {String(
                                  payment.provider
                                ).toUpperCase() ===
                                "TAMARA" ? (
                                  <>
                                    <Info
                                      label="Tamara status"
                                      value={
                                        getTamaraStatus(
                                          payment
                                        ) ||
                                        "-"
                                      }
                                    />

                                    <Info
                                      label="Refunded locally"
                                      value={money(
                                        acceptedRefundTotal,
                                        order.currencyCode
                                      )}
                                    />
                                  </>
                                ) : null}
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <Empty text="No payment records." />
                    )}
                  </Card>

                  {/* Webhook audit */}

                  {tamaraPayment ? (
                    <Card
                      title="Tamara webhook history"
                      icon={
                        Webhook
                      }
                    >
                      {webhookLogs.length ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b text-left text-xs uppercase text-[#6d7175]">
                                <th className="pb-3">
                                  Event
                                </th>

                                <th className="pb-3">
                                  Status
                                </th>

                                <th className="pb-3">
                                  Processing
                                </th>

                                <th className="pb-3">
                                  Received
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {webhookLogs.map(
                                (
                                  log
                                ) => (
                                  <tr
                                    key={
                                      log.id
                                    }
                                    className="border-b border-[#f1f2f3] last:border-0"
                                  >
                                    <td className="py-3 font-medium">
                                      {log.eventType ||
                                        "-"}
                                    </td>

                                    <td className="py-3">
                                      {log.providerStatus ||
                                        "-"}
                                    </td>

                                    <td className="py-3">
                                      <StatusBadge
                                        value={
                                          log.processingStatus
                                        }
                                      />
                                    </td>

                                    <td className="py-3 text-sm text-[#6d7175]">
                                      {dateTime(
                                        log.receivedAt
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <Empty text="No Tamara webhook events recorded for this order." />
                      )}
                    </Card>
                  ) : null}

                  {/* Status history */}

                  <Card
                    title="Status history"
                    icon={
                      ShieldCheck
                    }
                  >
                    {statusHistory.length ? (
                      <div className="space-y-4">
                        {statusHistory.map(
                          (
                            history
                          ) => (
                            <div
                              key={
                                history.id
                              }
                              className="flex gap-3 border-b border-[#f1f2f3] pb-4 last:border-0 last:pb-0"
                            >
                              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#008060]" />

                              <div>
                                <div className="text-sm font-semibold">
                                  {
                                    history.statusType
                                  }
                                  :{" "}
                                  {history.fromStatus ||
                                    "-"}{" "}
                                  →{" "}
                                  {
                                    history.toStatus
                                  }
                                </div>

                                {history.note ? (
                                  <div className="mt-1 text-sm text-[#6d7175]">
                                    {
                                      history.note
                                    }
                                  </div>
                                ) : null}

                                <div className="mt-1 text-xs text-[#8c9196]">
                                  {dateTime(
                                    history.createdAt
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <Empty text="No status history." />
                    )}
                  </Card>
                </div>

                {/* Right side */}

                <div className="space-y-5">
                  <Card
                    title="Customer"
                    icon={
                      UserRound
                    }
                  >
                    <Info
                      label="Name"
                      value={
                        [
                          order.customerFirstName,
                          order.customerLastName,
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          ) ||
                        "Guest"
                      }
                    />

                    <Info
                      label="Email"
                      value={
                        order.customerEmail ||
                        "-"
                      }
                    />

                    <Info
                      label="Phone"
                      value={
                        order.customerPhone ||
                        "-"
                      }
                    />
                  </Card>

                  <Card
                    title="Fulfillment"
                    icon={
                      Truck
                    }
                  >
                    <Info
                      label="Overall"
                      value={
                        fulfillmentSummary
                      }
                    />

                    {fulfillmentRows.length ? (
                      <div className="mb-5 space-y-3">
                        {fulfillmentRows.map(
                          (
                            row,
                            index
                          ) => (
                            <div
                              key={
                                (
                                  row.item as {
                                    id?:
                                      string;
                                  }
                                ).id ||
                                index
                              }
                              className="rounded-lg border border-[#e1e3e5] bg-[#fafbfb] p-3"
                            >
                              <div className="text-xs font-semibold uppercase tracking-wide text-[#8c9196]">
                                Item {index + 1}
                              </div>

                              <div className="mt-1 text-sm font-semibold text-[#202223]">
                                {
                                  (
                                    row.item as {
                                      productName?:
                                        string;
                                    }
                                  ).productName
                                }
                              </div>

                              <div className="mt-2">
                                <StatusBadge
                                  value={
                                    row.method
                                  }
                                />
                              </div>

                              <div className="mt-1 text-sm text-[#6d7175]">
                                {
                                  row.label
                                }
                              </div>

                              {row.shipmentId ? (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-[#8c9196]">
                                    Shipment:
                                  </span>

                                  <StatusBadge
                                    value={
                                      row.shipmentStatus
                                    }
                                  />
                                </div>
                              ) : null}
                            </div>
                          )
                        )}
                      </div>
                    ) : null}

                    {shipmentRows.length ? (
                      <div className="mb-5 border-t border-[#e1e3e5] pt-5">
                        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8c9196]">
                          Shipment actions
                        </div>

                        <div className="space-y-3">
                          {shipmentRows.map(
                            row => {
                              const nextAction =
                                getNextShipmentAction({
                                  method:
                                    row.method,

                                  status:
                                    row.shipmentStatus,
                                });

                              const shipmentId =
                                String(
                                  row.shipmentId
                                );

                              return (
                                <div
                                  key={
                                    shipmentId
                                  }
                                  className="rounded-lg border border-[#e1e3e5] p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-[#202223]">
                                        {row.shipmentNumber ||
                                          row.label}
                                      </div>

                                      <div className="mt-1 flex flex-wrap items-center gap-2">
                                        <StatusBadge
                                          value={
                                            row.method
                                          }
                                        />

                                        <StatusBadge
                                          value={
                                            row.shipmentStatus
                                          }
                                        />
                                      </div>
                                    </div>

                                    {nextAction ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateShipmentStatus({
                                            shipmentId,

                                            status:
                                              nextAction.status,

                                            label:
                                              nextAction.label,
                                          })
                                        }
                                        disabled={
                                          isUpdatingShipmentStatus &&
                                          updatingShipmentId ===
                                            shipmentId
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#008060] px-4 text-sm font-bold text-white hover:bg-[#006e52] disabled:opacity-60"
                                      >
                                        {isUpdatingShipmentStatus &&
                                        updatingShipmentId ===
                                          shipmentId ? (
                                          <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Truck className="h-4 w-4" />
                                        )}

                                        {
                                          nextAction.label
                                        }
                                      </button>
                                    ) : (
                                      <div className="text-xs font-semibold text-[#6d7175]">
                                        {row.shipmentStatus ===
                                        "DELIVERED"
                                          ? row.method ===
                                            "PICKUP"
                                            ? "Collected"
                                            : "Delivered"
                                          : row.shipmentStatus}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    ) : null}

                    {shippingAddress ? (
                      <>
                        <Info
                          label="Delivery Address"
                          value={[
                            shippingAddress.addressLine1,
                            shippingAddress.addressLine2,
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
                        />

                        <Info
                          label="Landmark"
                          value={
                            shippingAddress.landmark ||
                            "-"
                          }
                        />
                      </>
                    ) : null}
                  </Card>

                  <Card
                    title="Zoho"
                    icon={
                      Webhook
                    }
                  >
                    <Info
                      label="Sync Status"
                      value={
                        <StatusBadge
                          value={
                            zohoOrder
                              ?.zohoSyncStatus ||
                            "PENDING"
                          }
                        />
                      }
                    />

                    <Info
                      label="Sales Order"
                      value={
                        zohoOrder
                          ?.zohoSalesOrderNumber ||
                        "-"
                      }
                    />

                    {zohoOrder
                      ?.zohoSyncError ? (
                      <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        {
                          zohoOrder
                            .zohoSyncError
                        }
                      </div>
                    ) : null}

                    {String(
                      zohoOrder
                        ?.zohoSyncStatus ||
                      ""
                    ).toUpperCase() ===
                    "FAILED" ? (
                      <button
                        type="button"
                        onClick={
                          retryZoho
                        }
                        disabled={
                          isRetryingZoho
                        }
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#008060] px-4 text-sm font-bold text-white hover:bg-[#006e52] disabled:opacity-60"
                      >
                        <RotateCcw
                          className={`h-4 w-4 ${
                            isRetryingZoho
                              ? "animate-spin"
                              : ""
                          }`}
                        />

                        Re-push to Zoho
                      </button>
                    ) : null}
                  </Card>

                  {tamaraPayment ? (
                    <Card
                      title="Tamara"
                      icon={
                        CreditCard
                      }
                    >
                      <Info
                        label="Tamara order ID"
                        value={
                          tamaraPayment.providerReference ||
                          "-"
                        }
                      />

                      <Info
                        label="Tamara status"
                        value={
                          getTamaraStatus(
                            tamaraPayment
                          ) ||
                          "-"
                        }
                      />

                      <Info
                        label="Captured amount"
                        value={money(
                          order.grandTotal,
                          order.currencyCode
                        )}
                      />

                      <Info
                        label="Refunded"
                        value={money(
                          acceptedRefundTotal,
                          order.currencyCode
                        )}
                      />

                      <Info
                        label="Refundable"
                        value={money(
                          refundableBalance,
                          order.currencyCode
                        )}
                      />

                      {canRefundTamara ? (
                        <button
                          type="button"
                          onClick={() =>
                            setRefundOpen(
                              true
                            )
                          }
                          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#b42318] px-4 text-sm font-bold text-white hover:bg-[#912018]"
                        >
                          <RotateCcw className="h-4 w-4" />

                          Refund Tamara Payment
                        </button>
                      ) : (
                        <div className="mt-5 rounded-lg bg-[#f6f6f7] p-3 text-sm text-[#6d7175]">
                          This payment currently has no refundable balance.
                        </div>
                      )}
                    </Card>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>

        {order &&
        tamaraPayment &&
        refundOpen ? (
          <TamaraRefundDialog
            orderId={
              order.id
            }
            orderNumber={
              order.orderNumber
            }
            currency={
              order.currencyCode
            }
            originalAmount={
              Number(
                order.grandTotal
              )
            }
            refundedAmount={
              acceptedRefundTotal
            }
            refundableAmount={
              refundableBalance
            }
            onClose={() =>
              setRefundOpen(
                false
              )
            }
            onCompleted={
              async () => {
                setRefundOpen(
                  false
                );

                await refetch();
              }
            }
          />
        ) : null}
      </main>
    </AdminShell>
  );
}

function TamaraRefundDialog({
  orderId,
  orderNumber,
  currency,
  originalAmount,
  refundedAmount,
  refundableAmount,
  onClose,
  onCompleted,
}: {
  orderId:
    string;

  orderNumber:
    string;

  currency:
    string;

  originalAmount:
    number;

  refundedAmount:
    number;

  refundableAmount:
    number;

  onClose:
    () => void;

  onCompleted:
    () => Promise<void>;
}) {
  const [
    amount,
    setAmount,
  ] =
    useState(
      refundableAmount.toFixed(
        2
      )
    );

  const [
    comment,
    setComment,
  ] =
    useState(
      ""
    );

  const [
    refundTamara,
    {
      isLoading,
    },
  ] =
    useRefundTamaraPaymentMutation();

  const submit =
    async () => {
      const numericAmount =
        Number(
          amount
        );

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount <=
          0
      ) {
        toast.error(
          "Enter a valid refund amount."
        );

        return;
      }

      if (
        numericAmount >
        refundableAmount
      ) {
        toast.error(
          "Refund amount cannot exceed the refundable balance."
        );

        return;
      }

      if (
        !comment.trim()
      ) {
        toast.error(
          "Please enter a refund reason."
        );

        return;
      }

      try {
        const result =
          await refundTamara({
            orderId,

            amount:
              Number(
                numericAmount.toFixed(
                  2
                )
              ),

            comment:
              comment.trim(),
          }).unwrap();

        toast.success(
          result.paymentStatus ===
            "PARTIALLY_REFUNDED"
            ? "Partial Tamara refund processed."
            : "Tamara refund processed successfully."
        );

        await onCompleted();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">
              Refund Tamara Payment
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              {orderNumber}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isLoading
            }
            className="rounded-lg p-2 hover:bg-[#f6f6f7]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid grid-cols-3 gap-3">
            <MiniAmount
              label="Captured"
              value={money(
                originalAmount,
                currency
              )}
            />

            <MiniAmount
              label="Refunded"
              value={money(
                refundedAmount,
                currency
              )}
            />

            <MiniAmount
              label="Refundable"
              value={money(
                refundableAmount,
                currency
              )}
              strong
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Refund amount
            </label>

            <div className="flex gap-2">
              <input
                type="number"
                min="0.01"
                max={
                  refundableAmount
                }
                step="0.01"
                value={
                  amount
                }
                onChange={(
                  event
                ) =>
                  setAmount(
                    event
                      .target
                      .value
                  )
                }
                className="h-11 flex-1 rounded-lg border border-[#babfc3] px-3 outline-none focus:border-[#008060]"
              />

              <button
                type="button"
                onClick={() =>
                  setAmount(
                    refundableAmount.toFixed(
                      2
                    )
                  )
                }
                className="rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-semibold"
              >
                Full amount
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Refund reason
            </label>

            <textarea
              rows={
                4
              }
              value={
                comment
              }
              onChange={(
                event
              ) =>
                setComment(
                  event
                    .target
                    .value
                )
              }
              placeholder="Example: Customer returned the item"
              className="w-full resize-none rounded-lg border border-[#babfc3] p-3 text-sm outline-none focus:border-[#008060]"
            />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            This action will send a real refund request to Tamara. Verify the amount before continuing.
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e1e3e5] px-6 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isLoading
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={
              submit
            }
            disabled={
              isLoading
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#b42318] px-5 text-sm font-bold text-white disabled:opacity-60"
          >
            {isLoading ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}

            Process refund
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon:
    Icon,
  children,
}: {
  title:
    string;

  icon:
    React.ElementType;

  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#e1e3e5] bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-[#e1e3e5] px-5 py-4">
        <Icon className="h-5 w-5 text-[#6d7175]" />

        <h2 className="font-bold text-[#202223]">
          {title}
        </h2>
      </div>

      <div className="p-5">
        {children}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  icon:
    Icon,
}: {
  label:
    string;

  value:
    string;

  icon:
    React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-[#f1f8f5] p-2 text-[#008060]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <div className="text-xs font-semibold uppercase text-[#6d7175]">
            {label}
          </div>

          <div className="mt-1 font-bold">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label:
    string;

  value:
    React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#8c9196]">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-medium text-[#202223]">
        {value ||
          "-"}
      </div>
    </div>
  );
}

function TotalRow({
  label,
  value,
  strong =
    false,
}: {
  label:
    string;

  value:
    string;

  strong?:
    boolean;
}) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        strong
          ? "border-t border-[#e1e3e5] pt-3 text-base font-bold"
          : ""
      }`}
    >
      <span>
        {label}
      </span>

      <span>
        {value}
      </span>
    </div>
  );
}

function Empty({
  text,
}: {
  text:
    string;
}) {
  return (
    <div className="py-6 text-center text-sm text-[#6d7175]">
      {text}
    </div>
  );
}

function StatusBadge({
  value,
}: {
  value:
    string;
}) {
  const normalized =
    String(
      value ||
      ""
    ).toUpperCase();

  let css =
    "bg-slate-100 text-slate-700";

  if (
    [
      "PAID",
      "CONFIRMED",
      "FULFILLED",
      "PROCESSED",
      "PICKUP",
      "EXPRESS",
      "STANDARD",
      "POSTED",
    ].includes(
      normalized
    )
  ) {
    css =
      "bg-emerald-50 text-emerald-700";
  } else if (
    [
      "PENDING",
      "AUTHORIZED",
      "PARTIALLY_REFUNDED",
    ].includes(
      normalized
    )
  ) {
    css =
      "bg-amber-50 text-amber-700";
  } else if (
    [
      "FAILED",
      "DECLINED",
      "REFUNDED",
      "CANCELLED",
      "CANCELED",
    ].includes(
      normalized
    )
  ) {
    css =
      "bg-red-50 text-red-700";
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${css}`}
    >
      {normalized.replace(
        /_/g,
        " "
      )}
    </span>
  );
}

function MiniAmount({
  label,
  value,
  strong =
    false,
}: {
  label:
    string;

  value:
    string;

  strong?:
    boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        strong
          ? "border-[#008060] bg-[#f1f8f5]"
          : "border-[#e1e3e5]"
      }`}
    >
      <div className="text-xs text-[#6d7175]">
        {label}
      </div>

      <div className="mt-1 text-sm font-bold">
        {value}
      </div>
    </div>
  );
}