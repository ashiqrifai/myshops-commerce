export interface GiftVoucherImportError {
  rowNumber?: number;
  promotionCode?: string | null;
  variantSku?: string | null;
  message: string;
}

export interface GiftVoucherImportPromotionResult {
  promotionCode: string;
  status:
    | "CREATED"
    | "UPDATED"
    | "FAILED";
  rowCount: number;
  assignmentCount?: number;
  message?: string;
}

export interface GiftVoucherImportResult {
  totalRows: number;
  promotionGroups: number;
  createdPromotions: number;
  updatedPromotions: number;
  successfulRows: number;
  failedRows: number;
  promotionResults:
    GiftVoucherImportPromotionResult[];
  errors:
    GiftVoucherImportError[];
}

export interface GiftVoucherImportResponse {
  success: boolean;
  message?: string;
  data: GiftVoucherImportResult;
}
