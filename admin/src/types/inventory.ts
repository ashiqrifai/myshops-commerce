export interface InventoryLocationSummary {
  id: string;
  code: string;
  name: string;
  locationType: string;
  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;
}

export interface InventoryProductSummary {
  id: string;
  name: string;
  slug?: string;
  isDirectDelivery?: boolean;
}

export interface InventoryVariantSummary {
  id: string;
  productId: string;
  sku: string;
  barcode:
    | string
    | null;
  name: string;

  product?: InventoryProductSummary;
}

export interface InventoryBalance {
  id: string;
  companyId: string;

  inventoryLocationId: string;
  productVariantId: string;

  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;

  createdAt: string;
  updatedAt: string;

  location:
    | InventoryLocationSummary
    | null;

  variant:
    | InventoryVariantSummary
    | null;
}

export interface InventoryListParams {
  page?: number;
  pageSize?: number;

  inventoryLocationId?: string;
  productVariantId?: string;
  productId?: string;

  search?: string;
  onlyAvailable?: boolean;
}

export interface InventoryPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface InventoryListResponse {
  success: boolean;
  data: InventoryBalance[];
  pagination: InventoryPagination;
}

export interface InventoryVariantAvailabilityLocation {
  inventoryLocationId: string;

  locationCode:
    | string
    | null;

  locationName:
    | string
    | null;

  locationType:
    | string
    | null;

  isDeliveryEnabled: boolean;
  isPickupEnabled: boolean;

  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
}

export interface InventoryVariantAvailability {
  productId: string;
  productVariantId: string;

  fulfillmentType:
    | "INTERNAL"
    | "DIRECT_DELIVERY";

  inventoryTracked: boolean;

  status:
    | "AVAILABLE"
    | "OUT_OF_STOCK";

  quantity:
    | number
    | null;

  locations:
    InventoryVariantAvailabilityLocation[];
}

export interface InventoryVariantAvailabilityResponse {
  success: boolean;
  data: InventoryVariantAvailability;
}

export interface InventoryBalanceUpsertRequest {
  inventoryLocationId: string;
  productVariantId: string;
  quantityOnHand: number;
  quantityReserved?: number;
}

export interface InventoryAdjustmentRequest {
  inventoryLocationId: string;
  productVariantId: string;
  adjustment: number;
  reason?: string;
}

export interface InventoryBalanceResponse {
  success: boolean;
  message?: string;
  data: InventoryBalance;
}
