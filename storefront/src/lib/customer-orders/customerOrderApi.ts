const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export interface CustomerOrderProtectionPlan {
  id: string;

  schemeId: string;

  assignmentId:
    | string
    | null;

  schemeCode: string;

  schemeName: string;

  schemeType: string;

  durationMonths:
    | number
    | null;

  pricingMethod: string;

  productUnitPrice: number;

  percentageApplied:
    | number
    | null;

  protectionUnitPrice: number;

  quantity: number;

  totalAmount: number;

  currencyCode: string;

  status: string;

  coverageStartMode:
    | string
    | null;

  coverageStartDate:
    | string
    | null;

  coverageEndDate:
    | string
    | null;
}

export interface CustomerOrderItem {
  id: string;

  productId: string;

  productVariantId: string;

  sku: string;

  productName: string;

  variantName: string;

  quantity: number;

  currencyCode?: string;

  unitPrice: number;

  discountAmount?: number;

  taxPercent?: number;

  taxAmount?: number;

  lineSubtotal?: number;

  lineTotal: number;

  protectionPlans:
    CustomerOrderProtectionPlan[];
}

export interface CustomerOrderAddress {
  id: string;

  addressType:
    | "SHIPPING"
    | "BILLING";

  firstName: string;

  lastName:
    | string
    | null;

  email:
    | string
    | null;

  mobile: string;

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

  deliveryInstructions:
    | string
    | null;
}

export interface CustomerOrderPayment {
  id: string;

  paymentMethod:
    | "COD"
    | "CARD"
    | "TABBY"
    | "TAMARA";

  status:
    | "PENDING"
    | "AUTHORIZED"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";

  amount: number;

  currencyCode: string;

  provider:
    | string
    | null;

  providerReference:
    | string
    | null;

  paidAt:
    | string
    | null;
}

export interface CustomerOrderStatusHistory {
  id: string;

  statusType:
    | "ORDER"
    | "PAYMENT"
    | "FULFILLMENT";

  fromStatus:
    | string
    | null;

  toStatus: string;

  note:
    | string
    | null;

  createdAt: string;
}

export interface CustomerOrderSummary {
  id: string;

  orderNumber: string;

  channelCode: string;

  currencyCode: string;

  subtotal: number;

  discountAmount: number;

  deliveryAmount: number;

  taxAmount: number;

  grandTotal: number;

  deliveryMethod:
    | "STANDARD"
    | "EXPRESS"
    | "PICKUP";

  paymentMethod:
    | "COD"
    | "CARD"
    | "TABBY"
    | "TAMARA";

  paymentStatus: string;

  orderStatus: string;

  fulfillmentStatus: string;

  placedAt: string;

  createdAt: string;

  itemCount: number;

  items:
    CustomerOrderItem[];
}

export interface CustomerOrderDetails {
  id: string;

  orderNumber: string;

  channelCode: string;

  customer: {
    firstName: string;

    lastName:
      | string
      | null;

    email: string;

    phone: string;
  };

  currencyCode: string;

  subtotal: number;

  discountAmount: number;

  deliveryAmount: number;

  taxAmount: number;

  grandTotal: number;

  couponCode:
    | string
    | null;

  deliveryMethod: string;

  paymentMethod: string;

  paymentStatus: string;

  orderStatus: string;

  fulfillmentStatus: string;

  notes:
    | string
    | null;

  placedAt: string;

  createdAt: string;

  items:
    CustomerOrderItem[];

  addresses:
    CustomerOrderAddress[];

  payments:
    CustomerOrderPayment[];

  statusHistory:
    CustomerOrderStatusHistory[];
}

export interface CustomerOrdersPagination {
  page: number;

  pageSize: number;

  total: number;

  totalPages: number;
}

interface CustomerOrdersEnvelope {
  success: boolean;

  data?: {
    orders:
      CustomerOrderSummary[];

    pagination:
      CustomerOrdersPagination;
  };

  error?: {
    code?: string;
    message?: string;
  };
}

interface CustomerOrderDetailsEnvelope {
  success: boolean;

  data?: {
    order:
      CustomerOrderDetails;
  };

  error?: {
    code?: string;
    message?: string;
  };
}

export class CustomerOrderApiError extends Error {
  status: number;

  code:
    | string
    | undefined;

  constructor({
    message,
    status,
    code,
  }: {
    message: string;
    status: number;
    code?: string;
  }) {
    super(
      message
    );

    this.name =
      "CustomerOrderApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

const request =
  async <T>({
    path,
    accessToken,
  }: {
    path: string;

    accessToken:
      string;
  }): Promise<T> => {
    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            "x-company-code":
              COMPANY_CODE,

            Authorization:
              `Bearer ${accessToken}`,
          },

          credentials:
            "include",

          cache:
            "no-store",
        }
      );

    let payload:
      | T
      | undefined;

    try {
      payload =
        await response.json();
    } catch {
      payload =
        undefined;
    }

    if (
      !response.ok
    ) {
      const errorPayload =
        payload as
          | {
              error?: {
                code?: string;
                message?: string;
              };
            }
          | undefined;

      throw new CustomerOrderApiError({
        status:
          response.status,

        code:
          errorPayload
            ?.error
            ?.code,

        message:
          errorPayload
            ?.error
            ?.message ||
          `Order request failed. HTTP ${response.status}`,
      });
    }

    if (
      !payload
    ) {
      throw new CustomerOrderApiError({
        status:
          response.status,

        code:
          "INVALID_ORDER_RESPONSE",

        message:
          "The order API returned an invalid response.",
      });
    }

    return payload;
  };

export const getCustomerOrders =
  async ({
    accessToken,
    page = 1,
    pageSize = 20,
  }: {
    accessToken:
      string;

    page?: number;

    pageSize?: number;
  }) => {
    const payload =
      await request<CustomerOrdersEnvelope>({
        path:
          `/customer/orders?page=${encodeURIComponent(
            String(
              page
            )
          )}&pageSize=${encodeURIComponent(
            String(
              pageSize
            )
          )}`,

        accessToken,
      });

    if (
      !payload.success ||
      !payload.data
    ) {
      throw new CustomerOrderApiError({
        status:
          500,

        code:
          "INVALID_CUSTOMER_ORDERS_RESPONSE",

        message:
          "The orders API returned an invalid response.",
      });
    }

    return payload.data;
  };

export const getCustomerOrder =
  async ({
    accessToken,
    orderId,
  }: {
    accessToken:
      string;

    orderId: string;
  }) => {
    const payload =
      await request<CustomerOrderDetailsEnvelope>({
        path:
          `/customer/orders/${encodeURIComponent(
            orderId
          )}`,

        accessToken,
      });

    if (
      !payload.success ||
      !payload.data
        ?.order
    ) {
      throw new CustomerOrderApiError({
        status:
          500,

        code:
          "INVALID_CUSTOMER_ORDER_RESPONSE",

        message:
          "The order API returned an invalid response.",
      });
    }

    return payload.data
      .order;
  };
