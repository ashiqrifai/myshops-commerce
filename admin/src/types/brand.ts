import type {
  MediaAsset,
} from "@/types/media";

export interface BrandUserSummary {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface Brand {
  id: string;
  companyId: string;

  name: string;
  code: string;
  slug: string;

  description?: string | null;

  logoAssetId?: string | null;
  bannerAssetId?: string | null;

  websiteUrl?: string | null;
  countryOfOrigin?: string | null;

  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;

  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;

  createdBy?: string | null;
  updatedBy?: string | null;

  createdAt: string;
  updatedAt: string;

  logoAsset?: MediaAsset | null;
  bannerAsset?: MediaAsset | null;

  createdByUser?: BrandUserSummary | null;
  updatedByUser?: BrandUserSummary | null;
}

export interface BrandFormValues {
  name: string;
  code: string;
  slug: string;

  description: string | null;

  logoAssetId: string | null;
  bannerAssetId: string | null;

  websiteUrl: string | null;
  countryOfOrigin: string | null;

  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;

  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
}

export interface BrandListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortBy?:
    | "name"
    | "code"
    | "slug"
    | "countryOfOrigin"
    | "sortOrder"
    | "isActive"
    | "isFeatured"
    | "createdAt"
    | "updatedAt";
  sortDirection?: "ASC" | "DESC";
}

export interface BrandListResponse {
  success: boolean;
  data: Brand[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface BrandResponse {
  success: boolean;
  message?: string;
  data: Brand;
}

export interface DeleteBrandResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
  };
}
