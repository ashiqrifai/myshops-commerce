import {
    baseApi,
  } from "./baseApi";
  
  import type {
    ChangePreBookingCampaignStatusRequest,
    CreatePreBookingAllocationRequest,
    CreatePreBookingBundleItemRequest,
    CreatePreBookingBundleRequest,
    CreatePreBookingCampaignBody,
    CreatePreBookingCampaignProductRequest,
    PreBookingCampaignListParams,
    PreBookingCampaignListResponse,
    PreBookingCampaignResponse,
    UpdatePreBookingAllocationRequest,
    UpdatePreBookingBundleItemRequest,
    UpdatePreBookingBundleRequest,
    UpdatePreBookingCampaignProductRequest,
    UpdatePreBookingCampaignRequest,
  } from "@/types/preBooking";
  
  /*
  |--------------------------------------------------------------------------
  | Pre-Booking API
  |--------------------------------------------------------------------------
  */
  
  export const preBookingApi =
    baseApi.injectEndpoints({
      endpoints:
        (
          builder
        ) => ({
          /*
          |--------------------------------------------------------------------------
          | Campaigns
          |--------------------------------------------------------------------------
          */
  
          getPreBookingCampaigns:
            builder.query<
              PreBookingCampaignListResponse,
              | PreBookingCampaignListParams
              | void
            >({
              query:
                (
                  params
                ) => ({
                  url:
                    "/pre-booking/campaigns",
  
                  params:
                    params ||
                    undefined,
                }),
  
              providesTags:
                (
                  result
                ) => [
                  ...(
                    result?.data ||
                    []
                  ).map(
                    (
                      campaign
                    ) => ({
                      type:
                        "PreBooking" as const,
  
                      id:
                        campaign.id,
                    })
                  ),
  
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          getPreBookingCampaignById:
            builder.query<
              PreBookingCampaignResponse,
              string
            >({
              query:
                (
                  id
                ) => ({
                  url:
                    `/pre-booking/campaigns/${id}`,
                }),
  
              providesTags:
                (
                  _result,
                  _error,
                  id
                ) => [
                  {
                    type:
                      "PreBooking" as const,
  
                    id,
                  },
                ],
            }),
  
          createPreBookingCampaign:
            builder.mutation<
              PreBookingCampaignResponse,
              CreatePreBookingCampaignBody
            >({
              query:
                (
                  body
                ) => ({
                  url:
                    "/pre-booking/campaigns",
  
                  method:
                    "POST",
  
                  body,
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          updatePreBookingCampaign:
            builder.mutation<
              PreBookingCampaignResponse,
              UpdatePreBookingCampaignRequest
            >({
              query: ({
                id,
                body,
              }) => ({
                url:
                  `/pre-booking/campaigns/${id}`,
  
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
                      "PreBooking" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          changePreBookingCampaignStatus:
            builder.mutation<
              PreBookingCampaignResponse,
              ChangePreBookingCampaignStatusRequest
            >({
              query: ({
                id,
                status,
              }) => ({
                url:
                  `/pre-booking/campaigns/${id}/status`,
  
                method:
                  "PATCH",
  
                body: {
                  status,
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
                      "PreBooking" as const,
  
                    id:
                      argument.id,
                  },
  
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          deletePreBookingCampaign:
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
                    `/pre-booking/campaigns/${id}`,
  
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
                      "PreBooking" as const,
  
                    id,
                  },
  
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Campaign Products
          |--------------------------------------------------------------------------
          */
  
          createPreBookingCampaignProduct:
            builder.mutation<
              PreBookingCampaignResponse,
              CreatePreBookingCampaignProductRequest
            >({
              query: ({
                campaignId,
                body,
              }) => ({
                url:
                  `/pre-booking/campaigns/${campaignId}/products`,
  
                method:
                  "POST",
  
                body,
              }),
  
              invalidatesTags:
                (
                  result
                ) => [
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      result?.data?.id ||
                      "LIST",
                  },
  
                  {
                    type:
                      "PreBooking" as const,
  
                    id:
                      "LIST",
                  },
                ],
            }),
  
          updatePreBookingCampaignProduct:
            builder.mutation<
              PreBookingCampaignResponse,
              UpdatePreBookingCampaignProductRequest
            >({
              query: ({
                campaignProductId,
                body,
              }) => ({
                url:
                  `/pre-booking/campaign-products/${campaignProductId}`,
  
                method:
                  "PUT",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          deletePreBookingCampaignProduct:
            builder.mutation<
              PreBookingCampaignResponse,
              string
            >({
              query:
                (
                  campaignProductId
                ) => ({
                  url:
                    `/pre-booking/campaign-products/${campaignProductId}`,
  
                  method:
                    "DELETE",
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Bundles
          |--------------------------------------------------------------------------
          */
  
          createPreBookingBundle:
            builder.mutation<
              PreBookingCampaignResponse,
              CreatePreBookingBundleRequest
            >({
              query: ({
                campaignProductId,
                body,
              }) => ({
                url:
                  `/pre-booking/campaign-products/${campaignProductId}/bundles`,
  
                method:
                  "POST",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          updatePreBookingBundle:
            builder.mutation<
              PreBookingCampaignResponse,
              UpdatePreBookingBundleRequest
            >({
              query: ({
                bundleId,
                body,
              }) => ({
                url:
                  `/pre-booking/bundles/${bundleId}`,
  
                method:
                  "PUT",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          deletePreBookingBundle:
            builder.mutation<
              PreBookingCampaignResponse,
              string
            >({
              query:
                (
                  bundleId
                ) => ({
                  url:
                    `/pre-booking/bundles/${bundleId}`,
  
                  method:
                    "DELETE",
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Bundle Items
          |--------------------------------------------------------------------------
          */
  
          createPreBookingBundleItem:
            builder.mutation<
              PreBookingCampaignResponse,
              CreatePreBookingBundleItemRequest
            >({
              query: ({
                bundleId,
                body,
              }) => ({
                url:
                  `/pre-booking/bundles/${bundleId}/items`,
  
                method:
                  "POST",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          updatePreBookingBundleItem:
            builder.mutation<
              PreBookingCampaignResponse,
              UpdatePreBookingBundleItemRequest
            >({
              query: ({
                bundleItemId,
                body,
              }) => ({
                url:
                  `/pre-booking/bundle-items/${bundleItemId}`,
  
                method:
                  "PUT",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          deletePreBookingBundleItem:
            builder.mutation<
              PreBookingCampaignResponse,
              string
            >({
              query:
                (
                  bundleItemId
                ) => ({
                  url:
                    `/pre-booking/bundle-items/${bundleItemId}`,
  
                  method:
                    "DELETE",
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Allocations
          |--------------------------------------------------------------------------
          */

          createPreBookingProductAllocation:
          builder.mutation<
            PreBookingCampaignResponse,
            {
              campaignProductId:
                string;
        
              body:
                CreatePreBookingAllocationRequest["body"];
            }
          >({
            query: ({
              campaignProductId,
              body,
            }) => ({
              url:
                `/pre-booking/campaign-products/${campaignProductId}/allocations`,
        
              method:
                "POST",
        
              body,
            }),
        
            invalidatesTags: [
              {
                type:
                  "PreBooking",
        
                id:
                  "LIST",
              },
            ],
          }),

  
          createPreBookingAllocation:
            builder.mutation<
              PreBookingCampaignResponse,
              CreatePreBookingAllocationRequest
            >({
              query: ({
                bundleId,
                body,
              }) => ({
                url:
                  `/pre-booking/bundles/${bundleId}/allocations`,
  
                method:
                  "POST",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          updatePreBookingAllocation:
            builder.mutation<
              PreBookingCampaignResponse,
              UpdatePreBookingAllocationRequest
            >({
              query: ({
                allocationId,
                body,
              }) => ({
                url:
                  `/pre-booking/allocations/${allocationId}`,
  
                method:
                  "PUT",
  
                body,
              }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
                  id:
                    "LIST",
                },
              ],
            }),
  
          deletePreBookingAllocation:
            builder.mutation<
              PreBookingCampaignResponse,
              string
            >({
              query:
                (
                  allocationId
                ) => ({
                  url:
                    `/pre-booking/allocations/${allocationId}`,
  
                  method:
                    "DELETE",
                }),
  
              invalidatesTags: [
                {
                  type:
                    "PreBooking",
  
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
    useGetPreBookingCampaignsQuery,
    useGetPreBookingCampaignByIdQuery,
    useCreatePreBookingCampaignMutation,
    useUpdatePreBookingCampaignMutation,
    useChangePreBookingCampaignStatusMutation,
    useDeletePreBookingCampaignMutation,
  
    useCreatePreBookingCampaignProductMutation,
    useUpdatePreBookingCampaignProductMutation,
    useDeletePreBookingCampaignProductMutation,
  
    useCreatePreBookingBundleMutation,
    useUpdatePreBookingBundleMutation,
    useDeletePreBookingBundleMutation,
  
    useCreatePreBookingBundleItemMutation,
    useUpdatePreBookingBundleItemMutation,
    useDeletePreBookingBundleItemMutation,
  
    useCreatePreBookingProductAllocationMutation,
    useCreatePreBookingAllocationMutation,
    useUpdatePreBookingAllocationMutation,
    useDeletePreBookingAllocationMutation,
  } = preBookingApi;