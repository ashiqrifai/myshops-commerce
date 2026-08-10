export type StorefrontChannel =
  | "WEBSITE"
  | "KIOSK";

export interface StorefrontCompany {
  id: string;
  name: string;
  code: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  trn?: string | null;
  address?: string | null;
  country?: string | null;
  currency: string;
  timezone: string;
  logoUrl?: string | null;
}

export interface StorefrontMediaVariant {
  id: string;
  variantType:
    | "ORIGINAL"
    | "THUMBNAIL"
    | "SMALL"
    | "MEDIUM"
    | "LARGE"
    | "DESKTOP"
    | "TABLET"
    | "MOBILE"
    | "KIOSK"
    | "PREVIEW";

  format: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  fileSize: string | number;
  publicUrl: string;
  isPrimary: boolean;
}

export interface StorefrontMediaAsset {
  id: string;
  assetType: string;
  classification: string;

  title?: string | null;
  altText?: string | null;
  caption?: string | null;
  description?: string | null;

  mimeType?: string | null;
  extension?: string | null;

  width?: number | null;
  height?: number | null;

  orientation?: string | null;
  dominantColor?: string | null;
  hasTransparency?: boolean | null;

  publicUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;

  variants: StorefrontMediaVariant[];
}

export interface StorefrontSectionVisibility {
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  kiosk?: boolean;
}

export interface StorefrontSectionType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  category: string;
  icon?: string | null;
  supportedChannels: string[];
}

export interface StorefrontSection {
  id: string;
  companyId: string;
  cmsPageId: string;

  code: string;
  name: string;
  displayOrder: number;

  visibility: StorefrontSectionVisibility;

  publishStartAt?: string | null;
  publishEndAt?: string | null;

  type: StorefrontSectionType;

  settings: Record<string, unknown>;
  content: Record<string, unknown>;
}

export interface StorefrontSeo {
  title: string;
  description?: string | null;
  keywords: string[];
}

export interface StorefrontPage {
  id: string;
  name: string;
  code: string;
  slug: string;
  pageType: string;
  channel: string;

  title?: string | null;
  description?: string | null;

  seo: StorefrontSeo;

  layoutSettings: Record<
    string,
    unknown
  >;

  publishedAt?: string | null;
  publishStartAt?: string | null;
  publishEndAt?: string | null;

  isDefault: boolean;

  sections: StorefrontSection[];
}

export interface StorefrontCommerceSettings {
  currency?: string;
  timezone?: string;
  taxInclusive?: boolean;
}

export interface StorefrontCompanySettings {
  displayName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

export interface StorefrontContactSettings {
  supportEmail?: string;
  supportPhone?: string;
  whatsAppNumber?: string;
}

export interface StorefrontThemeSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  surfaceColor?: string;
  textColor?: string;
  mutedTextColor?: string;
  borderColor?: string;
  fontFamily?: string;
  buttonRadius?: number;
  cardRadius?: number;
}

export interface StorefrontWebsiteSettings {
    wishlistEnabled?: boolean;
    comparisonEnabled?: boolean;
    reviewsEnabled?: boolean;
    recentlyViewedEnabled?: boolean;
    guestCheckoutEnabled?: boolean;
    aiAssistantEnabled?: boolean;
    showInventory?: boolean;
    showLowStock?: boolean;
  
    announcementBarEnabled?: boolean;
    announcementText?: string;
    announcementLinkText?: string;
    announcementLinkUrl?: string;
    announcementShowSupportEmail?: boolean;
  
    headerEnabled?: boolean;
    headerSticky?: boolean;
  
    showSearch?: boolean;
    searchPlaceholder?: string;
  
    showHomeLink?: boolean;
    showAccount?: boolean;
    showWishlist?: boolean;
    showCart?: boolean;
  }

export interface StorefrontSettings {
    commerce?: StorefrontCommerceSettings;
    company?: StorefrontCompanySettings;
    contact?: StorefrontContactSettings;
    theme?: StorefrontThemeSettings;
    website?: StorefrontWebsiteSettings;
  
    [group: string]:
      | StorefrontCommerceSettings
      | StorefrontCompanySettings
      | StorefrontContactSettings
      | StorefrontThemeSettings
      | StorefrontWebsiteSettings
      | Record<string, unknown>
      | undefined;
  }

export interface StorefrontMeta {
  channel: StorefrontChannel;
  requestedSlug: string;
  sectionCount: number;
  resolvedAssetCount: number;
  generatedAt: string;
}

export interface StorefrontData {
  company: StorefrontCompany;
  page: StorefrontPage;
  settings: StorefrontSettings;
  meta: StorefrontMeta;
}

