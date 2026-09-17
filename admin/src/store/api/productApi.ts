import { baseApi } from "./baseApi";

import type {
  DeleteProductResponse,
  GenerateVariantsRequest,
  ProductFormValues,
  ProductListParams,
  ProductListResponse,
  ProductResponse,
  ProductStatus,
  ProductType,
} from "@/types/product";

export interface ProductExportParams {
  search?: string;
  status?: ProductStatus;
  productType?: ProductType;
  brandId?: string;
  categoryId?: string;
  channelCode?: "WEBSITE" | "KIOSK";
  isFeatured?: boolean;
  productIds?: string[];
}


/*
|--------------------------------------------------------------------------
| Existing Product -> Variable Product Merge
|--------------------------------------------------------------------------
*/

export interface ProductMergeAttributeMapping {
  attributeId: string;
  optionId: string;
  sortOrder?: number;
}

export interface ProductMergeVariantMapping {
  productId: string;
  variantId: string;
  attributes: ProductMergeAttributeMapping[];
}

export interface ProductMergeRequest {
  sourceProductIds: string[];
  parentProductId: string;
  defaultVariantId?: string | null;

  parent: {
    name: string;
    slug: string;
    parentSku: string;
  };

  variantMappings: ProductMergeVariantMapping[];
}

export interface ProductMergePreviewVariant {
  productId: string;
  variantId: string;
  sku: string;
  barcode?: string | null;
  zohoItemId?: string | null;
  zohoItemCode?: string | null;

  attributes: Array<{
    attributeId: string;
    attributeCode?: string | null;
    attributeName?: string | null;
    optionId: string;
    optionLabel?: string | null;
    optionValue?: string | null;
  }>;
}

export interface ProductMergePreviewResponse {
  success: boolean;
  canExecute: boolean;
  errors: string[];
  warnings: string[];

  data: {
    parentProduct: {
      id: string;
      name: string;
      slug: string;
      parentSku: string;
    };

    summary: {
      sourceProducts: number;
      variants: number;
      redundantProducts: number;
      historicalOrderItems: number;
    };

    blockingDependencies: {
      protectionAssignments: number;
      attachmentRules: number;
      attachmentRuleItems: number;
      giftVoucherPromotionItems: number;
    };

    variants: ProductMergePreviewVariant[];
  } | null;
}

export interface ProductMergeExecuteResponse {
  success: boolean;
  message: string;

  data: {
    parentProductId: string;
    parentName: string;
    parentSlug: string;
    parentSku: string;
    defaultVariantId: string;
    movedVariantIds: string[];
    archivedProductIds: string[];
    warnings: string[];
  };
}

const clean = (
  value?: string | null
) => value?.trim() || null;

