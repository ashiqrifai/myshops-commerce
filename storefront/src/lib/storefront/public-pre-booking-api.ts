import "server-only";

import {
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

/*
|--------------------------------------------------------------------------
| API Configuration
|--------------------------------------------------------------------------
*/

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Public Types
|--------------------------------------------------------------------------
*/

export interface PublicPreBookingPrice {
  id?: string | null;
  priceListId?: string | null;
  currencyCode: string;
  isTaxInclusive?: boolean;
  sellingPrice: number | null;
  regularPrice: number | null;
  compareAtPrice: number | null;
  campaignPriceOverride?: boolean;
}

export interface PublicPreBookingVariantAttribute {
  id: string;
  attributeId: string;
  optionId: string | null;
  code: string | null;
  name: string | null;
  displayOrder: number;
  value: string | null;
  label: string | null;
  swatchValue: string | null;
}

export interface PublicPreBookingImage {
  id: string;
  imageRole?: string | null;
  altText?: string | null;
  title?: string | null;

  mediaAsset?: {
    id: string;
    publicUrl?: string | null;
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
  } | null;
}

export interface PublicPreBookingAllocation {
  id: string;
  campaignProductId: string;
  bundleId: string | null;
  productVariantId: string | null;

  variant?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
    isDefault?: boolean;
  } | null;

  allocationQuantity: number;
  reservedQuantity: number;
  confirmedQuantity: number;
  availableQuantity: number;

  isAvailable: boolean;
  windowOpen: boolean;

  availableFrom: string | null;
  availableUntil: string | null;
  expectedStockFrom: string | null;
  expectedStockUntil: string | null;
  note: string | null;
}

export interface PublicPreBookingVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  isDefault: boolean;
  sortOrder: number;

  attributes: PublicPreBookingVariantAttribute[];
  images: PublicPreBookingImage[];

  price: PublicPreBookingPrice | null;

  allocationSummary: {
    hasAllocation: boolean;
    availableQuantity: number;
    isAvailable: boolean;
  };

  allocations: PublicPreBookingAllocation[];
}

export interface PublicPreBookingBundleItem {
  id: string;
  itemType: "PRODUCT" | "TEXT";
  productId: string | null;
  productVariantId: string | null;
  label: string;
  description: string | null;
  quantity: number;
  isIncluded: boolean;
  sortOrder: number;

  product?: {
    id: string;
    name: string;
    slug: string;
    parentSku?: string | null;
  } | null;

  variant?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
  } | null;
}

export interface PublicPreBookingBundle {
  id: string;
  code: string;
  name: string;
  description: string | null;

  priceMode:
    | "INHERIT_PRODUCT"
    | "FIXED_TOTAL"
    | "ADD_ON";

  priceAmount: number | null;
  currencyCode: string;
  badgeText: string | null;
  isDefault: boolean;

  protectionIncluded: boolean;
  protectionSchemeId: string | null;
  protectionScheme:
    Record<string, unknown> |
    null;

  items: PublicPreBookingBundleItem[];

  allocationSummary: {
    hasAllocation: boolean;
    availableQuantity: number;
    isAvailable: boolean;
  };

  allocations: PublicPreBookingAllocation[];
}

export interface PublicPreBookingProduct {
  id: string;
  campaignProductId: string;

  name: string;
  slug: string;
  parentSku: string | null;
  productType: string;

  shortDescription: string | null;
  badgeText: string | null;

  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;

  image: PublicPreBookingImage | null;

  taxPercent: number;

  minimumQuantity: number;
  maximumQuantityPerOrder: number;

  priceOverride: number | null;
  currencyCode: string;
  price: PublicPreBookingPrice | null;

  defaultVariantId: string | null;
  variants: PublicPreBookingVariant[];

  bundles: PublicPreBookingBundle[];
  hasBundles: boolean;

  allocationSummary: {
    hasAllocation: boolean;
    availableQuantity: number;
    isAvailable: boolean;
  };

  allocations: PublicPreBookingAllocation[];

  preBooking: {
    campaignId: string;
    campaignCode: string;
    campaignName: string;
    campaignSlug: string;

    bookingStatus:
      | "ACTIVE"
      | "UPCOMING"
      | "PAUSED"
      | "CLOSED"
      | "UNAVAILABLE";

    bookingStartAt: string | null;
    bookingEndAt: string | null;
    paymentPolicy: string;
  };

  productUrl: string;
  preBookingUrl: string;
}

export interface PublicPreBookingCampaign {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;

  status: string;

  bookingStatus:
    | "ACTIVE"
    | "UPCOMING"
    | "PAUSED"
    | "CLOSED"
    | "UNAVAILABLE";

  bookingStartAt: string | null;
  bookingEndAt: string | null;

  paymentPolicy: string;

  paymentMethods: {
    card: boolean;
    tabby: boolean;
    tamara: boolean;
  };

  allowCoupons: boolean;
  allowGiftVouchers: boolean;
  checkoutSessionMinutes: number;
  productCount: number;

  campaignUrl?:
    string;
}

interface PublicPreBookingCompany {
  id: string;
  name: string;
  code: string;
  currency: string;
}

interface PublicPreBookingPriceList {
  id: string;
  code: string;
  name: string;
  currencyCode: string;
  isTaxInclusive: boolean;
}

export interface PublicPreBookingCampaignData {
  company: PublicPreBookingCompany;
  campaign: PublicPreBookingCampaign;
  products: PublicPreBookingProduct[];
  resolvedPriceList:
    | PublicPreBookingPriceList
    | null;

