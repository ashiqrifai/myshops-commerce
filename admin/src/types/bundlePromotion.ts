export type BundlePriceMode = "FREE" | "ADD_ON" | "FIXED_TOTAL";
export type BundleItemType = "PRODUCT" | "PROTECTION_PLAN" | "TEXT";
export type BundleChannelCode = "WEBSITE" | "KIOSK";

export interface BundleItem {
  id?: string;
  itemType: BundleItemType;
  productId?: string | null;
  productVariantId?: string | null;
  protectionSchemeId?: string | null;
  label: string;
  description?: string | null;
  quantity: number;
  isIncluded: boolean;
  sortOrder: number;
  isActive: boolean;
  product?: { id: string; name: string } | null;
  productVariant?: { id: string; productId?: string; sku: string; name: string; zohoItemId?: string | null; zohoItemCode?: string | null } | null;
  protectionScheme?: { id: string; code: string; name: string; zohoItemId?: string | null } | null;
}

export interface Bundle {
  id?: string;
  configId?: string;
  code: string;
  name: string;
  description?: string | null;
  priceMode: BundlePriceMode;
  priceAmount?: number | null;
  currencyCode: string;
  startsAt?: string | null;
  endsAt?: string | null;
  badgeText?: string | null;
  isDefault: boolean;
  sortOrder: number;
  isActive: boolean;
  items?: BundleItem[];
}

export interface BundleConfig {
  id?: string;
  productId: string;
  productVariantId?: string | null;
  channelCode: BundleChannelCode;
  bundlesOptional: boolean;
  maxBundleSelectionsPerUnit: number;
  maxBundlesDisplayed: number;
  isActive: boolean;
  product?: { id: string; name: string } | null;
  productVariant?: { id: string; sku: string; name: string; zohoItemId?: string | null; zohoItemCode?: string | null } | null;
  bundles?: Bundle[];
  createdAt?: string;
  updatedAt?: string;
}

export interface BundleConfigListResponse { success: boolean; data: BundleConfig[]; pagination?: { page:number; pageSize:number; totalItems:number; totalPages:number } }
export interface BundleConfigResponse { success:boolean; message?:string; data:BundleConfig }
export interface BundleListResponse { success:boolean; data:Bundle[] }
export interface BundleResponse { success:boolean; message?:string; data:Bundle }
export interface BundleItemListResponse { success:boolean; data:BundleItem[] }
export interface BundleItemResponse { success:boolean; message?:string; data:BundleItem }
