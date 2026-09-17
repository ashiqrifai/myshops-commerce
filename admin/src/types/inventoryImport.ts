export interface InventoryImportRow {
  rowNumber: number;
  locationCode: string;
  variantSku: string;
  inventoryLocationId: string;
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;

  quantityOnHand: number;
  quantityReserved: number;

  action:
    | "CREATE"
    | "UPDATE"
    | "UNCHANGED";

  currentQuantityOnHand:
    | number
    | null;

  currentQuantityReserved:
    | number
    | null;
}

export interface InventoryImportError {
  rowNumber: number;
  locationCode?: string;
  variantSku?: string;
  message: string;
}

export interface InventoryImportPreviewResponse {
  success: boolean;
  message: string;

  data: {
    headers: string[];

    summary: {
      total: number;
      valid: number;
      create: number;
      update: number;
      unchanged: number;
      failed: number;
    };

    rows: InventoryImportRow[];
    errors:
      InventoryImportError[];
  };
}

export interface InventoryImportExecuteResponse {
  success: boolean;
  message: string;

  data: {
    summary: {
      total: number;
      created: number;
      updated: number;
      unchanged: number;
      failed: number;
    };

    rows: InventoryImportRow[];
    errors:
      InventoryImportError[];
  };
}
