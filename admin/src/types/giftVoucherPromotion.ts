export type GiftVoucherDiscountType = "FIXED_AMOUNT" | "PERCENTAGE";
export type GiftVoucherFundingType = "INTERNAL" | "EXTERNAL";
export type GiftVoucherChannelCode = "WEBSITE" | "ALL";

export interface GiftVoucherPromotionItem {
  id?: string;
  productId: string;
  productVariantId?: string | null;
  isActive?: boolean;
  product?: { id: string; name: string; slug?: string | null; status?: string | null } | null;
  productVariant?: { id: string; productId: string; sku: string; name: string; status?: string | null } | null;
}

export interface GiftVoucherPromotion {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  discountType: GiftVoucherDiscountType;
  discountValue: number | string;
  fundingType: GiftVoucherFundingType;
  fundingSource?: string | null;
  currencyCode: string;
  channelCode: GiftVoucherChannelCode | string;
  validFrom: string;
  validUntil: string;
  priority: number | string;
  isActive: boolean;
  items: GiftVoucherPromotionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface GiftVoucherPromotionFormValues {
  code: string;
  name: string;
  description: string;
  discountType: GiftVoucherDiscountType;
  discountValue: string;
  fundingType: GiftVoucherFundingType;
  fundingSource: string;
  currencyCode: string;
  channelCode: GiftVoucherChannelCode;
  validFrom: string;
  validUntil: string;
  priority: string;
  isActive: boolean;
  items: GiftVoucherPromotionItem[];
}

export interface GiftVoucherPromotionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  fundingType?: GiftVoucherFundingType;
  discountType?: GiftVoucherDiscountType;
  channelCode?: GiftVoucherChannelCode;
  isActive?: boolean;
  validOn?: string;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export interface GiftVoucherPromotionListResponse {
  success: boolean;
  data: GiftVoucherPromotion[];
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
}

export interface GiftVoucherPromotionResponse {
  success: boolean;
  message?: string;
  data: GiftVoucherPromotion;
}
