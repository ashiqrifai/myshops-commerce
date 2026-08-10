import type {
    StorefrontCompany,
    StorefrontMediaAsset,
    StorefrontProduct,
  } from "@/types/storefront";
  
  export interface PublicBrand {
    id:
      string;
  
    name:
      string;
  
    code:
      string;
  
    slug:
      string;
  
    description:
      string | null;
  
    websiteUrl:
      string | null;
  
    countryOfOrigin:
      string | null;
  
    isFeatured:
      boolean;
  
    logoAsset:
      StorefrontMediaAsset | null;
  
    bannerAsset:
      StorefrontMediaAsset | null;
  
    image:
      StorefrontMediaAsset | null;
  
    metaTitle:
      string | null;
  
    metaDescription:
      string | null;
  
    metaKeywords:
      string | null;
  }
  
  export interface PublicBrandBreadcrumb {
    label:
      string;
  
    url:
      string;
  }
  
  export interface PublicBrandFilterOption {
    id:
      string;
  
    label:
      string;
  
    slug?:
      string | null;
  
    count:
      number;
  }
  
  export interface PublicBrandFilter {
    code:
      string;
  
    label:
      string;
  
    type:
      string;
  
    minimum?:
      number | null;
  
    maximum?:
      number | null;
  
    currencyCode?:
      string;
  
    options?:
      PublicBrandFilterOption[];
  }
  
  export interface PublicBrandData {
    company: Pick<
      StorefrontCompany,
      | "id"
      | "name"
      | "code"
      | "currency"
    >;
  
    brand:
      PublicBrand;
  
    breadcrumbs:
      PublicBrandBreadcrumb[];
  
    products:
      StorefrontProduct[];
  
    filters:
      PublicBrandFilter[];
  
    sortOptions: Array<{
      value:
        string;
  
      label:
        string;
    }>;
  
    pagination: {
      page:
        number;
  
      pageSize:
        number;
  
      totalItems:
        number;
  
      totalPages:
        number;
  
      hasPreviousPage:
        boolean;
  
      hasNextPage:
        boolean;
    };
  
    appliedFilters: {
      search:
        string | null;
  
      categoryIds:
        string[];
  
      minPrice:
        number | null;
  
      maxPrice:
        number | null;
  
      sort:
        string;
    };
  
    resolvedPriceList?: {
      id:
        string;
  
      code:
        string;
  
      name:
        string;
  
      currencyCode:
        string;
  
      isTaxInclusive:
        boolean;
    } | null;
  
    meta: {
      channel:
        "WEBSITE" |
        "KIOSK";
  
      generatedAt:
        string;
    };
  }
  
  export interface PublicBrandApiResponse {
    success:
      boolean;
  
    data:
      PublicBrandData;
  }
  
  export interface PublicBrandQuery {
    page?:
      number;
  
    pageSize?:
      number;
  
    search?:
      string;
  
    categoryIds?:
      string[];
  
    minPrice?:
      number;
  
    maxPrice?:
      number;
  
    sort?:
      string;
  
    channel?:
      "WEBSITE" |
      "KIOSK";
  }