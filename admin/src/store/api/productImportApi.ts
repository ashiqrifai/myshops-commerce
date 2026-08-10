import {
    baseApi,
  } from "./baseApi";
  
  export type ImportMode =
    | "CREATE_ONLY"
    | "CREATE_OR_UPDATE"
    | "UPDATE_ONLY";
  
  export type ProductAction =
    | "CREATE"
    | "UPDATE"
    | "SKIP"
    | "NO_CHANGE";
  
    export type MediaImportMode =
    | "MERGE"
    | "REPLACE";
  
  export type ProductImageRole =
    | "PRIMARY"
    | "GALLERY"
    | "SWATCH"
    | "LIFESTYLE"
    | "MANUAL";
  
  export interface ImportImagePayload {
    mediaAssetId: string;
    imageRole: ProductImageRole;
    title?: string | null;
    altText?: string | null;
    displayOrder?: number;
  }
  
  export interface ImportVariantPayload {
    sku?: string;
    barcode?: string | null;
    name?: string;
    images?: ImportImagePayload[];
    [key: string]: unknown;
  }
  
  export interface ImportProductPayload {
    mediaImportMode?: MediaImportMode;
    images?: ImportImagePayload[];
    variants?: ImportVariantPayload[];
    [key: string]: unknown;
  }

  export interface PreviewProduct {
    parentSku: string;
    productType?: string;
    action: ProductAction;
    valid: boolean;
    executable: boolean;
    rowNumbers: number[];
    existingProductId?: string | null;
  
    summary?: {
      count?: number;
      defaultSku?: string | null;
      skus?: string[];
      barcodes?: string[];
      priceCount?: number;

      productImageCount?: number;
      variantImageCount?: number;
      imageCount?: number;
    };
  
    validation?: {
      errors?: string[];
      warnings?: string[];
    };
  
    resolved?: unknown;
    createPayload?: ImportProductPayload | null;
    updatePayload?: ImportProductPayload | null;
    associations?: unknown;
  
    pricing?: {
      operations?: unknown[];
      count?: number;
    };
  
    source?: unknown;
  }
  
  export interface PreviewData {
    success: boolean;
    preview: boolean;
    importMode: ImportMode;
    canExecute: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
    companyId: string;
    headers: string[];
  
    summary: {
      totalRows: number;
      totalProducts: number;
      validProducts: number;
      invalidProducts: number;
      createProducts: number;
      updateProducts: number;
      noChangeProducts: number;
      skippedProducts: number;
      executableProducts: number;
      totalVariants: number;
      totalPrices: number;
      totalErrors: number;
      totalWarnings: number;
    };
  
    validation: {
      errors: string[];
      warnings: string[];
  
      products: Array<{
        parentSku: string;
        productType?: string;
        action: ProductAction;
        rowNumbers: number[];
        valid: boolean;
        errors: string[];
        warnings: string[];
        existingProduct?: unknown;
      }>;
  
      summary: {
        total: number;
        valid: number;
        invalid: number;
        create: number;
        update: number;
        skip: number;
        warningProducts: number;
      };
    };
  
    lookups?: {
      requested?: Record<string, unknown>;
      loaded?: Record<string, number>;
    };
  
    products: PreviewProduct[];
  }
  
  export interface PreviewResponse {
    success: boolean;
    message: string;
  
    file?: {
      originalName: string;
      mimeType: string;
      size: number;
      totalPhysicalRows: number;
      dataRowCount: number;
      removedEmptyRows: number;
    };
  
    data: PreviewData;
  }
  
  export interface ExecutionProduct {
    parentSku: string;
    productId?: string | null;
    success: boolean;
    skipped: boolean;
    action: ProductAction;
    variantCount?: number;
    priceCount?: number;
  
    productImageCount?: number;
    variantImageCount?: number;
    imageCount?: number;
  
    errors?: Array<
      | string
      | {
          message?: string;
          code?: string | null;
        }
    >;
  
    warnings?: string[];
  }
  
  export interface ExecutionResult {
    success: boolean;
    partiallySuccessful: boolean;
    companyId: string;
    importMode: ImportMode;
    continueOnError: boolean;
    executedAt: string;
  
    summary: {
        total: number;
        succeeded: number;
        failed: number;
        skipped: number;
        created: number;
        updated: number;
        variants: number;
        prices: number;
      
        productImages?: number;
        variantImages?: number;
        images?: number;
      
        errors: number;
        warnings: number;
      };
  
    products: ExecutionProduct[];
  }
  
  export interface ExecutionResponse {
    success: boolean;
    message: string;
    data: ExecutionResult;
  }
  
  export const productImportApi =
  baseApi.injectEndpoints({
    endpoints:
      (builder) => ({
        previewProductImport:
          builder.mutation<
            PreviewResponse,
            {
              file: File;
              importMode: ImportMode;
              removeEmptyRows: boolean;
            }
          >({
            query: ({
              file,
              importMode,
              removeEmptyRows,
            }) => {
              const formData =
                new FormData();

              formData.append(
                "file",
                file
              );

              formData.append(
                "importMode",
                importMode
              );

              formData.append(
                "removeEmptyRows",
                String(
                  removeEmptyRows
                )
              );

              return {
                url:
                  "/product-import/preview",

                method:
                  "POST",

                body:
                  formData,
              };
            },
          }),

        executeProductImport:
          builder.mutation<
            ExecutionResponse,
            {
              preview: PreviewData;
              continueOnError: boolean;
            }
          >({
            query: ({
              preview,
              continueOnError,
            }) => ({
              url:
                "/product-import/execute",

              method:
                "POST",

              body: {
                preview,
                continueOnError,
              },
            }),

            invalidatesTags: [
              {
                type:
                  "Products",

                id:
                  "LIST",
              },
            ],
          }),

        downloadProductImportTemplate:
          builder.mutation<
            {
              success: boolean;
              fileName: string;
            },
            {
              includeExamples: boolean;
            }
          >({
            queryFn:
              async (
                {
                  includeExamples,
                },
                _api,
                _extraOptions,
                baseQuery
              ) => {
                const result =
                  await baseQuery({
                    url:
                      `/product-import/template/download?includeExamples=${includeExamples}`,

                    method:
                      "GET",

                    responseHandler:
                      async (
                        response
                      ) => {
                        const blob =
                          await response.blob();

                        const disposition =
                          response.headers.get(
                            "content-disposition"
                          );

                        const fileNameMatch =
                          disposition?.match(
                            /filename="?([^"]+)"?/
                          );

                        return {
                          blob,

                          fileName:
                            fileNameMatch?.[1] ||
                            (
                              includeExamples
                                ? "product-import-example.csv"
                                : "product-import-template.csv"
                            ),
                        };
                      },
                  });

                if (result.error) {
                  return {
                    error:
                      result.error,
                  };
                }

                const data =
                  result.data as {
                    blob: Blob;
                    fileName: string;
                  };

                const objectUrl =
                  URL.createObjectURL(
                    data.blob
                  );

                const anchor =
                  document.createElement(
                    "a"
                  );

                anchor.href =
                  objectUrl;

                anchor.download =
                  data.fileName;

                document.body.appendChild(
                  anchor
                );

                anchor.click();
                anchor.remove();

                URL.revokeObjectURL(
                  objectUrl
                );

                return {
                  data: {
                    success:
                      true,

                    fileName:
                      data.fileName,
                  },
                };
              },
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  usePreviewProductImportMutation,
  useExecuteProductImportMutation,
  useDownloadProductImportTemplateMutation,
} = productImportApi;