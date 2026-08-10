import type {
  StorefrontMediaAsset,
  StorefrontProduct,
} from "@/types/storefront";

export interface PublicProductBreadcrumb {
  label: string;
  url: string;
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