export interface StorefrontApiResponse {
  success: boolean;
  data: StorefrontData;
}

export interface StorefrontApiErrorResponse {
  success: false;

  error?: {
    code?: string;
    message?: string;
    details?: unknown[];
  };

  message?: string;
  code?: string;
}

export interface StorefrontNavigationMediaAsset {
  id: string;

  publicUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;

  title?: string | null;
  altText?: string | null;
}

export interface StorefrontNavigationItem {
  id: string;

  navigationMenuId?: string;
  parentId?: string | null;

  label: string;

  itemType:
    | "CUSTOM_LINK"
    | "CATEGORY"
    | "BRAND"
    | "CMS_PAGE"
    | "COLLECTION"
    | "DROPDOWN"
    | "MEGA_MENU"
    | "HEADING"
    | "PROMOTION";

  referenceId?: string | null;
  url?: string | null;

  icon?: string | null;

  mediaAssetId?: string | null;

  mediaAsset?:
    | StorefrontNavigationMediaAsset
    | null;

  description?: string | null;

  badgeText?: string | null;
  badgeColor?: string | null;

  displayOrder: number;
  depth: number;
  columnNumber: number;

  openInNewTab: boolean;

  desktopVisible: boolean;
  mobileVisible: boolean;

  isFeatured: boolean;
  isActive: boolean;

  settings?: Record<
    string,
    unknown
  >;

  children:
    StorefrontNavigationItem[];
}

export interface StorefrontNavigationMenu {
  id: string;
  name: string;
  code: string;

  channel: string;
  menuType: string;

  description?: string | null;

  settings?: Record<
    string,
    unknown
  >;

  items:
    StorefrontNavigationItem[];
}

export interface StorefrontResolvedNavigation {
  desktop:
    | StorefrontNavigationMenu
    | null;

  tablet:
    | StorefrontNavigationMenu
    | null;

  mobile:
    | StorefrontNavigationMenu
    | null;
}


export interface StorefrontProductBrand {
  id: string;
  name: string;
  slug?: string | null;
}

export interface StorefrontProductCategory {
  id: string;
  name: string;
  slug?: string | null;
}

export interface StorefrontProductImage {
  id: string;

  imageRole: string;

  altText?: string | null;
  title?: string | null;

  mediaAsset:
    | StorefrontMediaAsset
    | null;
}

export interface StorefrontProductVariant {
  id: string;
  sku: string;

  barcode?: string | null;

  name: string;
  isDefault: boolean;
}

export interface StorefrontProductPrice {
  id: string;

  priceListId: string;

  currencyCode: string;
  isTaxInclusive: boolean;

  sellingPrice:
    | number
    | null;

  regularPrice:
    | number
    | null;

  compareAtPrice:
    | number
    | null;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;

  productType: string;

  parentSku?: string | null;

  shortDescription?:
    | string
    | null;

  isFeatured: boolean;

  taxPercent: number;

  brand:
    | StorefrontProductBrand
    | null;

  primaryCategory:
    | StorefrontProductCategory
    | null;

  image:
    | StorefrontProductImage
    | null;

  defaultVariant:
    | StorefrontProductVariant
    | null;

  price:
    | StorefrontProductPrice
    | null;

  productUrl: string;
}

export interface FeaturedProductGridContent {
  title?: string;
  subtitle?: string;

  productIds?: string[];

  productIdsResolved?:
    StorefrontProduct[];

  categoryId?:
    | string
    | null;

  brandId?:
    | string
    | null;
}

export interface FeaturedProductGridSettings {
  sourceType?: string;

  maximumProducts?: number;

  columns?: number;
  columnsDesktop?: number;
  columnsTablet?: number;
  columnsMobile?: number;

  showPrice?: boolean;
  showBrand?: boolean;
  showWishlist?: boolean;
  showAddToCart?: boolean;

  cardStyle?: string;
}

export interface StorefrontBrand {
  id: string;
  name: string;
  code: string;
  slug: string;

  description?: string | null;
  websiteUrl?: string | null;
  countryOfOrigin?: string | null;

  logoAssetId?: string | null;
  bannerAssetId?: string | null;

  logoAsset?: StorefrontMediaAsset | null;
  bannerAsset?: StorefrontMediaAsset | null;
  image?: StorefrontMediaAsset | null;

  brandUrl: string;
}

export interface BrandCarouselContent {
  title?: string;
  subtitle?: string;

  brandIds?: string[];

  brandIdsResolved?: StorefrontBrand[];
}

export interface BrandCarouselSettings {
  autoplay?: boolean;

  showNames?: boolean;

  itemsDesktop?: number;
  itemsTablet?: number;
  itemsMobile?: number;
  itemsKiosk?: number;
}