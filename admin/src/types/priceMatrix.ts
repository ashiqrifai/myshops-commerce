export interface PriceMatrixProduct {
    id: string;
    name: string;
    slug: string;
    status: string;
    productType: string;
    taxCode?: string | null;
    taxPercent: number;
  }
  
  export interface PriceMatrixContext {
    quantity: number;
    effectiveDate: string;
    currencyCode?: string | null;
    channelCode?: string | null;
    includeInactive: boolean;
  }
  
  export interface PriceMatrixPriceList {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    priceListType?: string | null;
    channelCode?: string | null;
    currencyCode: string;
    isTaxInclusive: boolean;
    isDefault: boolean;
    priority: number;
    validFrom?: string | null;
    validUntil?: string | null;
    isActive: boolean;
  }
  
  export interface PriceMatrixVariant {
    id: string;
    productId: string;
    sku: string;
    name: string;
    status: string;
  }
  
  export interface PriceMatrixPrice {
    id: string;
    productVariantId: string;
    priceListId: string;
    regularPrice: number;
    sellingPrice: number;
    compareAtPrice?: number | null;
    costPrice?: number | null;
    discountAmount: number;
    discountPercent: number;
    minimumQuantity: number;
    maximumQuantity?: number | null;
    validFrom?: string | null;
    validUntil?: string | null;
    priority: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface PriceMatrixRow {
    variant: PriceMatrixVariant;
  
    prices: Record<
      string,
      PriceMatrixPrice | null
    >;
  }
  
  export interface PriceMatrixSummary {
    variantCount: number;
    priceListCount: number;
    totalCellCount: number;
    populatedCellCount: number;
    emptyCellCount: number;
  }
  
  export interface PriceMatrix {
    product: PriceMatrixProduct;
    context: PriceMatrixContext;
    priceLists: PriceMatrixPriceList[];
    rows: PriceMatrixRow[];
    summary: PriceMatrixSummary;
  }
  
  export interface PriceMatrixResponse {
    success: boolean;
    message?: string;
    data: PriceMatrix;
  }
  
  export interface PriceMatrixParams {
    productId: string;
    quantity?: number;
    effectiveDate?: string;
    currencyCode?: string;
    channelCode?: string;
    includeInactive?: boolean;
  }