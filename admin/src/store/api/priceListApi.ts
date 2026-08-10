import {
    baseApi,
  } from "./baseApi";
  
  import type {
    DeletePriceListResponse,
    PriceListFormValues,
    PriceListListParams,
    PriceListListResponse,
    PriceListResponse,
  } from "@/types/priceList";
  
  export const priceListApi =
    baseApi.injectEndpoints({
      endpoints:
        (builder) => ({
          getPriceLists:
            builder.query<
              PriceListListResponse,
              PriceListListParams | void
            >({
              query:
                (params) => ({
                  url:
                    "/pricing/price-lists",
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (result) => {
                  const priceLists =
                    result?.data ||
                    [];
  
                  return [
                    ...priceLists.map(
                      (
                        priceList
                      ) => ({
                        type:
                          "PriceLists" as const,
  
                        id:
                          priceList.id,
                      })
                    ),
  
                    {
                      type:
                        "PriceLists" as const,
  
                      id:
                        "LIST",
                    },
                  ];
                },
            }),
  
          getPriceListById:
            builder.query<
              PriceListResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/pricing/price-lists/${id}`,
                }),
  
              providesTags:
                (
                  _result,
                  _error,
                  id
                ) => [
                  {
                    type:
                      "PriceLists" as const,
  
                    id,
                  },
                ],
            }),
  
          createPriceList:
            builder.mutation<
              PriceListResponse,
              PriceListFormValues
            >({
              query:
                (body) => ({
                  url:
                    "/pricing/price-lists",
  
                  method:
                    "POST",
  
                  body,
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PriceLists",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          updatePriceList:
            builder.mutation<
              PriceListResponse,
              {
                id:
                  string;
  
                body:
                  Partial<PriceListFormValues>;
              }
            >({
              query:
                ({
                  id,
                  body,
                }) => ({
                  url:
                    `/pricing/price-lists/${id}`,
  
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
                      "PriceLists" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "PriceLists" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          changePriceListStatus:
            builder.mutation<
              PriceListResponse,
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
                    `/pricing/price-lists/${id}/status`,
  
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
                      "PriceLists" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "PriceLists" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          deletePriceList:
            builder.mutation<
              DeletePriceListResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/pricing/price-lists/${id}`,
  
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
                      "PriceLists" as const,
  
                    id,
                  },
  
                  {
                    type:
                      "PriceLists" as const,
  
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
    useGetPriceListsQuery,
    useGetPriceListByIdQuery,
    useCreatePriceListMutation,
    useUpdatePriceListMutation,
    useChangePriceListStatusMutation,
    useDeletePriceListMutation,
  } = priceListApi;