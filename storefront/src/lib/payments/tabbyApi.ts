const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const postJson = async <T>(
  path: string,
  body: unknown
): Promise<T> => {
  const response = await fetch(
    `${API_BASE}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );

  let data: any = null;
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data as T;
};

export type TabbyCheckoutResponse = {
  success: boolean;
  eligible?: boolean;
  reused?: boolean;
  orderId: string;
  sessionId?: string;
  paymentId: string;
  checkoutUrl: string;
  status: string;
  message?: string;
};

export type TabbyReconcileResponse = {
  success: boolean;
  orderId: string;
  paymentId?: string;
  tabbyStatus?: string | null;
  paymentStatus?: string;
  orderStatus?: string;
  successfulCheckout?: boolean;
  message?: string;
};

export const createTabbyCheckout = (
  orderId: string
) =>
  postJson<TabbyCheckoutResponse>(
    "/payments/tabby/public/checkout",
    {
      orderId,
      lang: "en",
    }
  );

export const reconcileTabbyPayment = (
  orderId: string
) =>
  postJson<TabbyReconcileResponse>(
    "/payments/tabby/public/reconcile",
    {
      orderId,
    }
  );


export type TabbyPrescoreItem = {
  id?: string;
  sku?: string;
  title: string;
  quantity: number;
  unitPrice: number;
  category?: string;
  referenceId?: string;
  description?: string;
  discountAmount?: number;
};

export type TabbyPrescoreRequest = {
  amount: number;
  currency?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  city?: string;
  address?: string;
  lang?: "en" | "ar";
  items?: TabbyPrescoreItem[];
};

export type TabbyPrescoreResponse = {
  success: boolean;
  eligible: boolean;
  pendingCustomerDetails?: boolean;
  status?: string | null;
  rejectionReason?: string | null;
  message?: string;
};

export const checkTabbyPrescore = (
  request: TabbyPrescoreRequest
) =>
  postJson<TabbyPrescoreResponse>(
    "/payments/tabby/public/prescore",
    request
  );
