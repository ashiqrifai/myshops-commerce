import type {
    StorefrontCompany,
    StorefrontProduct,
  } from "@/types/storefront";
  
  export interface PublicSearchFilterOption {
    id:
      string;
  
    label:
      string;
  
    slug?:
      string | null;
  
    count:
      number;
  }
  
  export interface PublicSearchFilter {
    code:
      "BRAND" |
      "CATEGORY" |
      "PRICE" |
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
      PublicSearchFilterOption[];
  }
  
  export interface PublicSearchData {
    company: Pick<
      StorefrontCompany,
      | "id"
      | "name"
      | "code"
      | "currency"
    >;
  
    query:
      string;
  
    products:
      StorefrontProduct[];
  
    filters:
      PublicSearchFilter[];
  
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
      q:
        string | null;
  
      brandIds:
        string[];
  
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
  
  export interface PublicSearchApiResponse {
    success:
      boolean;
  
    data:
      PublicSearchData;
  }
  
  export interface PublicSearchQuery {
    q?:
      string;
  
    page?:
      number;
    
    featured?: boolean;
  
    pageSize?:
      number;
  
    brandIds?:
      string[];
  
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