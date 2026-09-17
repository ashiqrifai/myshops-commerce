const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

export type TamaraEligibilityRequest = {
  amount: number;
  currency?: string;
  countryCode?: string;
  phoneNumber?: string;
};

export type TamaraEligibilityResponse = {
  success: boolean;
  eligible: boolean;
  data?: unknown;
  message?: string;
};

export type TamaraCheckoutItem = {
  id?: string;
  itemId?: string;
  referenceId?: string;

  name?: string;
  itemName?: string;
  productName?: string;

  sku?: string;
  itemCode?: string;
  code?: string;

  type?: string;

  quantity: number;
  unitPrice: number;
  totalAmount: number;

  taxAmount?: number;
  discountAmount?: number;
};

export type TamaraAddress = {
  firstName?: string;
  first_name?: string;

  lastName?: string;
  last_name?: string;

  line1?: string;
  addressLine1?: string;

  line2?: string;
  addressLine2?: string;

  region?: string;
  emirate?: string;

  city?: string;

  countryCode?: string;
  country_code?: string;

  phoneNumber?: string;
  phone_number?: string;
};

export type TamaraConsumer = {
  firstName?: string;
  first_name?: string;

  lastName?: string;
  last_name?: string;

  phoneNumber?: string;
  phone_number?: string;

  email: string;
};

export type TamaraCheckoutRequest = {
  orderId: string;

  consumer: TamaraConsumer;

  billingAddress: TamaraAddress;

  shippingAddress: TamaraAddress;

  items: TamaraCheckoutItem[];

  taxAmount?: number;

  shippingAmount?: number;

  discountName?: string;

  discountAmount?: number;

  locale?: string;

  paymentType?: string;
};

export type TamaraCheckoutResponse = {
  success: boolean;

  reused?: boolean;

  orderId: string;

  tamaraOrderId: string;

  checkoutId: string;

  checkoutUrl: string;

  status: string;

  message?: string;
};

export type TamaraReconcileResponse = {
  success: boolean;

  orderId?: string;

  tamaraOrderId?: string;

  tamaraStatus?: string;

  paymentStatus?: string;

  orderStatus?: string;

  successfulCheckout?: boolean;

  data?: unknown;

  message?: string;
};

const postJson = async <T>(
  path: string,
  body: unknown
): Promise<T> => {
  const response =
    await fetch(
      `${API_BASE}${path}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body:
          JSON.stringify(body),

        cache:
          "no-store",
      }
    );

  let data: any = null;

  try {
    data =
      await response.json();
  } catch {
    // ignore parse error
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
};

export const checkTamaraEligibility =
  async (
    request:
      TamaraEligibilityRequest
  ) => {
    return postJson<TamaraEligibilityResponse>(
      "/payments/tamara/public/eligibility",
      request
    );
  };

export const createTamaraCheckout =
  async (
    request:
      TamaraCheckoutRequest
  ) => {
    return postJson<TamaraCheckoutResponse>(
      "/payments/tamara/public/checkout",
      request
    );
  };

export const reconcileTamaraPayment =
  async (
    orderId: string
  ) => {
    return postJson<TamaraReconcileResponse>(
      "/payments/tamara/public/reconcile",
      {
        orderId,
      }
    );
  };