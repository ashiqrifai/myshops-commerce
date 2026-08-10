import type {
  StorefrontCompany,
  StorefrontMediaAsset,
  StorefrontProduct,
} from "@/types/storefront";

export interface PublicCategoryBreadcrumb {
  id: string;
  name: string;
  slug: string;
  level?: number;
}

export interface PublicCategory {
  id: string;
  name: string;
  slug: string;

  description?: string | null;
  shortDescription?: string | null;

  categoryPath?: string | null;
  categoryPathIds: string[];

  level: number;
  sortOrder: number;

  parentCategoryId?: string | null;

  iconName?: string | null;
  iconUrl?: string | null;

  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  canonicalUrl?: string | null;

  robotsIndex: boolean;
  robotsFollow: boolean;

  thumbnailAsset?: StorefrontMediaAsset | null;
  imageAsset?: StorefrontMediaAsset | null;
  bannerAsset?: StorefrontMediaAsset | null;
  image?: StorefrontMediaAsset | null;
}

export interface PublicCategoryFilterOption {
  id: string;
  label: string;

  value?:
    | string
    | boolean;

  slug?: string | null;
  swatchValue?: string | null;
  displayOrder?: number;
  count: number;
}

export interface PublicCategoryFilter {
  id?: string;
  code: string;
  label: string;

  type?: string;
  inputType?: string;
  dataType?: string;
  unit?: string | null;
  displayOrder?: number;

  minimum?: number | null;
  maximum?: number | null;
  currencyCode?: string;

  options?: PublicCategoryFilterOption[];
}

export interface PublicCategorySortOption {
  value: string;
  label: string;
}

export interface PublicCategoryPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface PublicCategoryAttributeRange {
  min?: number;
  max?: number;
}

export interface PublicCategoryAppliedFilters {
  search?: string | null;
  brandIds: string[];
  optionIds: string[];

  attributeRanges?: Record<
    string,
    PublicCategoryAttributeRange
  >;

  minPrice?: number | null;
  maxPrice?: number | null;
  sort: string;
}

export interface PublicCategoryData {
  company: Pick<
    StorefrontCompany,
    "id" | "name" | "code" | "currency"
  >;

  category: PublicCategory;
  breadcrumbs: PublicCategoryBreadcrumb[];
  children: PublicCategory[];

  products: StorefrontProduct[];
  filters: PublicCategoryFilter[];
  sortOptions: PublicCategorySortOption[];
  pagination: PublicCategoryPagination;
  appliedFilters: PublicCategoryAppliedFilters;

  resolvedPriceList?: {
    id: string;
    code: string;
    name: string;
    currencyCode: string;
    isTaxInclusive: boolean;
  } | null;

  meta: {
    channel: "WEBSITE" | "KIOSK";
    includesDescendants: boolean;
    categoryIds: string[];
    generatedAt: string;
  };
}

export interface PublicCategoryApiResponse {
  success: boolean;
  data: PublicCategoryData;
}

export interface PublicCategoryQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  brandIds?: string[];

  /*
   * Contains both real option UUIDs and generated
   * text tokens such as:
   * text:<attributeId>:A19%20Pro%20Chip
   */
  attributeOptionIds?: string[];

  attributeRanges?: Record<
    string,
    PublicCategoryAttributeRange
  >;

  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  channel?: "WEBSITE" | "KIOSK";
}
