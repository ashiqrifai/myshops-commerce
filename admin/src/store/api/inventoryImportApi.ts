import {
  baseApi,
} from "./baseApi";

import type {
  InventoryImportExecuteResponse,
  InventoryImportPreviewResponse,
  InventoryImportRow,
} from "@/types/inventoryImport";

export const inventoryImportApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        previewInventoryImport:
          builder.mutation<
            InventoryImportPreviewResponse,
            File
          >({
            query: (file) => {
              const formData =
                new FormData();

              formData.append(
                "file",
                file
              );

              return {
                url:
                  "/inventory-import/preview",
                method:
                  "POST",
                body:
                  formData,
              };
            },
          }),

        executeInventoryImport:
          builder.mutation<
            InventoryImportExecuteResponse,
            {
              rows:
                InventoryImportRow[];
            }
          >({
            query: (body) => ({
              url:
                "/inventory-import/execute",
              method:
                "POST",
              body,
            }),

            invalidatesTags: [
              {
                type:
                  "Inventory",
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
  usePreviewInventoryImportMutation,
  useExecuteInventoryImportMutation,
} = inventoryImportApi;
