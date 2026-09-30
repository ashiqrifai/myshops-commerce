export type KioskPageType = "HOME" | "OFFERS" | "WELCOME" | "IDLE" | "CUSTOM";
export type KioskDeviceStatus = "PENDING" | "ACTIVE" | "DISABLED";

export interface KioskInventoryLocation { id:string; code:string; name:string; locationType?:string|null; isActive:boolean; }
export interface KioskCmsPage { id:string; name:string; code:string; slug:string; pageType:string; channel:"WEBSITE"|"KIOSK"|"BOTH"; status:string; isActive:boolean; }
export interface KioskProfilePage { id:string; companyId:string; kioskProfileId:string; pageType:KioskPageType; cmsPageId:string; isActive:boolean; cmsPage:KioskCmsPage; }
export interface KioskDevice { id:string; deviceCode:string; deviceName:string; status:KioskDeviceStatus; appVersion?:string|null; lastSeenAt?:string|null; }
export interface KioskProfile { id:string; companyId:string; inventoryLocationId:string; name:string; code:string; description?:string|null; settings:Record<string,unknown>; isDefault:boolean; isActive:boolean; inventoryLocation:KioskInventoryLocation; pages:KioskProfilePage[]; devices:KioskDevice[]; createdAt:string; updatedAt:string; }
export interface KioskProfileListResponse { success:boolean; data:KioskProfile[]; }
export interface KioskProfileResponse { success:boolean; message?:string; data:KioskProfile; }
export interface CreateKioskProfilePayload {
    name: string;
    code: string;
    inventoryLocationId: string;

    // CMS page used as the template for the
    // store-specific dedicated kiosk HOME page.
    sourceCmsPageId: string;

    description?: string | null;
    settings?: Record<string, unknown>;
    isDefault?: boolean;
  }
export interface UpdateKioskProfilePayload { name?:string; code?:string; inventoryLocationId?:string; description?:string|null; settings?:Record<string,unknown>; isDefault?:boolean; isActive?:boolean; }
export interface AssignKioskPagePayload { pageType:KioskPageType; cmsPageId:string; }
