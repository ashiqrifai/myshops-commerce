export interface PreBookingSettings {
  layout?:
    | "SIDE_BANNER"
    | "BANNER_TOP"
    | "PRODUCTS_ONLY";

  showLaunchDate?: boolean;
  showBookingDeadline?: boolean;
  showDeposit?: boolean;
  showCountdown?: boolean;
  showAvailabilityBadge?: boolean;
  showNavigation?: boolean;

  itemsDesktop?: number;
  itemsTablet?: number;
  itemsMobile?: number;
  maximumProducts?: number;

  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  borderRadius?: number;
}

export interface PreBookingProduct {
  id: string;
  name?: string;
  slug?: string;

  brand?: {
    name?: string;
  } | null;

  image?: {
    mediaAsset?: {
      publicUrl?: string | null;
      previewUrl?: string | null;
      thumbnailUrl?: string | null;
  
      variants?: Array<{
        publicUrl?: string | null;
        variantType?: string;
        isPrimary?: boolean;
      }>;
    } | null;
  } | null;

  price?: {
    sellingPrice?: number | string | null;
    currencyCode?: string | null;
  } | null;

  preBooking?: {
    campaignId?:
      | string
      | null;
  
    campaignCode?:
      | string
      | null;
  
    campaignName?:
      | string
      | null;
  
    campaignSlug?:
      | string
      | null;
  
    bookingType?:
      | "FULL_PAYMENT"
      | "DEPOSIT"
      | "REGISTER_INTEREST";
  
    depositAmount?:
      | number
      | string
      | null;
  
    fullBookingPrice?:
      | number
      | string
      | null;
  
    bookingStartAt?:
      | string
      | null;
  
    bookingEndAt?:
      | string
      | null;
  
    expectedLaunchAt?:
      | string
      | null;
  
    expectedDeliveryFrom?:
      | string
      | null;
  
    expectedDeliveryUntil?:
      | string
      | null;
  
    maximumBookings?:
      | number
      | null;
  
    bookedQuantity?:
      | number
      | null;
  
    allowWaitlist?: boolean;
  
    termsAndConditions?:
      | string
      | null;
  
    status?: string;
  } | null;
}

export interface PreBookingContent {
  badge?: string;
  title?: string;
  subtitle?: string;

  buttonLabel?: string;
  buttonUrl?: string;
  openInNewTab?: boolean;

  desktopAssetIdResolved?:
    | {
        publicUrl?:
          | string
          | null;
        previewUrl?:
          | string
          | null;
        thumbnailUrl?:
          | string
          | null;
        altText?:
          | string
          | null;
      }
    | null;

  mobileAssetIdResolved?:
    | {
        publicUrl?:
          | string
          | null;
        previewUrl?:
          | string
          | null;
        thumbnailUrl?:
          | string
          | null;
        altText?:
          | string
          | null;
      }
    | null;

  bookingStartAt?:
    | string
    | null;

  bookingEndAt?:
    | string
    | null;

  bookingStatus?:
    | "ACTIVE"
    | "UPCOMING"
    | "CLOSED"
    | "UNAVAILABLE";

  productIdsResolved?:
    PreBookingProduct[];
}

export function formatMoney(
  value:
    | number
    | string
    | null
    | undefined,
  currency = "AED"
): string | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount =
    Number(value);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-AE",
    {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }
  ).format(amount);
}

export function formatDate(
  value?:
    | string
    | null
): string | null {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}
