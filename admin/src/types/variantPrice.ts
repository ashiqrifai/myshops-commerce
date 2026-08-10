import type {
    Pagination,
    PriceList,
    PriceListUser,
    SortDirection,
  } from "@/types/priceList";
  
  /*
   * PostgreSQL/Sequelize DECIMAL values may arrive as strings.
   * Keeping both types prevents incorrect assumptions in the UI.
   */
  export type DecimalValue =
    | number
    | string;
  
  export interface VariantPriceProduct {
    id: string;
  
    name?: string;
    slug?: string | null;
    code?: string | null;
  
    status?: string;
    isActive?: boolean;
  
    featuredImageUrl?: string | null;
  
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface VariantPriceVariant {
    id: string;
  
    companyId?: string;
  
    productId?: string;
  
    name?: string | null;
  
    sku: string;
  
    barcode?: string | null;
  
    isDefault?: boolean;
    isActive?: boolean;
  
    product?: VariantPriceProduct | null;
  
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface VariantPrice {
    id: string;
  
    companyId: string;
  
    productVariantId: string;
  
    priceListId: string;
  
    regularPrice: DecimalValue;
  
    sellingPrice: DecimalValue;
  
    compareAtPrice:
      | DecimalValue
      | null;
  
    costPrice:
      | DecimalValue
      | null;
  
    minimumQuantity: DecimalValue;
  
    maximumQuantity:
      | DecimalValue
      | null;
  
    validFrom:
      | string
      | null;
  
    validUntil:
      | string
      | null;
  
    priority: number;
  
    isActive: boolean;
  
    createdBy:
      | string
      | null;
  
    updatedBy:
      | string
      | null;
  
    createdAt: string;
  
    updatedAt: string;
  
    /*
     * Added by calculateDiscount() in the backend service.
     */
    discountAmount: number;
  
    discountPercent: number;
  
    variant: VariantPriceVariant;
  
    priceList: PriceList;
  
    createdByUser?:
      | PriceListUser
      | null;
  
    updatedByUser?:
      | PriceListUser
      | null;
  }
  
  export interface VariantPriceFormValues {
    productVariantId: string;
  
    priceListId: string;
  
    regularPrice: number;
  
    sellingPrice: number;
  
    compareAtPrice?:
      | number
      | null;
  
    costPrice?:
      | number
      | null;
  
    minimumQuantity: number;
  
    maximumQuantity?:
      | number
      | null;
  
    validFrom?:
      | string
      | null;
  
    validUntil?:
      | string
      | null;
  
    priority: number;
  
    isActive: boolean;
  }
  
  export type VariantPriceSortField =
    | "regularPrice"
    | "sellingPrice"
    | "compareAtPrice"
    | "costPrice"
    | "minimumQuantity"
    | "maximumQuantity"
    | "validFrom"
    | "validUntil"
    | "priority"
    | "isActive"
    | "createdAt"
    | "updatedAt";
  
  export interface VariantPriceListParams {
    page?: number;
  
    pageSize?: number;
  
    search?: string;
  
    productVariantId?: string;
  
    productId?: string;
  
    priceListId?: string;
  
    isActive?: boolean;
  
    validOn?: string;
  
    quantity?: number;
  
    sortBy?: VariantPriceSortField;
  
    sortDirection?: SortDirection;
  }
  
  export interface VariantPriceLookupParams {
    priceListId?: string;
  
    isActive?: boolean;
  
    validOn?: string;
  
    quantity?: number;
  }
  
  export interface VariantPriceListResponse {
    success: boolean;
  
    data: VariantPrice[];
  
    pagination: Pagination;
  }
  
  export interface VariantPriceResponse {
    success: boolean;
  
    message?: string;
  
    data: VariantPrice;
  }
  
  export interface VariantPriceCollectionResponse {
    success: boolean;
  
    data: VariantPrice[];
  }
  
  export interface DeleteVariantPriceResponse {
    success: boolean;
  
    message: string;
  
    data: {
      id: string;
    };
  }