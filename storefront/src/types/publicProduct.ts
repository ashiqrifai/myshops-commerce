import type { PublicBundlePromotionsData } from "./bundlePromotion";

import type {
  StorefrontMediaAsset,
  StorefrontProduct,
} from "@/types/storefront";

export interface PublicProductBreadcrumb {
  label: string;
  url: string;
}

export interface PublicProductGiftVoucher {
  promotionId:
    | string
    | null;

  code:
    | string
    | null;

  name:
    | string
    | null;

  discountType:
    | string
    | null;

  discountValue:
    | number
    | null;

  discountAmount:
    number;

  fundingType?:
    | string
    | null;

  fundingSource?:
    | string
    | null;

  internalValue?:
    number;

  externalValue?:
    number;

  validFrom:
    | string
    | null;

  validUntil:
    | string
    | null;

  currencyCode?:
    | string
    | null;
}

export interface PublicProductPrice {
  id: string;

  priceListId: string;

  priceListCode: string;

  priceListName: string;

  currencyCode: string;

  isTaxInclusive: boolean;

  regularPrice: number;

  sellingPrice: number;

  compareAtPrice:
    | number
    | null;

  minimumQuantity: number;

  maximumQuantity:
    | number
    | null;

  /*
  |--------------------------------------------------------------------------
  | Discount Breakdown
  |--------------------------------------------------------------------------
  */

  baseSellingPrice?:
    | number
    | null;

  priceDiscountAmount?:
    | number
    | null;

  giftVoucherDiscountAmount?:
    | number
    | null;

  totalDiscountAmount?:
    | number
    | null;

  totalDiscountPercent?:
    | number
    | null;

  /*
  |--------------------------------------------------------------------------
  | Gift Voucher Promotion
  |--------------------------------------------------------------------------
  */

  giftVoucher?:
    | PublicProductGiftVoucher
    | null;
}

export interface PublicProductAttribute {
  id: string;
  name: string;
  code: string;
  inputType: string;
  dataType: string;
  unit?: string | null;
  isVariantDefining: boolean;
  isComparable: boolean;
  displayOrder: number;
}

export interface PublicProductAttributeOption {
  id: string;
  label: string;
  value: string;
  swatchValue?:
    | string
    | null;
  displayOrder: number;
}

export interface PublicProductAttributeValue {
  id: string;
  attributeId: string;
  optionId?:
    | string
    | null;
  displayValue?:
    | string
    | null;
  textValue?:
    | string
    | null;
  numberValue?:
    | number
    | null;
  booleanValue?:
    | boolean
    | null;
  dateValue?:
    | string
    | null;
  attribute:
    | PublicProductAttribute
    | null;
  option:
    | PublicProductAttributeOption
    | null;
}

export interface PublicProductImage {
  id: string;
  variantId?:
    | string
    | null;
  imageRole: string;
  altText?:
    | string
    | null;
  title?:
    | string
    | null;
  displayOrder: number;
  mediaAsset:
    | StorefrontMediaAsset
    | null;
}

export interface PublicProductAvailability {
  status:
    | "AVAILABLE"
    | "OUT_OF_STOCK"
    | "UNAVAILABLE";

  quantity:
    | number
    | null;

  trackQuantity: boolean;

  message: string;

  alwaysAvailableForSale?:
    boolean;
  
  
}

export interface PublicProductDelivery {
  source:
    | "PRODUCT"
    | "VARIANT";
  expressDeliveryEnabled: boolean;
  expressDeliveryHours:
    | number
    | null;
  deliveryMinDays:
    | number
    | null;
  deliveryMaxDays:
    | number
    | null;
  deliveryNote:
    | string
    | null;
}

export interface PublicProductVariant {
  id: string;
  sku: string;
  barcode?:
    | string
    | null;
  name: string;
  variantKey: string;
  isDefault: boolean;
  status: string;
  sortOrder: number;
  dimensions: {
    weight:
      | number
      | null;
    weightUnit:
      | string
      | null;
    length:
      | number
      | null;
    width:
      | number
      | null;
    height:
      | number
      | null;
    dimensionUnit:
      | string
      | null;
  };
  attributes:
    PublicProductAttributeValue[];
  price:
    | PublicProductPrice
    | null;
  images:
    PublicProductImage[];
  delivery:
    PublicProductDelivery;
  availability:
    PublicProductAvailability;
}

export interface PublicVariantSelectorOption {
  id: string;
  label: string;
  value: string;
  swatchValue?:
    | string
    | null;
  displayOrder: number;
  variantIds: string[];
}

export interface PublicVariantSelector {
  id: string;
  name: string;
  code: string;
  inputType: string;
  displayOrder: number;
  options:
    PublicVariantSelectorOption[];
}

export interface PublicProductDetail {
  id: string;
  name: string;
  slug: string;
  productType: string;
  parentSku?:
    | string
    | null;
  shortDescription?:
    | string
    | null;
  description?:
    | string
    | null;
  features: unknown[];
  whatsInTheBox: unknown[];
  warrantyText?:
    | string
    | null;
  taxCode?:
    | string
    | null;
  taxPercent: number;
  isFeatured: boolean;

  alwaysAvailableForSale?:
  boolean;

  delivery:
    PublicProductDelivery;
  brand:
    | {
        id: string;
        name: string;
        code: string;
        slug: string;
        description?:
          | string
          | null;
      }
    | null;
  primaryCategory:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    isPrimary: boolean;
  }>;
  seo: {
    title: string;
    description?:
      | string
      | null;
    keywords: string[];
    canonicalUrl: string;
  };
  gallery:
    PublicProductImage[];
  specifications:
    PublicProductAttributeValue[];
  variants:
    PublicProductVariant[];
  variantSelectors:
    PublicVariantSelector[];
  defaultVariantId: string;
  availability:
    PublicProductAvailability;
  productUrl: string;
}

export interface PublicProductData {
  company: {
    id: string;
    name: string;
    code: string;
    currency: string;
  };
  product:
    PublicProductDetail;
  breadcrumbs:
    PublicProductBreadcrumb[];
  relatedProducts:
    StorefrontProduct[];
  bundlePromotions?:
    PublicBundlePromotionsData | null;
  meta: {
    channel:
      | "WEBSITE"
      | "KIOSK";
    generatedAt: string;
  };
}

export interface PublicProductApiResponse {
  success: boolean;
  data: PublicProductData;
}
