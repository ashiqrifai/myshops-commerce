import {
  baseApi,
} from "./baseApi";

import type {
  PaymentExceptionDetailResponse,
  PaymentExceptionListParams,
  PaymentExceptionListResponse,
  PaymentExceptionMutationResponse,
} from "@/types/paymentException";

export const paymentExceptionApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        getPaymentExceptions:
          builder.query<
            PaymentExceptionListResponse,
            PaymentExceptionListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/admin/payment-exceptions",

                params:
                  params ||
                  undefined,
              }),

            providesTags: [
              {
                type:
                  "PaymentExceptions" as const,

                id:
                  "LIST",
              },
            ],
          }),

        getPaymentExceptionById:
          builder.query<
            PaymentExceptionDetailResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/payment-exceptions/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id,
                },
              ],
          }),

        retryPaymentExceptionAllocation:
          builder.mutation<
            PaymentExceptionMutationResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/admin/payment-exceptions/${id}/retry-allocation`,

                method:
                  "POST",
              }),

            invalidatesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id,
                },

                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        markPaymentExceptionManualReview:
          builder.mutation<
            PaymentExceptionMutationResponse,
            {
              id: string;
              note?: string;
            }
          >({
            query:
              ({
                id,
                note,
              }) => ({
                url:
                  `/admin/payment-exceptions/${id}/manual-review`,

                method:
                  "POST",

                body: {
                  note:
                    note ||
                    undefined,
                },
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        resolvePaymentException:
          builder.mutation<
            PaymentExceptionMutationResponse,
            {
              id: string;
              note?: string;
            }
          >({
            query:
              ({
                id,
                note,
              }) => ({
                url:
                  `/admin/payment-exceptions/${id}/resolve`,

                method:
                  "POST",

                body: {
                  note:
                    note ||
                    undefined,
                },
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        markPaymentExceptionRefundRequired:
          builder.mutation<
            PaymentExceptionMutationResponse,
            {
              id: string;
              note?: string;
            }
          >({
            query:
              ({
                id,
                note,
              }) => ({
                url:
                  `/admin/payment-exceptions/${id}/refund-required`,

                method:
                  "POST",

                body: {
                  note:
                    note ||
                    undefined,
                },
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        markPaymentExceptionRefunded:
          builder.mutation<
            PaymentExceptionMutationResponse,
            {
              id: string;
              note?: string;
            }
          >({
            query:
              ({
                id,
                note,
              }) => ({
                url:
                  `/admin/payment-exceptions/${id}/refunded`,

                method:
                  "POST",

                body: {
                  note:
                    note ||
                    undefined,
                },
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "PaymentExceptions" as const,

                  id:
                    "LIST",
                },
              ],
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetPaymentExceptionsQuery,
  useGetPaymentExceptionByIdQuery,
  useRetryPaymentExceptionAllocationMutation,
  useMarkPaymentExceptionManualReviewMutation,
  useResolvePaymentExceptionMutation,
  useMarkPaymentExceptionRefundRequiredMutation,
  useMarkPaymentExceptionRefundedMutation,
} = paymentExceptionApi;