const buildPayload = (
  values: ProductFormValues
) => {
  const normalizedVariants =
    values.variants.map(
      (
        variant,
        index
      ) => ({
        ...(variant.id
          ? {
              id:
                variant.id,
            }
          : {}),

        sku:
          variant.sku.trim(),

        barcode:
          clean(
            variant.barcode
          ),

        name:
          variant.name.trim(),

        variantKey:
          variant.variantKey,

        isDefault:
          variant.isDefault,

        status:
          variant.status,

        weight:
          variant.weight === ""
            ? null
            : variant.weight ??
              null,

        weightUnit:
          variant.weightUnit ||
          null,

        length:
          variant.length === ""
            ? null
            : variant.length ??
              null,

        width:
          variant.width === ""
            ? null
            : variant.width ??
              null,

        height:
          variant.height === ""
            ? null
            : variant.height ??
              null,

        dimensionUnit:
          variant.dimensionUnit ||
          null,

        sortOrder:
          Number(
            variant.sortOrder ??
              index
          ),

        attributeValues:
          variant.attributeValues.map(
            (
              item,
              itemIndex
            ) => ({
              ...(item.id
                ? {
                    id:
                      item.id,
                  }
                : {}),

              attributeId:
                item.attributeId,

              optionId:
                item.optionId,

              displayValue:
                item.displayValue,

              sortOrder:
                Number(
                  item.sortOrder ??
                    itemIndex
                ),
            })
          ),

        channels:
          variant.channels.map(
            (channel) => ({
              ...(channel.id
                ? {
                    id:
                      channel.id,
                  }
                : {}),

              channelCode:
                channel.channelCode,

              isVisible:
                channel.isVisible,
            })
          ),

        images:
          (
            variant.images || []
          ).map(
            (
              image,
              imageIndex
            ) => ({
              ...(image.id
                ? {
                    id:
                      image.id,
                  }
                : {}),

              mediaAssetId:
                image.mediaAssetId,

              imageRole:
                image.imageRole,

              altText:
                clean(
                  image.altText
                ),

              title:
                clean(
                  image.title
                ),

              displayOrder:
                Number(
                  image.displayOrder ??
                    imageIndex
                ),

              isActive:
                image.isActive !==
                false,
            })
          ),
      })
    );

  const payload: Record<
    string,
    unknown
  > = {
    name:
      values.name.trim(),

    slug:
      values.slug.trim(),

    productType:
      values.productType,

    status:
      values.status,

    parentSku:
      clean(values.parentSku),

    brandId:
      values.brandId || null,

    primaryCategoryId:
      values.primaryCategoryId ||
      null,

    shortDescription:
      clean(
        values.shortDescription
      ),

    description:
      clean(values.description),

    features:
      values.features
        .map((item) =>
          item.trim()
        )
        .filter(Boolean),

    whatsInTheBox:
      values.whatsInTheBox
        .map((item) =>
          item.trim()
        )
        .filter(Boolean),

    warrantyText:
      clean(values.warrantyText),

    taxCode:
      clean(values.taxCode),

    taxPercent:
      Number(
        values.taxPercent || 0
      ),

    sortOrder:
      Number(
        values.sortOrder || 0
      ),

    isFeatured:
      values.isFeatured,

    isSearchable:
      values.isSearchable,
    
    alwaysAvailableForSale:
      values.alwaysAvailableForSale ===
      true,

    /*
     * Direct delivery / supplier fulfillment.
     *
     * When direct delivery is disabled, supplier-specific
     * fields are explicitly cleared so an old configuration
     * cannot remain attached to the product.
     */
    isDirectDelivery:
      values.isDirectDelivery === true,

    directDeliverySupplierId:
      values.isDirectDelivery
        ? values.directDeliverySupplierId ||
          null
        : null,

    directDeliveryLeadTimeDays:
      values.isDirectDelivery &&
      values.directDeliveryLeadTimeDays !==
        null &&
      values.directDeliveryLeadTimeDays !==
        undefined
        ? Number(
            values.directDeliveryLeadTimeDays
          )
        : null,

    directDeliveryNote:
      values.isDirectDelivery
        ? clean(
            values.directDeliveryNote
          )
        : null,

    metaTitle:
      clean(values.metaTitle),

    metaDescription:
      clean(
        values.metaDescription
      ),

    metaKeywords:
      clean(values.metaKeywords),

    canonicalUrl:
      clean(values.canonicalUrl),

    categoryIds:
      Array.from(
        new Set(
          [
            values.primaryCategoryId,
            ...values.categoryIds,
          ].filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
        )
      ),

    images:
      values.images.map(
        (
          image,
          index
        ) => ({
          ...(image.id
            ? {
                id:
                  image.id,
              }
            : {}),

          mediaAssetId:
            image.mediaAssetId,

          variantId:
            image.variantId ||
            null,

          imageRole:
            image.imageRole,

          altText:
            clean(image.altText),

          title:
            clean(image.title),

          displayOrder:
            Number(
              image.displayOrder ??
                index
            ),

          isActive:
            image.isActive !==
            false,
        })
      ),

    channels:
      values.channels.map(
        (channel) => ({
          ...(channel.id
            ? {
                id:
                  channel.id,
              }
            : {}),

          channelCode:
            channel.channelCode,

          isVisible:
            channel.isVisible,

          publishStatus:
            channel.publishStatus,

          channelTitle:
            clean(
              channel.channelTitle
            ),

          channelDescription:
            clean(
              channel.channelDescription
            ),
        })
      ),

    attributeValues:
      values.attributeValues.map(
        (value) => ({
          ...(value.id
            ? {
                id:
                  value.id,
              }
            : {}),

          attributeId:
            value.attributeId,

          optionId:
            value.optionId ||
            null,

          textValue:
            clean(value.textValue),

          numberValue:
            value.numberValue === ""
              ? null
              : value.numberValue ??
                null,

          booleanValue:
            value.booleanValue ??
            null,

          dateValue:
            value.dateValue ||
            null,

          jsonValue:
            value.jsonValue ??
            null,

          displayValue:
            clean(
              value.displayValue
            ),
        })
      ),
  };

  /*
   * New SIMPLE products with no manually supplied
   * variants must not send `variants: []`.
   *
   * Omitting the field allows the backend to create
   * its automatic DEFAULT variant.
   *
   * Existing SIMPLE products will already contain
   * their default variant, so it is sent normally
   * during updates.
   *
   * VARIABLE products always send the variants field,
   * including an empty array before generation.
   */
  if (
    values.productType ===
      "VARIABLE" ||
    normalizedVariants.length > 0
  ) {
    payload.variants =
      normalizedVariants;
  }

  return payload;
};

