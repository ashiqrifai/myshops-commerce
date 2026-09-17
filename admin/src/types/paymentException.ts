export type PaymentExceptionProvider =
  | "NETWORK_INTERNATIONAL"
  | "TAMARA"
  | "TABBY";

export type PaymentExceptionStatus =
  | "OPEN"
  | "RETRYING"
  | "RESOLVED"
  | "REFUND_REQUIRED"
  | "REFUNDED"
  | "MANUAL_REVIEW";

export type PaymentExceptionSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface PaymentExceptionOrder {
  id: string;
  orderNumber: string;
  customerFirstName: string;
  customerLastName?: string | null;
  customerEmail: string;
  customerPhone: string;
  grandTotal: number | string;
  currencyCode: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryMethod: string;
  createdAt: string;
  items?: Array<{
    id: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number | string;
    unitPrice: number | string;
    lineTotal: number | string;
  }>;
  shipments?: Array<{
    id: string;
    shipmentNumber: string;
    deliveryZoneCode?: string | null;
    deliveryLabel?: string | null;
    deliveryMethod: string;
    deliveryHours?: number | null;
    deliveryMinDays?: number | null;
    deliveryMaxDays?: number | null;
    status: string;
    items?: Array<{
      id: string;
      sku: string;
      quantity: number | string;
    }>;
    allocations?: Array<{
      id: string;
      productVariantId: string;
      quantityAllocated: number | string;
      quantityFulfilled: number | string;
      status: string;
      inventoryLocation?: {
        id: string;
        code: string;
        name: string;
      } | null;
    }>;
  }>;
}

export interface PaymentExceptionPayment {
  id: string;
  paymentMethod?: string | null;
  provider?: string | null;
  providerReference?: string | null;
  status?: string | null;
  amount?: number | string | null;
  currencyCode?: string | null;
  providerPayload?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentException {
  id: string;
  companyId: string;
  orderId: string;
  orderPaymentId?: string | null;
  exceptionCode: string;
  provider: PaymentExceptionProvider;
  providerState?: string | null;
  status: PaymentExceptionStatus;
  severity: PaymentExceptionSeverity;
  title: string;
  message?: string | null;
  amount?: number | string | null;
  currencyCode?: string | null;
  retryCount: number;
  lastRetryAt?: string | null;
  resolvedAt?: string | null;
  resolutionNote?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  order?: PaymentExceptionOrder | null;
  payment?: PaymentExceptionPayment | null;
}

export interface PaymentExceptionListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: PaymentExceptionStatus;
  provider?: PaymentExceptionProvider;
  companyId?: string;
}

export interface PaymentExceptionListResponse {
  success: boolean;
  data: {
    items: PaymentException[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      pages: number;
    };
  };
}

export interface PaymentExceptionDetailResponse {
  success: boolean;
  data: PaymentException;
}

export interface PaymentExceptionMutationResponse {
  success: boolean;
  data:
    | PaymentException
    | {
        exceptionId: string;
        recovery: {
          latePayment?: boolean;
          recovered?: boolean;
          recoveryRequired?: boolean;
          paymentException?: string;
          error?: string;
        };
      };
}
