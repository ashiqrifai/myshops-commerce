export interface AdminOrder {
  id: string;

  companyId?: string | null;

  orderNumber: string;

  customerId?: string | null;

  channelCode?: string | null;

  customerFirstName?: string | null;

  customerLastName?: string | null;

  customerName?: string;

  customerEmail?: string | null;

  customerPhone?: string | null;

  currencyCode: string;

  subtotal: number;

  discountAmount: number;

  deliveryAmount: number;

  taxAmount: number;

  grandTotal: number;

  couponCode?: string | null;

  deliveryMethod: string;

  paymentMethod: string;

  paymentStatus: string;

  orderStatus: string;

  fulfillmentStatus: string;

  zohoSalesOrderId?: string | null;

  zohoSalesOrderNumber?: string | null;

  zohoSyncStatus?: string | null;

  zohoSyncError?: string | null;

  zohoSyncedAt?: string | null;

  notes?: string | null;

  placedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface AdminOrderItem {
  id: string;

  companyId?: string;

  orderId: string;

  productId?: string | null;

  productVariantId?: string | null;

  sku?: string | null;

  productName?: string | null;

  variantName?: string | null;

  quantity: number;

  currencyCode?: string | null;

  unitPrice: number;

  discountAmount?: number;

  taxPercent?: number;

  taxAmount?: number;

  lineSubtotal?: number;

  lineTotal: number;

  selectedDeliveryMethod?:
    | "STANDARD"
    | "EXPRESS"
    | "PICKUP"
    | null;

  fulfillmentMethod?:
    string | null;

  fulfillmentLabel?:
    string | null;

  deliveryLabel?:
    string | null;

  shipmentId?:
    string | null;

  shipmentNumber?:
    string | null;

  shipmentStatus?:
    | "PENDING"
    | "ALLOCATED"
    | "READY"
    | "DISPATCHED"
    | "DELIVERED"
    | "CANCELLED"
    | null;

  deliveryHours?:
    number | null;

  pickupLocationId?:
    string | null;

  pickupLocationCode?:
    string | null;

  pickupLocationName?:
    string | null;

  selectedPickupLocationId?:
    string | null;

  allocatedLocationId?:
    string | null;

  allocatedLocationCode?:
    string | null;

  allocatedLocationName?:
    string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface AdminOrderAddress {
  id: string;

  companyId?: string;

  orderId: string;

  addressType?: string;

  firstName?: string | null;

  lastName?: string | null;

  email?: string | null;

  phone?: string | null;

  addressLine1?: string | null;

  addressLine2?: string | null;

  emirate?: string | null;

  city?: string | null;

  area?: string | null;

  landmark?: string | null;

  deliveryInstructions?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface AdminOrderPayment {
  id: string;

  companyId?: string;

  orderId: string;

  paymentMethod?: string | null;

  provider?: string | null;

  providerReference?: string | null;

  status?: string | null;

  paymentStatus?: string | null;

  amount?: number;

  currencyCode?: string | null;

  currency?: string | null;

  providerPayload?:
    | Record<string, unknown>
    | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface AdminOrderStatusHistory {
  id: string;

  companyId: string;

  orderId: string;

  statusType:
    | "ORDER"
    | "PAYMENT"
    | "FULFILLMENT";

  fromStatus?: string | null;

  toStatus: string;

  note?: string | null;

  changedBy?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface PaymentWebhookLog {
  id: string;

  companyId?: string | null;

  orderId?: string | null;

  orderPaymentId?: string | null;

  provider: string;

  providerReference?: string | null;

  eventType?: string | null;

  providerStatus?: string | null;

  processingStatus:
    | "RECEIVED"
    | "PROCESSED"
    | "FAILED"
    | "IGNORED";

  payload?:
    | Record<string, unknown>
    | null;

  responseStatus?: number | null;

  errorMessage?: string | null;

  receivedAt?: string | null;

  processedAt?: string | null;

  createdAt?: string;

  updatedAt?: string;
}

export interface AdminOrderCustomer {
  id?: string;

  firstName?: string | null;

  lastName?: string | null;

  email?: string | null;

  phone?: string | null;

  [key: string]:
    unknown;
}

export interface AdminOrderPagination {
  page: number;

  pageSize: number;

  total: number;

  totalPages: number;

  hasPreviousPage: boolean;

  hasNextPage: boolean;
}

export interface AdminOrderListParams {
  page?: number;

  pageSize?: number;

  search?: string;

  orderStatus?: string;

  paymentStatus?: string;

  paymentMethod?: string;

  fulfillmentStatus?: string;

  deliveryMethod?: string;

  dateFrom?: string;

  dateTo?: string;

  sortBy?: string;

  sortDirection?:
    | "ASC"
    | "DESC";
}

export interface AdminOrderListResponse {
  success: boolean;

  data: {
    orders:
      AdminOrder[];

    pagination:
      AdminOrderPagination;
  };

  meta?: {
    timestamp?: string;
  };
}

export interface AdminOrderDetailResponse {
  success: boolean;

  data: {
    order:
      AdminOrder;

    customer:
      AdminOrderCustomer |
      null;

    items:
      AdminOrderItem[];

    addresses:
      AdminOrderAddress[];

    payments:
      AdminOrderPayment[];

    statusHistory:
      AdminOrderStatusHistory[];

    webhookLogs:
      PaymentWebhookLog[];
  };

  meta?: {
    timestamp?: string;
  };
}

export interface AdminOrderSummary {
  totalOrders: number;

  pendingOrders: number;

  confirmedOrders: number;

  paidOrders: number;

  unfulfilledOrders: number;

  tamaraOrders: number;
}

export interface AdminOrderSummaryResponse {
  success: boolean;

  data: {
    summary:
      AdminOrderSummary;
  };
}

export interface UpdateAdminOrderStatusRequest {
  id: string;

  body: {
    orderStatus?: string;

    fulfillmentStatus?: string;

    note?: string;
  };
}

export interface UpdateAdminShipmentStatusRequest {
  id: string;

  shipmentId: string;

  body: {
    status:
      | "READY"
      | "DISPATCHED"
      | "DELIVERED";

    note?: string;
  };
}

export interface TamaraRefundRequest {
  orderId: string;

  amount: number;

  comment: string;
}

export interface TamaraRefundResponse {
  success: boolean;

  orderId?: string;

  tamaraOrderId?: string;

  merchantRefundId?: string;

  refundedAmount?: number;

  currency?: string;

  tamaraStatus?: string;

  paymentStatus?: string;

  orderStatus?: string;

  message?: string;

  refund?: unknown;

  tamaraOrder?: unknown;
}