export const productApi =
  baseApi.injectEndpoints({
    endpoints: (
      builder
    ) => ({
      getProducts:
        builder.query<
          ProductListResponse,
          ProductListParams | void
        >({
          query: (
            params
          ) => ({
            url:
              "/products",

            params:
              params ||
              undefined,
          }),

          providesTags: (
            result
          ) => [
            ...(
              result?.data ||
              []
            ).map(
              (
                product
              ) => ({
                type:
                  "Products" as const,

                id:
                  product.id,
              })
            ),

            {
              type:
                "Products" as const,

              id:
                "LIST",
            },
          ],
        }),

      getProductById:
        builder.query<
          ProductResponse,
          string
        >({
          query: (
            id
          ) => ({
            url:
              `/products/${id}`,
          }),

          providesTags: (
            _result,
            _error,
            id
          ) => [
            {
              type:
                "Products" as const,

              id,
            },
          ],
        }),

      createProduct:
        builder.mutation<
          ProductResponse,
          ProductFormValues
        >({
          query: (
            values
          ) => ({
            url:
              "/products",

            method:
              "POST",

            body:
              buildPayload(
                values
              ),
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

      updateProduct:
        builder.mutation<
          ProductResponse,
          {
            id: string;

            values:
              ProductFormValues;
          }
        >({
          query: ({
            id,
            values,
          }) => ({
            url:
              `/products/${id}`,

            method:
              "PUT",

            body:
              buildPayload(
                values
              ),
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type:
                "Products" as const,

              id:
                argument.id,
            },

            {
              type:
                "Products" as const,

              id:
                "LIST",
            },
          ],
        }),

      changeProductStatus:
        builder.mutation<
          ProductResponse,
          {
            id: string;

            status:
              ProductStatus;
          }
        >({
          query: ({
            id,
            status,
          }) => ({
            url:
              `/products/${id}/status`,

            method:
              "PATCH",

            body: {
              status,
            },
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type:
                "Products" as const,

              id:
                argument.id,
            },

            {
              type:
                "Products" as const,

              id:
                "LIST",
            },
          ],
        }),

      generateProductVariants:
        builder.mutation<
          ProductResponse,
          GenerateVariantsRequest
        >({
          query: ({
            id,
            attributeSelections,
            replaceExisting,
            skuPrefix,
          }) => ({
            url:
              `/products/${id}/generate-variants`,

            method:
              "POST",

            body: {
              attributeSelections,

              replaceExisting:
                replaceExisting ===
                true,

              skuPrefix:
                clean(
                  skuPrefix
                ),
            },
          }),

          invalidatesTags: (
            _result,
            _error,
            argument
          ) => [
            {
              type:
                "Products" as const,

              id:
                argument.id,
            },

            {
              type:
                "Products" as const,

              id:
                "LIST",
            },
          ],
        }),

        previewProductMerge:
        builder.mutation<
          ProductMergePreviewResponse,
          ProductMergeRequest
        >({
          query: (body) => ({
            url:
              "/products/merge/preview",

            method:
              "POST",

            body,
          }),
        }),

      executeProductMerge:
        builder.mutation<
          ProductMergeExecuteResponse,
          ProductMergeRequest
        >({
          query: (body) => ({
            url:
              "/products/merge/execute",

            method:
              "POST",

            body,
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

      exportProducts:
        builder.mutation<
          string,
          ProductExportParams | void
        >({
          query: (
            params
          ) => {
            const queryParams:
              Record<
                string,
                string | boolean
              > = {};

            if (
              params?.search?.trim()
            ) {
              queryParams.search =
                params.search.trim();
            }

            if (
              params?.status
            ) {
              queryParams.status =
                params.status;
            }

            if (
              params?.productType
            ) {
              queryParams.productType =
                params.productType;
            }

            if (
              params?.brandId
            ) {
              queryParams.brandId =
                params.brandId;
            }

            if (
              params?.categoryId
            ) {
              queryParams.categoryId =
                params.categoryId;
            }

            if (
              params?.channelCode
            ) {
              queryParams.channelCode =
                params.channelCode;
            }

            if (
              typeof params?.isFeatured ===
              "boolean"
            ) {
              queryParams.isFeatured =
                params.isFeatured;
            }

            if (
              params?.productIds
                ?.length
            ) {
              queryParams.productIds =
                params.productIds.join(
                  ","
                );
            }

            return {
              url:
                "/product-import/export",

              method:
                "GET",

              params:
                queryParams,

              responseHandler:
                async (
                  response
                ) =>
                  response.text(),
              cache:
                "no-store",
            };
          },
        }),

      deleteProduct:
        builder.mutation<
          DeleteProductResponse,
          string
        >({
          query: (
            id
          ) => ({
            url:
              `/products/${id}`,

            method:
              "DELETE",
          }),

          invalidatesTags: (
            _result,
            _error,
            id
          ) => [
            {
              type:
                "Products" as const,

              id,
            },

            {
              type:
                "Products" as const,

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
  useGetProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useChangeProductStatusMutation,
  useGenerateProductVariantsMutation,
  usePreviewProductMergeMutation,
  useExecuteProductMergeMutation,
  useExportProductsMutation,
  useDeleteProductMutation,
} = productApi;