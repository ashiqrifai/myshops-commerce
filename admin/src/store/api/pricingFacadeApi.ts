import {
    baseApi,
  } from "./baseApi";
  
  import type {
    PriceMatrixParams,
    PriceMatrixResponse,
  } from "@/types/priceMatrix";
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  const clean = (
    value?: string | null
  ) => value?.trim() || undefined;
  
  /*
  |--------------------------------------------------------------------------
  | Pricing Facade API
  |--------------------------------------------------------------------------
  */
  
  export const pricingFacadeApi =
    baseApi.injectEndpoints({
      endpoints:
        (builder) => ({
          getPriceMatrix:
            builder.query<
              PriceMatrixResponse,
              PriceMatrixParams
            >({
              query:
                ({
                  productId,
                  quantity = 1,
                  effectiveDate,
                  currencyCode,
                  channelCode,
                  includeInactive = false,
                }) => ({
                  url:
                    "/pricing/matrix",
  
                  method:
                    "GET",
  
                  params: {
                    productId,
  
                    quantity,
  
                    effectiveDate:
                      clean(
                        effectiveDate
                      ),
  
                    currencyCode:
                      clean(
                        currencyCode
                      ),
  
                    channelCode:
                      clean(
                        channelCode
                      ),
  
                    includeInactive,
                  },
                }),
  
              providesTags:
                (
                  _result,
                  _error,
                  argument
                ) => [
                  {
                    type:
                      "PriceMatrix" as const,
  
                    id:
                      argument.productId,
                  },
  
                  {
                    type:
                      "PriceMatrix" as const,
  
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
    useGetPriceMatrixQuery,
  } = pricingFacadeApi;