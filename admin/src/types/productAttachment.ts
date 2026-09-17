export type ProductAttachmentScopeType =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY";

export type ProductAttachmentRelationshipType =
  | "ACCESSORY"
  | "UPSELL"
  | "CROSS_SELL"
  | "ADD_ON"
  | "BUNDLE_SUGGESTION"
  | "COMPATIBLE_PRODUCT";

export type ProductAttachmentDisplayLocation =
  | "PRODUCT_DETAIL"
  | "ADD_TO_CART"
  | "CART"
  | "CHECKOUT"
  | "ALL";

export interface ProductAttachmentTarget {
  id: string;
  name: string;
  slug?: string | null;
  code?: string | null;
}

export interface ProductAttachmentRuleItem {
  id?: string;
  companyId?: string;
  ruleId?: string;
  attachmentProductId: string;
  sortOrder: number;
  minimumQuantity: number;
  maximumQuantity: number | null;
  isActive: boolean;
  attachmentProduct?: ProductAttachmentTarget | null;
}

export interface ProductAttachmentRule {
  id: string;
  companyId: string;
  name: string;
  code: string;
  scopeType: ProductAttachmentScopeType;
  scopeId: string;
  productId?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  relationshipType: ProductAttachmentRelationshipType;
  displayLocation: ProductAttachmentDisplayLocation;
  priority: number;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  isActive: boolean;
  product?: ProductAttachmentTarget | null;
  brand?: ProductAttachmentTarget | null;
  category?: ProductAttachmentTarget | null;
  items: ProductAttachmentRuleItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductAttachmentRuleFormValues {
  name: string;
  code?: string | null;
  scopeType: ProductAttachmentScopeType;
  scopeId: string;
  relationshipType: ProductAttachmentRelationshipType;
  displayLocation: ProductAttachmentDisplayLocation;
  priority: number;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  isActive: boolean;
  items: ProductAttachmentRuleItem[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ProductAttachmentRuleListResponse {
  success: boolean;
  data: ProductAttachmentRule[];
  pagination: Pagination;
}

export interface ProductAttachmentRuleResponse {
  success: boolean;
  message?: string;
  data: ProductAttachmentRule;
}
