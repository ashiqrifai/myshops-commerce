import type { Brand } from "@/types/brand";
import type { Category } from "@/types/category";
import type { Attribute, AttributeOption } from "@/types/attribute";
import type { MediaAsset } from "@/types/media";

export type ProductType = "SIMPLE" | "VARIABLE";
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type ProductChannelCode = "WEBSITE" | "KIOSK";
export type ProductPublishStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED";
export type ProductImageRole =
  | "PRIMARY"
  | "GALLERY"
  | "SWATCH"
  | "LIFESTYLE"
  | "VIDEO";
export type ProductWeightUnit = "G" | "KG" | "LB" | "OZ";
export type ProductDimensionUnit = "MM" | "CM" | "M" | "IN";

export interface ProductCategoryAssignment {
  id?: string;
  companyId?: string;
  productId?: string;
  categoryId: string;
  isPrimary: boolean;
  displayOrder: number;
  category?: Category | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  id?: string;
  companyId?: string;
  productId?: string;
  variantId?: string | null;
  mediaAssetId: string;
  imageRole: ProductImageRole;
  altText?: string | null;
  title?: string | null;
  displayOrder: number;
  isActive: boolean;
  mediaAsset?: MediaAsset | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductChannel {
  id?: string;
  companyId?: string;
  productId?: string;
  channelCode: ProductChannelCode;
  isVisible: boolean;
  publishStatus: ProductPublishStatus;
  publishedAt?: string | null;
  channelTitle?: string | null;
  channelDescription?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttributeValue {
  id?: string;
  companyId?: string;
  productId?: string;
  attributeId: string;
  optionId?: string | null;
  textValue?: string | null;
  numberValue?: number | string | null;
  booleanValue?: boolean | null;
  dateValue?: string | null;
  jsonValue?: unknown;
  displayValue?: string | null;
  attribute?: Attribute | null;
  option?: AttributeOption | null;
}

export interface ProductVariantAttributeValue {
  id?: string;
  companyId?: string;
  productVariantId?: string;
  attributeId: string;
  optionId: string;
  displayValue: string;
  sortOrder: number;
  attribute?: Attribute | null;
  option?: AttributeOption | null;
}

export interface ProductVariantChannel {
  id?: string;
  companyId?: string;
  productVariantId?: string;
  channelCode: ProductChannelCode;
  isVisible: boolean;
}

export interface ProductVariant {
  id?: string;
  companyId?: string;
  productId?: string;
  sku: string;
  barcode?: string | null;
  name: string;
  variantKey?: string;
  isDefault: boolean;
  status: ProductStatus;
  weight?: number | string | null;
  weightUnit?: ProductWeightUnit | null;
  length?: number | string | null;
  width?: number | string | null;
  height?: number | string | null;
  dimensionUnit?: ProductDimensionUnit | null;
  sortOrder: number;
  attributeValues: ProductVariantAttributeValue[];
  channels: ProductVariantChannel[];
  images?: ProductImage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  companyId: string;
  brandId?: string | null;
  primaryCategoryId?: string | null;
  name: string;
  slug: string;
  productType: ProductType;
  status: ProductStatus;
  parentSku?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  features?: string[] | null;
  whatsInTheBox?: string[] | null;
  warrantyText?: string | null;
  taxCode?: string | null;
  taxPercent: number | string;
  sortOrder: number;
  isFeatured: boolean;
  isSearchable: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  brand?: Brand | null;
  primaryCategory?: Category | null;
  categoryAssignments?: ProductCategoryAssignment[];
  images?: ProductImage[];
  channels?: ProductChannel[];
  attributeValues?: ProductAttributeValue[];
  variants?: ProductVariant[];
}

export interface ProductFormValues {
  name: string;
  slug: string;
  productType: ProductType;
  status: ProductStatus;
  parentSku: string | null;
  brandId: string | null;
  primaryCategoryId: string | null;
  categoryIds: string[];
  shortDescription: string | null;
  description: string | null;
  features: string[];
  whatsInTheBox: string[];
  warrantyText: string | null;
  taxCode: string | null;
  taxPercent: number;
  sortOrder: number;
  isFeatured: boolean;
  isSearchable: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  images: ProductImage[];
  channels: ProductChannel[];
  attributeValues: ProductAttributeValue[];
  variants: ProductVariant[];
}

export interface ProductListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  brandId?: string;
  categoryId?: string;
  productType?: ProductType;
  status?: ProductStatus;
  isFeatured?: boolean;
  sortBy?: "name" | "parentSku" | "productType" | "status" | "sortOrder" | "createdAt" | "updatedAt";
  sortDirection?: "ASC" | "DESC";
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface DeleteProductResponse {
  success: boolean;
  message?: string;
  data?: { id: string };
}

export interface GenerateVariantsRequest {
  id: string;
  attributeSelections: Array<{
    attributeId: string;
    optionIds: string[];
  }>;
  replaceExisting?: boolean;
  skuPrefix?: string | null;
}
