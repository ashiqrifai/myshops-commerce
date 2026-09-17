import {
  baseApi,
} from "./baseApi";

import type {
  DeleteInventoryLocationResponse,
  InventoryLocationFormValues,
  InventoryLocationListParams,
  InventoryLocationListResponse,
  InventoryLocationResponse,
} from "@/types/inventoryLocation";

export const inventoryLocationApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        getInventoryLocations:
          builder.query<
            InventoryLocationListResponse,
            InventoryLocationListParams | void
          >({
            query:
              (params) => ({
                url:
                  "/inventory-locations",

                params:
                  params ||
                  undefined,
              }),

            providesTags:
              (result) => {
                const locations =
                  result?.data ||
                  [];

                return [
                  ...locations.map(
                    (location) => ({
                      type:
                        "InventoryLocations" as const,

                      id:
                        location.id,
                    })
                  ),

                  {
                    type:
                      "InventoryLocations" as const,

                    id:
                      "LIST",
                  },
                ];
              },
          }),

        getInventoryLocationById:
          builder.query<
            InventoryLocationResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/inventory-locations/${id}`,
              }),

            providesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "InventoryLocations" as const,

                  id,
                },
              ],
          }),

        createInventoryLocation:
          builder.mutation<
            InventoryLocationResponse,
            InventoryLocationFormValues
          >({
            query:
              (body) => ({
                url:
                  "/inventory-locations",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "InventoryLocations",

                id:
                  "LIST",
              },
            ],
          }),

        updateInventoryLocation:
          builder.mutation<
            InventoryLocationResponse,
            {
              id:
                string;

              body:
                Partial<
                  InventoryLocationFormValues
                >;
            }
          >({
            query:
              ({
                id,
                body,
              }) => ({
                url:
                  `/inventory-locations/${id}`,

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
                    "InventoryLocations" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "InventoryLocations" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        changeInventoryLocationStatus:
          builder.mutation<
            InventoryLocationResponse,
            {
              id:
                string;

              isActive:
                boolean;
            }
          >({
            query:
              ({
                id,
                isActive,
              }) => ({
                url:
                  `/inventory-locations/${id}/status`,

                method:
                  "PATCH",

                body: {
                  isActive,
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
                    "InventoryLocations" as const,

                  id:
                    argument.id,
                },

                {
                  type:
                    "InventoryLocations" as const,

                  id:
                    "LIST",
                },
              ],
          }),

        deleteInventoryLocation:
          builder.mutation<
            DeleteInventoryLocationResponse,
            string
          >({
            query:
              (id) => ({
                url:
                  `/inventory-locations/${id}`,

                method:
                  "DELETE",
              }),

            invalidatesTags:
              (
                _result,
                _error,
                id
              ) => [
                {
                  type:
                    "InventoryLocations" as const,

                  id,
                },

                {
                  type:
                    "InventoryLocations" as const,

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
  useGetInventoryLocationsQuery,
  useGetInventoryLocationByIdQuery,
  useCreateInventoryLocationMutation,
  useUpdateInventoryLocationMutation,
  useChangeInventoryLocationStatusMutation,
  useDeleteInventoryLocationMutation,
} = inventoryLocationApi;
