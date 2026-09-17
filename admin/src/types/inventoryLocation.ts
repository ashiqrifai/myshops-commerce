export type InventoryLocationType =
  | "HUB"
  | "STORE"
  | "WAREHOUSE";

export interface InventoryLocation {
  id: string;
  companyId: string;
  code: string;
  name: string;
  locationType: InventoryLocationType;

  countryCode: string;
  country: string;

  emirate:
    | string
    | null;

  city:
    | string
    | null;

  area:
    | string
    | null;

  addressLine1:
    | string
    | null;

  addressLine2:
    | string
    | null;

  landmark:
    | string
    | null;

  latitude:
    | number
    | string
    | null;

  longitude:
    | number
    | string
    | null;

  phone:
    | string
    | null;

  email:
    | string
    | null;

  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;

  pickupLeadTimeMinutes: number;

  pickupInstructions:
    | string
    | null;

  isActive: boolean;
  sortOrder: number;

  createdBy:
    | string
    | null;

  updatedBy:
    | string
    | null;

  createdAt: string;
  updatedAt: string;
}

export interface InventoryLocationFormValues {
  name: string;
  code?: string;

  locationType:
    InventoryLocationType;

  countryCode?: string;
  country?: string;

  emirate?: string;
  city?: string;
  area?: string;

  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;

  latitude?:
    number
    | null;

  longitude?:
    number
    | null;

  phone?: string;
  email?: string;

  isDeliveryEnabled?: boolean;
  isPickupEnabled?: boolean;

  pickupLeadTimeMinutes?: number;

  pickupInstructions?: string;

  isActive?: boolean;
  sortOrder?: number;
}

export interface InventoryLocationListParams {
  page?: number;
  pageSize?: number;
  search?: string;

  locationType?:
    InventoryLocationType;

  isActive?: boolean;

  isDeliveryEnabled?:
    boolean;

  isPickupEnabled?:
    boolean;

  sortBy?:
    | "name"
    | "code"
    | "locationType"
    | "emirate"
    | "city"
    | "area"
    | "sortOrder"
    | "isActive"
    | "createdAt"
    | "updatedAt";

  sortDirection?:
    | "ASC"
    | "DESC";
}

export interface InventoryLocationPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryLocationListResponse {
  success: boolean;
  data: InventoryLocation[];
  pagination: InventoryLocationPagination;
}

export interface InventoryLocationResponse {
  success: boolean;
  message?: string;
  data: InventoryLocation;
}

export interface DeleteInventoryLocationResponse {
  success: boolean;
  message?: string;
  data: {
    id: string;
  };
}
