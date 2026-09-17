export type ProtectionSchemeType =
  | "EXTENDED_WARRANTY"
  | "DAMAGE_PROTECTION";

export type ProtectionPricingMethod =
  | "PERCENTAGE"
  | "FIXED";

export type ProtectionScopeType =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY";

export interface ProtectionSetting {
  id?: string;
  companyId?: string;
  isEnabled: boolean;
  minimumEligibleProductAmount: number;
  currencyCode: string;
  channelCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProtectionScheme {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description: string | null;
  schemeType: ProtectionSchemeType;
  durationMonths: number | null;
  pricingMethod: ProtectionPricingMethod;
  percentage: number | null;
  fixedAmount: number | null;
  minimumProductAmount: number | null;
  maximumProductAmount: number | null;
  currencyCode: string;
  coverageStartMode: string;
  termsAndConditions: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProtectionSchemeFormValues {
  code?: string | null;
  name: string;
  description?: string | null;
  schemeType: ProtectionSchemeType;
  durationMonths?: number | null;
  pricingMethod: ProtectionPricingMethod;
  percentage?: number | null;
  fixedAmount?: number | null;
  minimumProductAmount?: number | null;
  maximumProductAmount?: number | null;
  currencyCode: string;
  coverageStartMode: string;
  termsAndConditions?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface ProtectionAssignmentTarget {
  id: string;
  name: string;
  code?: string | null;
  slug?: string | null;
}

export interface ProtectionAssignment {
  id: string;
  companyId: string;
  schemeId: string;
  scopeType: ProtectionScopeType;
  scopeId: string;
  pricingMethod: ProtectionPricingMethod | null;
  percentage: number | null;
  fixedAmount: number | null;
  minimumProductAmount: number | null;
  maximumProductAmount: number | null;
  effectiveFrom: string | null;
  effectiveUntil: string | null;
  priority: number;
  isActive: boolean;
  scheme?: ProtectionScheme | null;
  target?: ProtectionAssignmentTarget | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProtectionAssignmentFormValues {
  schemeId: string;
  scopeType: ProtectionScopeType;
  scopeId: string;
  pricingMethod?: ProtectionPricingMethod | null;
  percentage?: number | null;
  fixedAmount?: number | null;
  minimumProductAmount?: number | null;
  maximumProductAmount?: number | null;
  effectiveFrom?: string | null;
  effectiveUntil?: string | null;
  priority: number;
  isActive: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ProtectionSchemeListResponse {
  success: boolean;
  data: ProtectionScheme[];
  pagination: Pagination;
}

export interface ProtectionSchemeResponse {
  success: boolean;
  message?: string;
  data: ProtectionScheme;
}

export interface ProtectionAssignmentListResponse {
  success: boolean;
  data: ProtectionAssignment[];
  pagination: Pagination;
}

export interface ProtectionAssignmentResponse {
  success: boolean;
  message?: string;
  data: ProtectionAssignment;
}

export interface ProtectionSettingResponse {
  success: boolean;
  message?: string;
  data: ProtectionSetting | null;
}
