export type PublicBundlePriceMode = "FREE" | "ADD_ON" | "FIXED_TOTAL";

export interface PublicBundlePromotionItem {
  id: string;
  itemType: "PRODUCT" | "PROTECTION_PLAN" | "TEXT";
  productId?: string | null;
  productVariantId?: string | null;
  protectionSchemeId?: string | null;
  label: string;
  description?: string | null;
  quantity: number;
  isIncluded: boolean;
  sortOrder: number;
  product?: { id:string; name:string; slug:string; productType:string; parentSku?:string|null } | null;
  productVariant?: { id:string; productId:string; sku:string; barcode?:string|null; name:string; isDefault:boolean } | null;
  protectionScheme?: { id:string; code:string; name:string; schemeType:string; durationMonths?:number|null; coverageStartMode?:string|null } | null;
}
export interface PublicBundlePromotion {
  id:string; code:string; name:string; description?:string|null;
  priceMode:PublicBundlePriceMode; priceAmount?:number|null; currencyCode:string;
  startsAt?:string|null; endsAt?:string|null; badgeText?:string|null; isDefault?:boolean;
  sortOrder:number; items:PublicBundlePromotionItem[];
}
export interface PublicBundleSelectionConfig {
  configId:string; source:"VARIANT"|"PRODUCT"; productId:string; productVariantId?:string|null;
  channelCode:string; bundlesOptional:boolean; maxBundleSelectionsPerUnit:number;
  maxBundlesDisplayed:number; bundles:PublicBundlePromotion[];
}
export interface PublicBundlePromotionsData {
  defaultVariantId?:string|null;
  selected?:PublicBundleSelectionConfig|null;
  byVariant?:Record<string,PublicBundleSelectionConfig|null>;
}
export interface CartBundleSelection {
  bundlePromotionId:string; selectionQuantity:number; code:string; name:string;
  description?:string|null; priceMode:PublicBundlePriceMode; priceAmount?:number|null;
  currencyCode:string; badgeText?:string|null;
  items:Array<{id:string;itemType:"PRODUCT"|"PROTECTION_PLAN"|"TEXT";label:string;
    description?:string|null;quantity:number;productId?:string|null;productVariantId?:string|null;
    protectionSchemeId?:string|null;protectionSchemeCode?:string|null;protectionSchemeName?:string|null;}>;
}
