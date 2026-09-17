import {
    baseApi,
  } from "./baseApi";
  
  /*
  |--------------------------------------------------------------------------
  | Types
  |--------------------------------------------------------------------------
  */
  
  export interface ZohoLinkStatusCompany {
    id: string;
    name: string;
    code: string;
  }
  
  export interface ZohoLinkStatusSummary {
    websiteVariants: number;
    linked: number;
    notLinked: number;
    linkedPercent: number;
  }
  
  export interface ZohoUnlinkedItem {
    productId: string;
    productName: string | null;
    productSlug: string | null;
  
    productVariantId: string;
    variantName: string | null;
  
    sku: string | null;
  
    zohoItemId: string | null;
    zohoItemCode: string | null;
    zohoLastSyncedAt: string | null;
  
    zohoStatus:
      | "SKU_NOT_FOUND_IN_ZOHO"
      | "ZOHO_ITEM_MISSING_ID"
      | "NOT_CHECKED"
      | "LINKED";
  
    zohoStatusMessage:
      string | null;
  
    zohoLastCheckedAt:
      string | null;
  }

  
  export interface ZohoLinkStatusPagination {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  }
  
  export interface ZohoLinkStatusResponse {
    success: boolean;
  
    data: {
      company: ZohoLinkStatusCompany;
  
      summary: ZohoLinkStatusSummary;
  
      items: ZohoUnlinkedItem[];
  
      pagination: ZohoLinkStatusPagination;
  
      filters: {
        search: string | null;
      };
    };
  }
  
  export interface ZohoLinkStatusParams {
    page?: number;
    pageSize?: number;
    search?: string;
    companyCode?: string;
  }
  
  export interface ZohoSyncResponse {
    success: boolean;
  
    data: {
      company: ZohoLinkStatusCompany;
  
      dryRun: boolean;
  
      syncStartedAt: string;
      syncCompletedAt: string;
  
      durationMs: number;
  
      totalZohoItems: number;
      totalZohoItemsWithSku: number;
      uniqueZohoSkus: number;
  
      totalLocalVariants: number;
  
      matched: number;
      alreadyLinked: number;
      needsUpdate: number;
  
      newLinks: number;
      changedLinks: number;
  
      updated: number;
      wouldUpdate: number;
  
      updateBatchSize: number;
  
      unmatchedLocalCount: number;
      unmatchedZohoCount: number;
  
      zohoItemsWithoutItemIdCount: number;
  
      duplicateZohoSkuCount: number;
      duplicateZohoSkus: string[];
  
      unmatchedLocal: Array<{
        productVariantId: string;
        sku: string | null;
        name: string | null;
        reason?: string;
      }>;
  
      unmatchedZoho: Array<{
        zohoItemId: string | null;
        sku: string | null;
        name: string | null;
        reason?: string;
      }>;
  
      updatedItems: Array<{
        productVariantId: string;
        sku: string | null;
        previousZohoItemId: string | null;
        zohoItemId: string;
        zohoName: string | null;
        changeType: "NEW" | "CHANGED";
      }>;
    };
  }
  
  export interface ZohoSyncRequest {
    companyCode?: string;
    dryRun?: boolean;
  }
  
  /*
  |--------------------------------------------------------------------------
  | API
  |--------------------------------------------------------------------------
  */
  
  export const zohoIntegrationApi =
    baseApi.injectEndpoints({
      endpoints:
        (builder) => ({
          /*
          |--------------------------------------------------------------------------
          | Item Link Status
          |--------------------------------------------------------------------------
          */
  
          getZohoItemLinkStatus:
            builder.query<
              ZohoLinkStatusResponse,
              ZohoLinkStatusParams | void
            >({
              query:
                (params) => ({
                  url:
                    "/admin/zoho/item-link-status",
  
                  params:
                    params
                      ? {
                          page:
                            params.page ??
                            1,
  
                          pageSize:
                            params.pageSize ??
                            20,
  
                          ...(params.search
                            ? {
                                search:
                                  params.search,
                              }
                            : {}),
  
                          ...(params.companyCode
                            ? {
                                companyCode:
                                  params.companyCode,
                              }
                            : {}),
                        }
                      : {
                          page:
                            1,
  
                          pageSize:
                            20,
                        },
                }),
  
              providesTags: [
                {
                  type:
                    "Inventory",
  
                  id:
                    "ZOHO_LINK_STATUS",
                },
              ],
            }),
  
          /*
          |--------------------------------------------------------------------------
          | Sync Items
          |--------------------------------------------------------------------------
          */
  
          syncZohoItems:
            builder.mutation<
              ZohoSyncResponse,
              ZohoSyncRequest | void
            >({
              query:
                (body) => ({
                  url:
                    "/admin/zoho/sync-items",
  
                  method:
                    "POST",
  
                  body: {
                    companyCode:
                      body?.companyCode ??
                      "MYSHOPS",
  
                    dryRun:
                      body?.dryRun ??
                      false,
                  },
                }),
  
              invalidatesTags: [
                {
                  type:
                    "Inventory",
  
                  id:
                    "ZOHO_LINK_STATUS",
                },
              ],
            }),
        }),
  
      overrideExisting:
        false,
    });
  
  /*
  |--------------------------------------------------------------------------
  | Hooks
  |--------------------------------------------------------------------------
  */
  
  export const {
    useGetZohoItemLinkStatusQuery,
    useSyncZohoItemsMutation,
  } =
    zohoIntegrationApi;