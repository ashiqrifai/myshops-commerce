import {
  baseApi,
} from "./baseApi";

export interface PricingImportRow {
  rowNumber?: number;
  productSku?: string;
  variantSku: string;
  priceListCode: string;
  currencyCode?: string;
  regularPrice: number | string;
  sellingPrice: number | string;
  compareAtPrice?: number | string | null;
  costPrice?: number | string | null;
  minimumQuantity?: number | string | null;
  maximumQuantity?: number | string | null;
  validFrom?: string | null;
  validUntil?: string | null;
  validTo?: string | null;
  priority?: number | string | null;
  status?: "ACTIVE" | "INACTIVE";
}

export interface PricingImportRequest {
  rows: PricingImportRow[];
}

export interface PricingImportPreviewResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      total: number;
      create: number;
      update: number;
      no_change: number;
      deactivate: number;
      skip: number;
      warningRows: number;
      changeCount: number;
    };
    rows: any[];
  };
}

export interface PricingImportExecuteResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      total: number;
      created: number;
      updated: number;
      deactivated: number;
      unchanged: number;
      skipped: number;
      applied: number;
    };
    rows: any[];
  };
}

export const pricingImportApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        previewPricingImport:
          builder.mutation<
            PricingImportPreviewResponse,
            PricingImportRequest
          >({
            query:
              (body) => ({
                url:
                  "/pricing/import/preview",

                method:
                  "POST",

                body,
              }),
          }),

        executePricingImport:
          builder.mutation<
            PricingImportExecuteResponse,
            PricingImportRequest
          >({
            query:
              (body) => ({
                url:
                  "/pricing/import/execute",

                method:
                  "POST",

                body,
              }),

            invalidatesTags: [
              {
                type:
                  "VariantPrices",

                id:
                  "LIST",
              },

              {
                type:
                  "PriceMatrix",

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
  usePreviewPricingImportMutation,
  useExecutePricingImportMutation,
} = pricingImportApi;
