import type { KioskDeviceStatus, KioskInventoryLocation } from "@/types/kiosk";

export interface AdminKioskDevice {
  id:string; kioskProfileId?:string; deviceCode:string; deviceName:string;
  status:KioskDeviceStatus; appVersion?:string|null; lastSeenAt?:string|null; activatedAt?:string|null;
  kioskProfile?: {
    id:string; name:string; code:string; inventoryLocationId:string; isActive:boolean;
    inventoryLocation?:KioskInventoryLocation|null;
  }|null;
}
export interface KioskDeviceListResponse { success:boolean; data:AdminKioskDevice[]; }
export interface CreateKioskDevicePayload {
  kioskProfileId:string; deviceCode:string; deviceName:string; settings?:Record<string,unknown>;
}
export interface KioskDeviceActivationResponse {
  success:boolean; message?:string;
  data:{device:{id:string;kioskProfileId?:string;deviceCode:string;deviceName:string;status:KioskDeviceStatus};activationCode:string};
}
export interface KioskDeviceStatusResponse {
  success:boolean; data:{id:string;deviceCode:string;deviceName:string;status:KioskDeviceStatus};
}
