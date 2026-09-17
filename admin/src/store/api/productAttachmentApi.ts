import {
  baseApi,
} from "./baseApi";

import type {
  ProductAttachmentDisplayLocation,
  ProductAttachmentRelationshipType,
  ProductAttachmentRuleFormValues,
  ProductAttachmentRuleListResponse,
  ProductAttachmentRuleResponse,
  ProductAttachmentScopeType,
} from "@/types/productAttachment";

interface ProductAttachmentRuleListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  scopeType?: ProductAttachmentScopeType;
  relationshipType?: ProductAttachmentRelationshipType;
  displayLocation?: ProductAttachmentDisplayLocation;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

const cleanParams = <
  T extends object,
>(
  params: T
): Record<
  string,
  unknown
> =>
  Object.fromEntries(
    Object.entries(
      params
    ).filter(
      (
        [, value]
      ) =>
        value !==
          undefined &&
        value !==
          null &&
        value !==
          ""
    )
  );

export const productAttachmentApi =
  baseApi.injectEndpoints({
    endpoints:
      (
        builder
      ) => ({
        getProductAttachmentRules:
          builder.query<
            ProductAttachmentRuleListResponse,
            ProductAttachmentRuleListParams
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/product-attachment-rules",

                params:
                  cleanParams(
                    params
                  ),
              }),
          }),

        createProductAttachmentRule:
          builder.mutation<
            ProductAttachmentRuleResponse,
            ProductAttachmentRuleFormValues
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/product-attachment-rules",

                method:
                  "POST",

                body,
              }),
          }),

        updateProductAttachmentRule:
          builder.mutation<
            ProductAttachmentRuleResponse,
            {
              id: string;
              values: ProductAttachmentRuleFormValues;
            }
          >({
            query: ({
              id,
              values,
            }) => ({
              url:
                `/product-attachment-rules/${id}`,

              method:
                "PUT",

              body:
                values,
            }),
          }),

        changeProductAttachmentRuleStatus:
          builder.mutation<
            ProductAttachmentRuleResponse,
            {
              id: string;
              isActive: boolean;
            }
          >({
            query: ({
              id,
              isActive,
            }) => ({
              url:
                `/product-attachment-rules/${id}/status`,

              method:
                "PATCH",

              body: {
                isActive,
              },
            }),
          }),

        deleteProductAttachmentRule:
          builder.mutation<
            {
              success: boolean;
              message?: string;
              data?: {
                id: string;
              };
            },
            string
          >({
            query:
              (
                id
              ) => ({
                url:
                  `/product-attachment-rules/${id}`,

                method:
                  "DELETE",
              }),
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetProductAttachmentRulesQuery,
  useCreateProductAttachmentRuleMutation,
  useUpdateProductAttachmentRuleMutation,
  useChangeProductAttachmentRuleStatusMutation,
  useDeleteProductAttachmentRuleMutation,
} = productAttachmentApi;
