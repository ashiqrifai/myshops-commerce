export type CmsPageType =
  | "HOME"
  | "CATEGORY"
  | "BRAND"
  | "PRODUCT"
  | "SEARCH"
  | "CART"
  | "CHECKOUT"
  | "OFFERS"
  | "LANDING"
  | "CUSTOM";

export type CmsPageChannel =
  | "WEBSITE"
  | "KIOSK"
  | "BOTH";

export type CmsPageStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "UNPUBLISHED"
  | "ARCHIVED";

export interface CmsPageUserSummary {
  id: string;
  firstName: string;
  lastName?: string | null;
  email?: string;
}

export interface CmsPage {
  id: string;
  companyId: string;
  name: string;
  code: string;
  slug: string;
  pageType: CmsPageType;
  channel: CmsPageChannel;
  status: CmsPageStatus;
  title?: string | null;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[] | null;
  layoutSettings?: Record<string, unknown> | null;
  publishedAt?: string | null;
  publishStartAt?: string | null;
  publishEndAt?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUser?: CmsPageUserSummary | null;
  updatedByUser?: CmsPageUserSummary | null;
}

export interface CmsPageListResponse {
  success: boolean;
  data: CmsPage[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CmsPageResponse {
  success: boolean;
  message?: string;
  data: CmsPage;
}

export interface CmsPageFormValues {
  name: string;
  code: string;
  slug: string;
  pageType: CmsPageType;
  channel: CmsPageChannel;
  title: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  layoutSettings: Record<string, unknown>;
  publishStartAt: string | null;
  publishEndAt: string | null;
  isDefault: boolean;
}

export interface CmsPageListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  pageType?: CmsPageType | "";
  channel?: CmsPageChannel | "";
  status?: CmsPageStatus | "";
  isActive?: boolean | "";
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

export type CmsSectionTypeCategory =
  | "GLOBAL"
  | "HERO"
  | "CATALOG"
  | "MARKETING"
  | "AI"
  | "KIOSK";

export type CmsSectionSupportedChannel =
  | "WEBSITE"
  | "KIOSK";

  export interface CmsSectionType {
    id: string;
    companyId: string;
    name: string;
    code: string;
    description?: string | null;
    category: CmsSectionTypeCategory;
    icon?: string | null;
    supportedChannels: CmsPageChannel[];
  
    defaultSettings: Record<
      string,
      unknown
    >;
  
    defaultContent: Record<
      string,
      unknown
    >;
  
    validationSchema?: Record<
      string,
      unknown
    > | null;
  
    isSystemType: boolean;
    displayOrder: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }

export interface CmsSectionVisibility {
  desktop: boolean;
  tablet: boolean;
  mobile: boolean;
  kiosk: boolean;
}

export interface CmsPageSection {
  id: string;
  companyId: string;
  cmsPageId: string;
  sectionTypeId: string;
  name: string;
  code: string;
  displayOrder: number;
  settings: Record<string, unknown>;
  content: Record<string, unknown>;
  visibility: CmsSectionVisibility;
  publishStartAt?: string | null;
  publishEndAt?: string | null;
  isEnabled: boolean;
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  sectionType: CmsSectionType;
  createdByUser?: CmsPageUserSummary | null;
  updatedByUser?: CmsPageUserSummary | null;
}

export interface CmsSectionTypesResponse {
  success: boolean;
  data: CmsSectionType[];
}

export interface CmsSectionTypeResponse {
  success: boolean;
  data: CmsSectionType;
}

export interface CmsPageSectionsResponse {
  success: boolean;
  message?: string;
  data: CmsPageSection[];
}

export interface CmsPageSectionResponse {
  success: boolean;
  message?: string;
  data: CmsPageSection;
}

export interface CmsSectionTypeListParams {
  category?: CmsSectionTypeCategory | "";
  channel?: CmsSectionSupportedChannel | "";
  search?: string;
  isActive?: boolean;
}

export interface CreateCmsPageSectionRequest {
  pageId: string;
  sectionTypeId: string;
  name?: string;
  code?: string;
  settings?: Record<string, unknown>;
  content?: Record<string, unknown>;
  visibility?: Partial<CmsSectionVisibility>;
  publishStartAt?: string | null;
  publishEndAt?: string | null;
  isEnabled?: boolean;
}

export interface UpdateCmsPageSectionRequest {
  pageId: string;
  sectionId: string;
  body: {
    name?: string;
    code?: string;
    settings?: Record<string, unknown>;
    content?: Record<string, unknown>;
    visibility?: Partial<CmsSectionVisibility>;
    publishStartAt?: string | null;
    publishEndAt?: string | null;
    isEnabled?: boolean;
  };
}

export interface ReorderCmsPageSectionsRequest {
  pageId: string;
  sections: Array<{
    id: string;
    displayOrder: number;
  }>;
}