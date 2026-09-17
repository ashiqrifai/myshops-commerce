import type {
    Product,
    ProductVariant,
  } from "@/types/product";
  
  import type {
    MediaAsset,
  } from "@/types/media";
  
  /*
  |--------------------------------------------------------------------------
  | Campaign
  |--------------------------------------------------------------------------
  */
  
  export type PreBookingCampaignStatus =
    | "DRAFT"
    | "ACTIVE"
    | "PAUSED"
    | "CLOSED"
    | "ARCHIVED";
  
  export type PreBookingPaymentPolicy =
    "FULL_PREPAID";
  
  /*
  |--------------------------------------------------------------------------
  | Bundle
  |--------------------------------------------------------------------------
  */
  
  export type PreBookingBundlePriceMode =
    | "INHERIT_PRODUCT"
    | "FIXED_TOTAL"
    | "ADD_ON";
  
  export type PreBookingBundleItemType =
    | "PRODUCT"
    | "TEXT";
  
  /*
  |--------------------------------------------------------------------------
  | Checkout
  |--------------------------------------------------------------------------
  */
  
  export type PreBookingCheckoutStatus =
    | "OPEN"
    | "RESERVED"
    | "PAYMENT_PENDING"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";
  
  /*
  |--------------------------------------------------------------------------
  | Protection
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingProtectionScheme {
    id: string;
  
    companyId: string;
  
    code: string;
  
    name: string;
  
    schemeType:
      | "EXTENDED_WARRANTY"
      | "DAMAGE_PROTECTION";
  
    description?: string | null;
  
    durationMonths?: number | null;
  
    pricingMethod:
      | "PERCENTAGE"
      | "FIXED";
  
    percentage?: number | string | null;
  
    fixedAmount?: number | string | null;
  
    currencyCode: string;
  
    coverageStartMode:
      | "FROM_PURCHASE_DATE"
      | "AFTER_MANUFACTURER_WARRANTY";
  
    termsAndConditions?:
      | string
      | null;
  
    isActive: boolean;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Bundle Item
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingBundleItem {
    id: string;
  
    companyId: string;
  
    bundleId: string;
  
    itemType:
      PreBookingBundleItemType;
  
    productId?: string | null;
  
    productVariantId?:
      | string
      | null;
  
    label: string;
  
    description?:
      | string
      | null;
  
    quantity: number;
  
    isIncluded: boolean;
  
    sortOrder: number;
  
    isActive: boolean;
  
    product?: Product | null;
  
    variant?:
      | ProductVariant
      | null;
  
    createdAt: string;
  
    updatedAt: string;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Allocation
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingAllocation {
    id: string;
  
    companyId: string;
  
    campaignProductId: string;
  
    bundleId: string;
  
    productVariantId?:
      | string
      | null;
  
    allocationQuantity: number;
  
    reservedQuantity: number;
  
    confirmedQuantity: number;
  
    availableQuantity: number;
  
    availableFrom?:
      | string
      | null;
  
    availableUntil?:
      | string
      | null;
  
    expectedStockFrom?:
      | string
      | null;
  
    expectedStockUntil?:
      | string
      | null;
  
    note?:
      | string
      | null;
  
    isActive: boolean;
  
    sortOrder: number;
  
    variant?:
      | ProductVariant
      | null;
  
    createdAt: string;
  
    updatedAt: string;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Bundle
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingBundle {
    id: string;
  
    companyId: string;
  
    campaignProductId: string;
  
    code: string;
  
    name: string;
  
    description?:
      | string
      | null;
  
    priceMode:
      PreBookingBundlePriceMode;
  
    priceAmount?:
      | number
      | string
      | null;
  
    currencyCode: string;
  
    protectionSchemeId?:
      | string
      | null;
  
    protectionIncluded: boolean;
  
    badgeText?:
      | string
      | null;
  
    isDefault: boolean;
  
    isActive: boolean;
  
    sortOrder: number;
  
    protectionScheme?:
      | PreBookingProtectionScheme
      | null;
  
    items?:
      PreBookingBundleItem[];
  
    allocations?:
      PreBookingAllocation[];
  
    createdAt: string;
  
    updatedAt: string;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Campaign Product
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingCampaignProduct {
    id: string;
  
    companyId: string;
  
    campaignId: string;
  
    productId: string;
  
    displayTitle?:
      | string
      | null;
  
    shortDescription?:
      | string
      | null;
  
    badgeText?:
      | string
      | null;
  
    minimumQuantity: number;
  
    maximumQuantityPerOrder: number;
  
    priceOverride?:
      | number
      | string
      | null;
  
    currencyCode: string;
  
    isActive: boolean;
  
    sortOrder: number;
  
    product?: Product | null;
  
    bundles?:
      PreBookingBundle[];
  
    allocations?:
      PreBookingAllocation[];
  
    createdAt: string;
  
    updatedAt: string;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Campaign
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingCampaign {
    id: string;
  
    companyId: string;
  
    code: string;
  
    name: string;
  
    slug: string;
  
    description?:
      | string
      | null;
  
    status:
      PreBookingCampaignStatus;
  
    bookingStartAt?:
      | string
      | null;
  
    bookingEndAt?:
      | string
      | null;
  
    paymentPolicy:
      PreBookingPaymentPolicy;
  
    allowCard: boolean;
  
    allowTabby: boolean;
  
    allowTamara: boolean;
  
    allowCoupons: boolean;
  
    allowGiftVouchers: boolean;
  
    checkoutSessionMinutes: number;
  
    isActive: boolean;
  
    sortOrder: number;
  
    products?:
      PreBookingCampaignProduct[];
  
    createdAt: string;
  
    updatedAt: string;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Responses
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingCampaignListResponse {
    success: boolean;
  
    data:
      PreBookingCampaign[];
  
    pagination: {
      page: number;
  
      pageSize: number;
  
      totalItems: number;
  
      totalPages: number;
    };
  }
  
  export interface PreBookingCampaignResponse {
    success: boolean;
  
    message?: string;
  
    data:
      PreBookingCampaign;
  }
  
  /*
  |--------------------------------------------------------------------------
  | List Params
  |--------------------------------------------------------------------------
  */
  
  export interface PreBookingCampaignListParams {
    page?: number;
  
    pageSize?: number;
  
    search?: string;
  
    status?:
      PreBookingCampaignStatus;
  
    isActive?: boolean;
  
    sortBy?:
      | "name"
      | "code"
      | "bookingStartAt"
      | "bookingEndAt"
      | "sortOrder"
      | "status"
      | "createdAt"
      | "updatedAt";
  
    sortDirection?:
      | "ASC"
      | "DESC";
  }
  
  /*
  |--------------------------------------------------------------------------
  | Campaign Requests
  |--------------------------------------------------------------------------
  */
  
  export interface CreatePreBookingCampaignBody {
    name: string;
  
    code: string;
  
    slug: string;
  
    description?:
      | string
      | null;
  
    status?:
      PreBookingCampaignStatus;
  
    bookingStartAt?:
      | string
      | null;
  
    bookingEndAt?:
      | string
      | null;
  
    paymentPolicy?:
      PreBookingPaymentPolicy;
  
    allowCard?: boolean;
  
    allowTabby?: boolean;
  
    allowTamara?: boolean;
  
    allowCoupons?: boolean;
  
    allowGiftVouchers?: boolean;
  
    checkoutSessionMinutes?: number;
  
    isActive?: boolean;
  
    sortOrder?: number;
  }
  
  export interface UpdatePreBookingCampaignRequest {
    id: string;
  
    body:
      Partial<
        CreatePreBookingCampaignBody
      >;
  }
  
  export interface ChangePreBookingCampaignStatusRequest {
    id: string;
  
    status:
      PreBookingCampaignStatus;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Campaign Product Requests
  |--------------------------------------------------------------------------
  */
  
  export interface CreatePreBookingCampaignProductRequest {
    campaignId: string;
  
    body: {
      productId: string;
  
      displayTitle?:
        | string
        | null;
  
      shortDescription?:
        | string
        | null;
  
      badgeText?:
        | string
        | null;
  
      minimumQuantity?: number;
  
      maximumQuantityPerOrder?: number;
  
      priceOverride?:
        | number
        | null;
  
      currencyCode?: string;
  
      isActive?: boolean;
  
      sortOrder?: number;
    };
  }
  
  export interface UpdatePreBookingCampaignProductRequest {
    campaignProductId: string;
  
    body: {
      displayTitle?:
        | string
        | null;
  
      shortDescription?:
        | string
        | null;
  
      badgeText?:
        | string
        | null;
  
      minimumQuantity?: number;
  
      maximumQuantityPerOrder?: number;
  
      priceOverride?:
        | number
        | null;
  
      currencyCode?: string;
  
      isActive?: boolean;
  
      sortOrder?: number;
    };
  }
  
  /*
  |--------------------------------------------------------------------------
  | Bundle Requests
  |--------------------------------------------------------------------------
  */
  
  export interface CreatePreBookingBundleRequest {
    campaignProductId: string;
  
    body: {
      code: string;
  
      name: string;
  
      description?:
        | string
        | null;
  
      priceMode?:
        PreBookingBundlePriceMode;
  
      priceAmount?:
        | number
        | null;
  
      currencyCode?: string;
  
      protectionSchemeId?:
        | string
        | null;
  
      protectionIncluded?: boolean;
  
      badgeText?:
        | string
        | null;
  
      isDefault?: boolean;
  
      isActive?: boolean;
  
      sortOrder?: number;
    };
  }
  
  export interface UpdatePreBookingBundleRequest {
    bundleId: string;
  
    body:
      Partial<
        CreatePreBookingBundleRequest["body"]
      >;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Bundle Item Requests
  |--------------------------------------------------------------------------
  */
  
  export interface CreatePreBookingBundleItemRequest {
    bundleId: string;
  
    body: {
      itemType?:
        PreBookingBundleItemType;
  
      productId?:
        | string
        | null;
  
      productVariantId?:
        | string
        | null;
  
      label: string;
  
      description?:
        | string
        | null;
  
      quantity?: number;
  
      isIncluded?: boolean;
  
      sortOrder?: number;
  
      isActive?: boolean;
    };
  }
  
  export interface UpdatePreBookingBundleItemRequest {
    bundleItemId: string;
  
    body:
      Partial<
        CreatePreBookingBundleItemRequest["body"]
      >;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Allocation Requests
  |--------------------------------------------------------------------------
  */
  
  export interface CreatePreBookingAllocationRequest {
    bundleId: string;
  
    body: {
      productVariantId?:
        | string
        | null;
  
      allocationQuantity: number;
  
      availableFrom?:
        | string
        | null;
  
      availableUntil?:
        | string
        | null;
  
      expectedStockFrom?:
        | string
        | null;
  
      expectedStockUntil?:
        | string
        | null;
  
      note?:
        | string
        | null;
  
      isActive?: boolean;
  
      sortOrder?: number;
    };
  }
  
  export interface UpdatePreBookingAllocationRequest {
    allocationId: string;
  
    body: {
      productVariantId?:
        | string
        | null;
  
      allocationQuantity?: number;
  
      availableFrom?:
        | string
        | null;
  
      availableUntil?:
        | string
        | null;
  
      expectedStockFrom?:
        | string
        | null;
  
      expectedStockUntil?:
        | string
        | null;
  
      note?:
        | string
        | null;
  
      isActive?: boolean;
  
      sortOrder?: number;
    };
  }