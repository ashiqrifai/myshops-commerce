  import type {
      MediaAsset,
    } from "@/types/media";
    
    export type NavigationChannel =
      | "WEBSITE"
      | "KIOSK"
      | "BOTH";
    
    export type NavigationMenuType =
      | "SIMPLE"
      | "DROPDOWN"
      | "MEGA_MENU";
    
      export type NavigationItemType =
      | "CUSTOM_LINK"
      | "CATEGORY"
      | "BRAND"
      | "PRODUCT"
      | "COLLECTION"
      | "CMS_PAGE"
      | "DROPDOWN"
      | "MEGA_MENU"
      | "HEADING"
      | "PROMOTION";
    
    export interface NavigationUserSummary {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
    }

    export type NavigationAudience =
    | "ALL"
    | "GUEST_ONLY"
    | "AUTHENTICATED_ONLY";

  export type NavigationRuleChannel =
    | "WEBSITE"
    | "KIOSK";

  export type NavigationRuleDevice =
    | "DESKTOP"
    | "TABLET"
    | "MOBILE";
  
  export type NavigationPromotionTextAlign =
  | "LEFT"
  | "CENTER"
  | "RIGHT";

  export type NavigationPromotionOverlay =
  | "NONE"
  | "LIGHT"
  | "DARK";

  export interface NavigationVisibilityRules {
    audience:
      NavigationAudience;

    channels:
      NavigationRuleChannel[];

    devices:
      NavigationRuleDevice[];

    requirePromotion:
      boolean;

    promotionStartAt:
      string | null;

    promotionEndAt:
      string | null;
  }

  export interface NavigationItemSettings
  extends Record<string, unknown> {
  visibilityRules?:
    NavigationVisibilityRules;

  promotion?:
    NavigationPromotionSettings;
}
    
    export interface NavigationItem {
      id: string;
      companyId: string;
      navigationMenuId: string;
    
      parentId: string | null;
    
      label: string;
    
      itemType:
        NavigationItemType;
    
      referenceId:
        string | null;
    
      url: string | null;
      icon: string | null;
    
      mediaAssetId:
        string | null;
    
      mediaAsset?:
        MediaAsset | null;
    
      description:
        string | null;
    
      badgeText:
        string | null;
    
      badgeColor:
        string | null;
    
      displayOrder: number;
      depth: number;
      columnNumber: number;
    
      openInNewTab: boolean;
      desktopVisible: boolean;
      mobileVisible: boolean;
      isFeatured: boolean;
    
      settings:
        NavigationItemSettings;
    
      isActive: boolean;
    
      createdBy:
        string | null;
    
      updatedBy:
        string | null;
    
      createdAt: string;
      updatedAt: string;
    
      children:
        NavigationItem[];
    }
    
    export interface NavigationMenu {
      id: string;
      companyId: string;
    
      name: string;
      code: string;
    
      channel:
        NavigationChannel;
    
      menuType:
        NavigationMenuType;
    
      description:
        string | null;
    
      settings:
        Record<string, unknown>;
    
      isActive: boolean;
    
      createdBy:
        string | null;
    
      updatedBy:
        string | null;
    
      createdAt: string;
      updatedAt: string;
    
      itemCount?: number;
    
      createdByUser?:
        NavigationUserSummary | null;
    
      updatedByUser?:
        NavigationUserSummary | null;
    
      items:
        NavigationItem[];
    }
    
    export interface NavigationMenuFormValues {
      name: string;
      code: string;
    
      channel:
        NavigationChannel;
    
      menuType:
        NavigationMenuType;
    
      description:
        string | null;
    
      settings:
        Record<string, unknown>;
    }
    
    export interface NavigationItemFormValues {
      parentId:
        string | null;
    
      label: string;
    
      itemType:
        NavigationItemType;
    
      referenceId:
        string | null;
    
      url:
        string | null;
    
      icon:
        string | null;
    
      mediaAssetId:
        string | null;
    
      description:
        string | null;
    
      badgeText:
        string | null;
    
      badgeColor:
        string | null;
    
      displayOrder?: number;
    
      columnNumber: number;
    
      openInNewTab: boolean;
      desktopVisible: boolean;
      mobileVisible: boolean;
      isFeatured: boolean;
      isActive: boolean;
      
      settings:
        NavigationItemSettings;
    }
    
    export interface NavigationMenuListParams {
      page?: number;
      pageSize?: number;
    
      search?: string;
    
      channel?:
        NavigationChannel;
    
      menuType?:
        NavigationMenuType;
    
      isActive?: boolean;
    }
    
    export interface NavigationPagination {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    }
    
    export interface NavigationMenuListResponse {
      success: boolean;
      data: NavigationMenu[];
      pagination:
        NavigationPagination;
    }
    
    export interface NavigationMenuResponse {
      success: boolean;
      message?: string;
      data: NavigationMenu;
    }
    
    export interface ReorderNavigationItem {
      id: string;
    
      parentId:
        string | null;
    
      displayOrder: number;
    
      columnNumber?: number;
    }
    
    export interface ReorderNavigationItemsRequest {
      menuId: string;
    
      items:
        ReorderNavigationItem[];
    }

 

export interface NavigationPromotionSettings {
  eyebrow:
    string | null;

  title:
    string | null;

  subtitle:
    string | null;

  description:
    string | null;

  ctaText:
    string | null;

  ctaUrl:
    string | null;

  textAlign:
    NavigationPromotionTextAlign;

  overlay:
    NavigationPromotionOverlay;

  textColor:
    string | null;

  backgroundColor:
    string | null;
}

