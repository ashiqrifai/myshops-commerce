import {
  baseApi,
} from "./baseApi";

import type {
  InventoryAdjustmentRequest,
  InventoryBalanceResponse,
  InventoryBalanceUpsertRequest,
  InventoryListParams,
  InventoryListResponse,
  InventoryVariantAvailabilityResponse,
} from "@/types/inventory";

export const inventoryApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        getInventory:
          builder.query<
            InventoryListResponse,
            InventoryListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/inventory",

                params:
                  params ||
                  undefined,
              }),

            providesTags: [
              {
                type:
                  "Inventory",

                id:
                  "LIST",
              },
            ],
          }),

        getVariantAvailability:
          builder.query<
            InventoryVariantAvailabilityResponse,
            string
          >({
            query:
              (
                variantId
              ) => ({
                url:
                  `/inventory/variants/${variantId}/availability`,
              }),

            providesTags:
              (
                _result,
                _error,
                variantId
              ) => [
                {
                  type:
                    "Inventory" as const,

                  id:
                    variantId,
                },
              ],
          }),

        upsertInventoryBalance:
          builder.mutation<
            InventoryBalanceResponse,
            InventoryBalanceUpsertRequest
          >({
            query:
              (body) => ({
                url:
                  "/inventory/balances",

                method:
                  "PUT",

                body,
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Inventory" as const,

                  id:
                    "LIST",
                },

                {
                  type:
                    "Inventory" as const,

                  id:
                    argument.productVariantId,
                },
              ],
          }),

        adjustInventoryOnHand:
          builder.mutation<
            InventoryBalanceResponse,
            InventoryAdjustmentRequest
          >({
            query:
              (body) => ({
                url:
                  "/inventory/adjust",

                method:
                  "POST",

                body,
              }),

            invalidatesTags:
              (
                _result,
                _error,
                argument
              ) => [
                {
                  type:
                    "Inventory" as const,

                  id:
                    "LIST",
                },

                {
                  type:
                    "Inventory" as const,

                  id:
                    argument.productVariantId,
                },
              ],
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetInventoryQuery,
  useLazyGetVariantAvailabilityQuery,
  useUpsertInventoryBalanceMutation,
  useAdjustInventoryOnHandMutation,
} = inventoryApi;
