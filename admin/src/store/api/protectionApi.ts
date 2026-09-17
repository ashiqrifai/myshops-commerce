import {
  baseApi,
} from "./baseApi";

import type {
  ProtectionAssignmentFormValues,
  ProtectionAssignmentListResponse,
  ProtectionAssignmentResponse,
  ProtectionScopeType,
  ProtectionSchemeFormValues,
  ProtectionSchemeListResponse,
  ProtectionSchemeResponse,
  ProtectionSchemeType,
  ProtectionPricingMethod,
  ProtectionSettingResponse,
} from "@/types/protection";

interface SchemeListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  schemeType?: ProtectionSchemeType;
  pricingMethod?: ProtectionPricingMethod;
  currencyCode?: string;
  isActive?: boolean;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

interface AssignmentListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  schemeId?: string;
  scopeType?: ProtectionScopeType;
  scopeId?: string;
  isActive?: boolean;
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

export const protectionApi =
  baseApi.injectEndpoints({
    endpoints:
      (
        builder
      ) => ({
        getProtectionSetting:
          builder.query<
            ProtectionSettingResponse,
            {
              channelCode?: string;
            } | void
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/protection-settings",

                params:
                  cleanParams({
                    channelCode:
                      params
                        ?.channelCode ||
                      "WEBSITE",
                  }),
              }),
          }),

        updateProtectionSetting:
          builder.mutation<
            ProtectionSettingResponse,
            {
              isEnabled: boolean;
              minimumEligibleProductAmount: number;
              currencyCode: string;
              channelCode: string;
            }
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/protection-settings",

                method:
                  "PUT",

                body,
              }),
          }),

        getProtectionSchemes:
          builder.query<
            ProtectionSchemeListResponse,
            SchemeListParams
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/protection-schemes",

                params:
                  cleanParams(
                    params
                  ),
              }),
          }),

        createProtectionScheme:
          builder.mutation<
            ProtectionSchemeResponse,
            ProtectionSchemeFormValues
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/protection-schemes",

                method:
                  "POST",

                body,
              }),
          }),

        updateProtectionScheme:
          builder.mutation<
            ProtectionSchemeResponse,
            {
              id: string;
              values: ProtectionSchemeFormValues;
            }
          >({
            query: ({
              id,
              values,
            }) => ({
              url:
                `/protection-schemes/${id}`,

              method:
                "PUT",

              body:
                values,
            }),
          }),

        changeProtectionSchemeStatus:
          builder.mutation<
            ProtectionSchemeResponse,
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
                `/protection-schemes/${id}/status`,

              method:
                "PATCH",

              body: {
                isActive,
              },
            }),
          }),

        deleteProtectionScheme:
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
                  `/protection-schemes/${id}`,

                method:
                  "DELETE",
              }),
          }),

        getProtectionAssignments:
          builder.query<
            ProtectionAssignmentListResponse,
            AssignmentListParams
          >({
            query:
              (
                params
              ) => ({
                url:
                  "/protection-assignments",

                params:
                  cleanParams(
                    params
                  ),
              }),
          }),

        createProtectionAssignment:
          builder.mutation<
            ProtectionAssignmentResponse,
            ProtectionAssignmentFormValues
          >({
            query:
              (
                body
              ) => ({
                url:
                  "/protection-assignments",

                method:
                  "POST",

                body,
              }),
          }),

        updateProtectionAssignment:
          builder.mutation<
            ProtectionAssignmentResponse,
            {
              id: string;
              values: ProtectionAssignmentFormValues;
            }
          >({
            query: ({
              id,
              values,
            }) => ({
              url:
                `/protection-assignments/${id}`,

              method:
                "PUT",

              body:
                values,
            }),
          }),

        changeProtectionAssignmentStatus:
          builder.mutation<
            ProtectionAssignmentResponse,
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
                `/protection-assignments/${id}/status`,

              method:
                "PATCH",

              body: {
                isActive,
              },
            }),
          }),

        deleteProtectionAssignment:
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
                  `/protection-assignments/${id}`,

                method:
                  "DELETE",
              }),
          }),
      }),

    overrideExisting:
      false,
  });

export const {
  useGetProtectionSettingQuery,
  useUpdateProtectionSettingMutation,

  useGetProtectionSchemesQuery,
  useCreateProtectionSchemeMutation,
  useUpdateProtectionSchemeMutation,
  useChangeProtectionSchemeStatusMutation,
  useDeleteProtectionSchemeMutation,

  useGetProtectionAssignmentsQuery,
  useCreateProtectionAssignmentMutation,
  useUpdateProtectionAssignmentMutation,
  useChangeProtectionAssignmentStatusMutation,
  useDeleteProtectionAssignmentMutation,
} = protectionApi;
