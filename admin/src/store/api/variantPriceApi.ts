import {
    baseApi,
  } from "./baseApi";
  
  import type {
    DeleteVariantPriceResponse,
    VariantPriceCollectionResponse,
    VariantPriceFormValues,
    VariantPriceListParams,
    VariantPriceListResponse,
    VariantPriceLookupParams,
    VariantPriceResponse,
  } from "@/types/variantPrice";
  
  export const variantPriceApi =
    baseApi.injectEndpoints({
      endpoints:
        (builder) => ({
          getVariantPrices:
            builder.query<
              VariantPriceListResponse,
              VariantPriceListParams | void
            >({
              query:
                (params) => ({
                  url:
                    "/pricing/variant-prices",
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (result) => {
                  const variantPrices =
                    result?.data ||
                    [];
  
                  return [
                    ...variantPrices.map(
                      (
                        variantPrice
                      ) => ({
                        type:
                          "VariantPrices" as const,
  
                        id:
                          variantPrice.id,
                      })
                    ),
  
                    {
                      type:
                        "VariantPrices" as const,
  
                      id:
                        "LIST",
                    },
                  ];
                },
            }),
  
          getVariantPriceById:
            builder.query<
              VariantPriceResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/pricing/variant-prices/${id}`,
                }),
  
              providesTags:
                (
                  _result,
                  _error,
                  id
                ) => [
                  {
                    type:
                      "VariantPrices" as const,
  
                    id,
                  },
                ],
            }),
  
          getPricesByVariant:
            builder.query<
              VariantPriceCollectionResponse,
              {
                variantId:
                  string;
  
                params?:
                  VariantPriceLookupParams;
              }
            >({
              query:
                ({
                  variantId,
                  params,
                }) => ({
                  url:
                    `/pricing/variant-prices/by-variant/${variantId}`,
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (
                  result,
                  _error,
                  argument
                ) => [
                  ...(
                    result?.data ||
                    []
                  ).map(
                    (
                      variantPrice
                    ) => ({
                      type:
                        "VariantPrices" as const,
  
                      id:
                        variantPrice.id,
                    })
                  ),
  
                  {
                    type:
                      "VariantPrices" as const,
  
                    id:
                      `VARIANT-${argument.variantId}`,
                  },
                ],
            }),
  
          getPricesByProduct:
            builder.query<
              VariantPriceCollectionResponse,
              {
                productId:
                  string;
  
                params?:
                  VariantPriceLookupParams;
              }
            >({
              query:
                ({
                  productId,
                  params,
                }) => ({
                  url:
                    `/pricing/variant-prices/by-product/${productId}`,
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (
                  result,
                  _error,
                  argument
                ) => [
                  ...(
                    result?.data ||
                    []
                  ).map(
                    (
                      variantPrice
                    ) => ({
                      type:
                        "VariantPrices" as const,
  
                      id:
                        variantPrice.id,
                    })
                  ),
  
                  {
                    type:
                      "VariantPrices" as const,
  
                    id:
                      `PRODUCT-${argument.productId}`,
                  },
                ],
            }),
  
          createVariantPrice:
            builder.mutation<
              VariantPriceResponse,
              VariantPriceFormValues
            >({
              query:
                (body) => ({
                  url:
                    "/pricing/variant-prices",
  
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
                      "VariantPrices",
  
                    id:
                      "LIST",
                  },
  
                  {
                    type:
                      "VariantPrices",
  
                    id:
                      `VARIANT-${argument.productVariantId}`,
                  },
                ],
            }),
  
          updateVariantPrice:
            builder.mutation<
              VariantPriceResponse,
              {
                id:
                  string;
  
                body:
                  Partial<VariantPriceFormValues>;
              }
            >({
              query:
                ({
                  id,
                  body,
                }) => ({
                  url:
                    `/pricing/variant-prices/${id}`,
  
                  method:
                    "PUT",
  
                  body,
                }),
  
              invalidatesTags:
                (
                  _result,
                  _error,
                  argument
                ) => {
                  const tags = [
                    {
                      type:
                        "VariantPrices" as const,
  
                      id:
                        argument.id,
                    },
  
                    {
                      type:
                        "VariantPrices" as const,
  
                      id:
                        "LIST",
                    },
                  ];
  
                  if (
                    argument.body
                      .productVariantId
                  ) {
                    tags.push({
                      type:
                        "VariantPrices" as const,
  
                      id:
                        `VARIANT-${argument.body.productVariantId}`,
                    });
                  }
  
                  return tags;
                },
            }),
  
          changeVariantPriceStatus:
            builder.mutation<
              VariantPriceResponse,
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
                    `/pricing/variant-prices/${id}/status`,
  
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
                      "VariantPrices" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "VariantPrices" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          deleteVariantPrice:
            builder.mutation<
              DeleteVariantPriceResponse,
              string
            >({
              query:
                (id) => ({
                  url:
                    `/pricing/variant-prices/${id}`,
  
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
                      "VariantPrices" as const,
  
                    id,
                  },
  
                  {
                    type:
                      "VariantPrices" as const,
  
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
    useGetVariantPricesQuery,
    useGetVariantPriceByIdQuery,
    useGetPricesByVariantQuery,
    useGetPricesByProductQuery,
    useCreateVariantPriceMutation,
    useUpdateVariantPriceMutation,
    useChangeVariantPriceStatusMutation,
    useDeleteVariantPriceMutation,
  } = variantPriceApi;