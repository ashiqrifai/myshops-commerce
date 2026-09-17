/*
|--------------------------------------------------------------------------
| Shared Types
|--------------------------------------------------------------------------
*/

import type { MediaAsset } from "@/types/media";

export type CollectionType =
  | "MANUAL"
  | "SMART";

export type SmartCollectionMatch =
  | "ALL"
  | "ANY";

export type SmartCollectionRuleField =
  | "EXPRESS_DELIVERY_ENABLED"
  | "STATUS"
  | "IS_FEATURED"
  | "IS_SEARCHABLE"
  | "PRODUCT_TYPE"
  | "BRAND_ID"
  | "CATEGORY_ID";

export type SmartCollectionRuleOperator =
  | "IS"
  | "IS_NOT";

export interface SmartCollectionRule {
  field:
    SmartCollectionRuleField;

  operator:
    SmartCollectionRuleOperator;

  value:
    boolean |
    string;
}

export interface SmartCollectionRules {
  match:
    SmartCollectionMatch;

  rules:
    SmartCollectionRule[];
}

export interface CollectionMediaVariant {
  id:
    string;

  variantType:
    string;

  format:
    string | null;

  mimeType:
    string | null;

  width:
    number | null;

  height:
    number | null;

  publicUrl:
    string | null;

  isPrimary:
    boolean;
}

export interface CollectionMediaAsset {
  id:
    string;

  publicUrl?:
    string | null;

  originalFileName?:
    string | null;

  variants?:
    CollectionMediaVariant[];
}

export interface CollectionAuditUser {
  id:
    string;

  firstName:
    string | null;

  lastName:
    string | null;

  email:
    string;
}

export interface CollectionLandingPage {
  id:
    string;

  title:
    string;

  slug:
    string;

  status:
    string;
}

/*
|--------------------------------------------------------------------------
| Collection
|--------------------------------------------------------------------------
*/

export interface Collection {
  id:
    string;

  companyId:
    string;

  name:
    string;

  slug:
    string;

  description:
    string | null;

  shortDescription:
    string | null;

  collectionType:
    CollectionType;

  smartRules:
    SmartCollectionRules |
    null;

  sortOrder:
    number;

  thumbnailAssetId:
    string | null;

  bannerAssetId:
    string | null;

  mobileBannerAssetId:
    string | null;
  
  

  landingPageId:
    string | null;

  isActive:
    boolean;

  isFeatured:
    boolean;

  showInMenu:
    boolean;

  showOnHome:
    boolean;

  isSearchable:
    boolean;

  showProductCount:
    boolean;

  publishedFrom:
    string | null;

  publishedUntil:
    string | null;

  metaTitle:
    string | null;

  metaDescription:
    string | null;

  metaKeywords:
    string | null;

  canonicalUrl:
    string | null;

  robotsIndex:
    boolean;

  robotsFollow:
    boolean;

  productCount:
    number;

    

  thumbnailAsset?:
    CollectionMediaAsset | null;

  bannerAsset?:
    CollectionMediaAsset | null;

  mobileBannerAsset?:
    CollectionMediaAsset | null;

  landingPage?:
    CollectionLandingPage | null;

  createdBy:
    string;

  updatedBy:
    string | null;

  createdByUser?:
    CollectionAuditUser | null;

  updatedByUser?:
    CollectionAuditUser | null;

  createdAt:
    string;

  updatedAt:
    string;
}

/*
|--------------------------------------------------------------------------
| Collection Form
|--------------------------------------------------------------------------
*/

export interface CollectionFormValues {
  name:
    string;

  slug?:
    string;

  description?:
    string | null;

  shortDescription?:
    string | null;

  collectionType?:
    CollectionType;

  smartRules?:
    SmartCollectionRules |
    null;

  sortOrder?:
    number;

  thumbnailAssetId?:
    string | null;

  bannerAssetId?:
    string | null;

  mobileBannerAssetId?:
    string | null;

  landingPageId?:
    string | null;

