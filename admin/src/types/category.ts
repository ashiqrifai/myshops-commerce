import type {
    MediaAsset,
  } from "@/types/media";
  
  export interface CategoryUserSummary {
    id: string;
  
    firstName?:
      string | null;
  
    lastName?:
      string | null;
  
    email?:
      string | null;
  }
  
  export interface CategoryParentSummary {
    id: string;
    name: string;
    slug: string;
    level: number;
  
    categoryPath:
      string | null;
  }
  
  export interface CategoryLandingPageSummary {
    id: string;
  
    title?:
      string | null;
  
    slug?:
      string | null;
  
    status?:
      string | null;
  }
  
  export interface Category {
    id: string;
    companyId: string;
  
    parentCategoryId:
      string | null;
  
    name: string;
    slug: string;
  
    description:
      string | null;
  
    shortDescription:
      string | null;
  
    categoryPath:
      string | null;
  
    categoryPathIds:
      string[];
  
    level: number;
    sortOrder: number;
  
    thumbnailAssetId:
      string | null;
  
    imageAssetId:
      string | null;
  
    bannerAssetId:
      string | null;
  
    landingPageId:
      string | null;
  
    iconName:
      string | null;
  
    iconUrl:
      string | null;
  
    isActive: boolean;
    showInMenu: boolean;
    showOnHome: boolean;
    isFeatured: boolean;
    isSearchable: boolean;
  
    metaTitle:
      string | null;
  
    metaDescription:
      string | null;
  
    metaKeywords:
      string | null;
  
    canonicalUrl:
      string | null;
  
    robotsIndex: boolean;
    robotsFollow: boolean;
  
    createdBy: string;
    updatedBy:
      string | null;
  
    createdAt: string;
    updatedAt: string;
  
    parent?:
      CategoryParentSummary | null;
  
    thumbnailAsset?:
      MediaAsset | null;
  
    imageAsset?:
      MediaAsset | null;
  
    bannerAsset?:
      MediaAsset | null;
  
    landingPage?:
      CategoryLandingPageSummary | null;
  
    createdByUser?:
      CategoryUserSummary | null;
  
    updatedByUser?:
      CategoryUserSummary | null;
  
    children?:
      Category[];
  }
  
  export interface CategoryFormValues {
    name: string;
  
    slug?:
      string | null;
  
    parentCategoryId:
      string | null;
  
    description:
      string | null;
  
    shortDescription:
      string | null;
  
    sortOrder: number;
  
    thumbnailAssetId:
      string | null;
  
    imageAssetId:
      string | null;
  
    bannerAssetId:
      string | null;
  
    landingPageId:
      string | null;
  
    iconName:
      string | null;
  
    iconUrl:
      string | null;
  
    isActive: boolean;
    showInMenu: boolean;
    showOnHome: boolean;
    isFeatured: boolean;
    isSearchable: boolean;
  
    metaTitle:
      string | null;
  
    metaDescription:
      string | null;
  
    metaKeywords:
      string | null;
  
    canonicalUrl:
      string | null;
  
    robotsIndex: boolean;
    robotsFollow: boolean;
  }
  
  export interface CategoryListParams {
    page?: number;
    pageSize?: number;
  
    search?:
      string;
  
    parentCategoryId?:
      string;
  
    rootOnly?:
      boolean;
  
    level?:
      number;
  
    isActive?:
      boolean;
  
    showInMenu?:
      boolean;
  
    showOnHome?:
      boolean;
  
    isFeatured?:
      boolean;
  
    isSearchable?:
      boolean;
  }
  
  export interface CategoryTreeParams {
    isActive?:
      boolean;
  
    showInMenu?:
      boolean;
  
    showOnHome?:
      boolean;
  }
  
  export interface CategoryPagination {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }
  
  export interface CategoryListResponse {
    success: boolean;
  
    data: {
      categories:
        Category[];
    };
  
    meta: {
      pagination:
        CategoryPagination;
    };
  }
  
  export interface CategoryTreeResponse {
    success: boolean;
  
    data: {
      categories:
        Category[];
    };
  }
  
  export interface CategoryResponse {
    success: boolean;
  
    data: {
      category:
        Category;
    };
  }
  
  export interface DeleteCategoryResponse {
    success: boolean;
  
    data: {
      id: string;
      message: string;
    };
  }
  
  export interface CategoryStatusRequest {
    id: string;
  
    isActive:
      boolean;
  
    includeChildren?:
      boolean;
  }
  
  export interface ReorderCategoryItem {
    id: string;
  
    parentCategoryId?:
      string | null;
  
    sortOrder:
      number;
  }
  
  export interface ReorderCategoriesRequest {
    categories:
      ReorderCategoryItem[];
  }
  
  export interface ReorderCategoriesResponse {
    success: boolean;
  
    data: {
      categories:
        Category[];
    };
  }