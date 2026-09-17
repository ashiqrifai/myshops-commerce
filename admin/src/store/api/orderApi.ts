import {
  baseApi,
} from "./baseApi";

import type {
  AdminOrderDetailResponse,
  AdminOrderListParams,
  AdminOrderListResponse,
  AdminOrderSummaryResponse,
  TamaraRefundRequest,
  TamaraRefundResponse,
  UpdateAdminOrderStatusRequest,
  UpdateAdminShipmentStatusRequest,
} from "@/types/order";

export interface RetryZohoSalesOrderResponse {
  success:
    boolean;

  data?: {
    alreadyPosted?:
      boolean;

    orderId?:
      string;

    orderNumber?:
      string;

    zohoSalesOrderId?:
      string | null;

    zohoSalesOrderNumber?:
      string | null;

    zohoStatus?:
      string | null;
  };

  error?: {
    code?:
      string;

    message?:
      string;

    details?:
      unknown[];
  };
}

export const orderApi =
  baseApi.injectEndpoints({
    endpoints:
      (
        builder
      ) => ({
        getAdminOrders:
          builder.query<
            AdminOrderListResponse,
            AdminOrderListParams | void
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/admin/orders",

                params: {
                  page:
                    1,

                  pageSize:
                    25,

                  sortBy:
                    "placedAt",

                  sortDirection:
                    "DESC",

                  ...(
                    params ||
                    {}
                  ),
                },
              }),
          }),

        getAdminOrderSummary:
          builder.query<
            AdminOrderSummaryResponse,
            void
          >({
            query:
              () => ({
                url:
                  "/admin/orders/summary",
              }),
          }),

        getAdminOrderById:
          builder.query<
            AdminOrderDetailResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/admin/orders/${id}`,
              }),
          }),

        updateAdminOrderStatus:
          builder.mutation<
            AdminOrderDetailResponse,
            UpdateAdminOrderStatusRequest
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/admin/orders/${id}/status`,

                method:
                  "PATCH",

                body,
              }),
          }),

        updateAdminShipmentStatus:
          builder.mutation<
            AdminOrderDetailResponse,
            UpdateAdminShipmentStatusRequest
          >({
            query:
              ({
                id,
                shipmentId,
                body,
              }) => ({
                url:
                  `/admin/orders/${id}/shipments/${shipmentId}/status`,

                method:
                  "PATCH",

                body,
              }),
          }),

        retryZohoSalesOrder:
          builder.mutation<
            RetryZohoSalesOrderResponse,
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/admin/orders/${id}/zoho/retry`,

                method:
                  "POST",
              }),
          }),

        refundTamaraPayment:
          builder.mutation<
            TamaraRefundResponse,
            TamaraRefundRequest
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/payments/tamara/refund",

                method:
                  "POST",

                body,
              }),
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetAdminOrdersQuery,
  useGetAdminOrderSummaryQuery,
  useGetAdminOrderByIdQuery,
  useUpdateAdminOrderStatusMutation,
  useUpdateAdminShipmentStatusMutation,
  useRetryZohoSalesOrderMutation,
  useRefundTamaraPaymentMutation,
} = orderApi;