  isActive?:
    boolean;

  isFeatured?:
    boolean;

  showInMenu?:
    boolean;

  showOnHome?:
    boolean;

  isSearchable?:
    boolean;

  showProductCount?:
    boolean;

  publishedFrom?:
    string | null;

  publishedUntil?:
    string | null;

  metaTitle?:
    string | null;

  metaDescription?:
    string | null;

  metaKeywords?:
    string | null;

  canonicalUrl?:
    string | null;

  robotsIndex?:
    boolean;

  robotsFollow?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| Collection List
|--------------------------------------------------------------------------
*/

export interface CollectionListParams {
  page?:
    number;

  pageSize?:
    number;

  search?:
    string;

  isActive?:
    boolean;

  isFeatured?:
    boolean;

  showInMenu?:
    boolean;

  showOnHome?:
    boolean;

  collectionType?:
    CollectionType;

  published?:
    boolean;

  sortBy?:
    | "name"
    | "slug"
    | "collectionType"
    | "sortOrder"
    | "isActive"
    | "isFeatured"
    | "showInMenu"
    | "showOnHome"
    | "publishedFrom"
    | "publishedUntil"
    | "createdAt"
    | "updatedAt";

  sortDirection?:
    "ASC" | "DESC";
}

export interface CollectionPagination {
  page:
    number;

  pageSize:
    number;

  totalItems:
    number;

  totalPages:
    number;
}

export interface CollectionListResponse {
  success:
    boolean;

  data:
    Collection[];

  pagination:
    CollectionPagination;
}

export interface CollectionResponse {
  success:
    boolean;

  message?:
    string;

  data:
    Collection;
}

export interface DeleteCollectionResponse {
  success:
    boolean;

  message:
    string;

  data: {
    id:
      string;
  };
}

/*
|--------------------------------------------------------------------------
| Collection Products
|--------------------------------------------------------------------------
*/

export interface CollectionProductImage {
  id:
    string;

  mediaAssetId:
    string | null;

  sortOrder:
    number;

  mediaAsset?:
    CollectionMediaAsset | null;
}

export interface CollectionProductBrand {
  id:
    string;

  name:
    string;

  slug:
    string;
}

export interface CollectionProductCategory {
  id:
    string;

  name:
    string;

  slug:
    string;
}

export interface CollectionAssignedProduct {
  id:
    string;

  name:
    string;

  parentSku:
    string | null;

  slug?:
    string | null;

  status:
    string;

  brandId:
    string | null;

  primaryCategoryId:
    string | null;

  productType?:
    string | null;

  updatedAt:
    string;

  brand?:
    CollectionProductBrand | null;

  primaryCategory?:
    CollectionProductCategory | null;

  images?:
    CollectionProductImage[];
}

export interface ProductCollectionAssignment {
  id:
    string;

  companyId:
    string;

  collectionId:
    string;

  productId:
    string;

  sortOrder:
    number;

  createdBy:
    string;

  updatedBy:
    string | null;

  createdAt:
    string;

  updatedAt:
    string;

  product:
    CollectionAssignedProduct;
}

export interface CollectionProductsResponse {
  success:
    boolean;

  collection: {
    id:
      string;

    name:
      string;

    slug:
      string;

    collectionType:
      CollectionType;

    isActive:
      boolean;
  };

  data:
    ProductCollectionAssignment[];

  pagination:
    CollectionPagination;
}

export interface CollectionProductsParams {
  id:
    string;

  page?:
    number;

  pageSize?:
    number;

  search?:
    string;

  status?:
    string;
}

export interface ProductCollectionInput {
  productId:
    string;

  sortOrder?:
    number;
}

export interface ReplaceCollectionProductsRequest {
  id:
    string;

  productIds:
    Array<
      string |
      ProductCollectionInput
    >;
}

export interface ReplaceCollectionProductsResponse {
  success:
    boolean;

  message:
    string;

  data: {
    collection:
      Collection;

    assignedCount:
      number;

    productIds:
      string[];
  };
}