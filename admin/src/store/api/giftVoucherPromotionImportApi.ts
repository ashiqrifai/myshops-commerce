import {
  baseApi,
} from "./baseApi";

import type {
  GiftVoucherImportResponse,
} from "@/types/giftVoucherPromotionImport";

export const giftVoucherPromotionImportApi =
  baseApi.injectEndpoints({
    endpoints:
      builder => ({
        importGiftVoucherPromotions:
          builder.mutation<
            GiftVoucherImportResponse,
            File
          >({
            query:
              file => {
                const formData =
                  new FormData();

                formData.append(
                  "file",
                  file
                );

                return {
                  url:
                    "/gift-voucher-promotions/import",

                  method:
                    "POST",

                  body:
                    formData,
                };
              },
          }),

        downloadGiftVoucherImportTemplate:
          builder.mutation<
            Blob,
            void
          >({
            query:
              () => ({
                url:
                  "/gift-voucher-promotions/import-template",

                method:
                  "GET",

                responseHandler:
                  async response =>
                    response.blob(),
              }),
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useImportGiftVoucherPromotionsMutation,
  useDownloadGiftVoucherImportTemplateMutation,
} =
  giftVoucherPromotionImportApi;