  meta: {
    channel: string;
    generatedAt: string;
  };
}

export interface PublicPreBookingCampaignListData {
  company:
    PublicPreBookingCompany;

  campaigns:
    PublicPreBookingCampaign[];

  meta: {
    channel:
      string;

    count:
      number;

    generatedAt:
      string;
  };
}

export interface PublicPreBookingProductData {
  company: PublicPreBookingCompany;
  campaign: PublicPreBookingCampaign;
  product: PublicPreBookingProduct;
  resolvedPriceList:
    | PublicPreBookingPriceList
    | null;

  meta: {
    channel: string;
    generatedAt: string;
  };
}

/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

async function throwApiError(
  response: Response,
  fallbackMessage: string
): Promise<never> {
  let payload:
    | {
        error?: {
          code?: string;
          message?: string;
        };
        code?: string;
        message?: string;
      }
    | undefined;

  try {
    payload =
      await response.json();
  } catch {
    payload =
      undefined;
  }

  throw new StorefrontApiError({
    status:
      response.status,

    code:
      payload?.error
        ?.code ||
      payload?.code,

    message:
      payload?.error
        ?.message ||
      payload?.message ||
      fallbackMessage,
  });
}


/*
|--------------------------------------------------------------------------
| Campaign List
|--------------------------------------------------------------------------
*/

export async function getPublicPreBookingCampaigns({
  channel = "WEBSITE",
}: {
  channel?:
    | "WEBSITE"
    | "KIOSK";
} = {}): Promise<PublicPreBookingCampaignListData> {
  const params =
    new URLSearchParams({
      channel,
    });

  const response =
    await fetch(
      `${API_URL}/public/pre-booking/campaigns?${params.toString()}`,
      {
        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        next: {
          revalidate:
            60,

          tags: [
            "public-pre-booking",
            "public-pre-booking-campaigns",
          ],
        },
      }
    );

  if (
    !response.ok
  ) {
    return throwApiError(
      response,
      `Unable to load pre-booking campaigns. HTTP ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (
    !payload?.success ||
    !payload?.data ||
    !Array.isArray(
      payload.data
        .campaigns
    )
  ) {
    throw new StorefrontApiError({
      status:
        500,

      code:
        "INVALID_PUBLIC_PRE_BOOKING_LIST_RESPONSE",

      message:
        "The pre-booking campaign list API returned an invalid response.",
    });
  }

  return payload.data;
}

/*
|--------------------------------------------------------------------------
| Campaign
|--------------------------------------------------------------------------
*/

export async function getPublicPreBookingCampaign({
  slug,
  channel = "WEBSITE",
}: {
  slug: string;
  channel?:
    | "WEBSITE"
    | "KIOSK";
}): Promise<PublicPreBookingCampaignData> {
  const normalizedSlug =
    decodeURIComponent(
      slug
    )
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .toLowerCase();

  const params =
    new URLSearchParams({
      channel,
    });

  const response =
    await fetch(
      `${API_URL}/public/pre-booking/campaigns/${encodeURIComponent(
        normalizedSlug
      )}?${params.toString()}`,
      {
        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        next: {
          revalidate:
            60,

          tags: [
            "public-pre-booking",
            `public-pre-booking:${normalizedSlug}`,
          ],
        },
      }
    );

  if (
    !response.ok
  ) {
    return throwApiError(
      response,
      `Unable to load pre-booking campaign. HTTP ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (
    !payload?.success ||
    !payload?.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      code:
        "INVALID_PUBLIC_PRE_BOOKING_RESPONSE",

      message:
        "The pre-booking campaign API returned an invalid response.",
    });
  }

  return payload.data;
}

/*
|--------------------------------------------------------------------------
| Campaign Product
|--------------------------------------------------------------------------
*/

export async function getPublicPreBookingProduct({
  campaignSlug,
  productSlug,
  channel = "WEBSITE",
}: {
  campaignSlug: string;
  productSlug: string;
  channel?:
    | "WEBSITE"
    | "KIOSK";
}): Promise<PublicPreBookingProductData> {
  const normalizedCampaignSlug =
    decodeURIComponent(
      campaignSlug
    )
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .toLowerCase();

  const normalizedProductSlug =
    decodeURIComponent(
      productSlug
    )
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .toLowerCase();

  const params =
    new URLSearchParams({
      channel,
    });

  const response =
    await fetch(
      `${API_URL}/public/pre-booking/campaigns/${encodeURIComponent(
        normalizedCampaignSlug
      )}/products/${encodeURIComponent(
        normalizedProductSlug
      )}?${params.toString()}`,
      {
        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        next: {
          revalidate:
            30,

          tags: [
            "public-pre-booking",
            `public-pre-booking:${normalizedCampaignSlug}`,
            `public-pre-booking-product:${normalizedCampaignSlug}:${normalizedProductSlug}`,
          ],
        },
      }
    );

  if (
    !response.ok
  ) {
    return throwApiError(
      response,
      `Unable to load pre-booking product. HTTP ${response.status}`
    );
  }

  const payload =
    await response.json();

  if (
    !payload?.success ||
    !payload?.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      code:
        "INVALID_PUBLIC_PRE_BOOKING_PRODUCT_RESPONSE",

      message:
        "The pre-booking product API returned an invalid response.",
    });
  }

  return payload.data;
}
