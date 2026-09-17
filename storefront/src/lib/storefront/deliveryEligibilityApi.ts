const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export interface ExpressPool {
  eligible: boolean;
  hours: number;
  availableQuantity: number;
  locations?: Record<string, number>;
}

export interface DeliveryEligibilityItem {
  productVariantId: string | null;
  sku?: string;
  productName?: string;
  quantity: number;
  directDelivery?: boolean;
  dubaiSharjah: ExpressPool;
  abuDhabi: ExpressPool;
  reason?: string | null;
}

interface DeliveryEligibilityEnvelope {
  success: boolean;
  data?: { items: DeliveryEligibilityItem[] };
  error?: { code?: string; message?: string };
  message?: string;
}

interface PendingRequest {
  productVariantId: string;
  quantity: number;
  resolve: (value: DeliveryEligibilityItem | null) => void;
  reject: (reason?: unknown) => void;
}

const CACHE_TTL_MS = 30000;
const cache = new Map<string, { expiresAt: number; value: DeliveryEligibilityItem | null }>();
const cacheKey = (productVariantId: string, quantity: number) =>
  `${productVariantId}:${quantity}`;

let queue: PendingRequest[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const flush = async () => {
  const batch = queue;
  queue = [];
  flushTimer = null;

  if (!batch.length) return;

  const unique = new Map<string, { productVariantId: string; quantity: number }>();

  for (const request of batch) {
    unique.set(
      cacheKey(request.productVariantId, request.quantity),
      {
        productVariantId: request.productVariantId,
        quantity: request.quantity,
      }
    );
  }

  try {
    const response = await fetch(
      `${API_URL}/public/checkout/eligibility`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-company-code": COMPANY_CODE,
        },
        credentials: "include",
        body: JSON.stringify({
          companyCode: COMPANY_CODE,
          items: [...unique.values()],
        }),
      }
    );

    let payload: DeliveryEligibilityEnvelope | undefined;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    if (!response.ok || !payload?.success || !payload.data) {
      throw new Error(
        payload?.error?.message ||
        payload?.message ||
        `Unable to check delivery eligibility. HTTP ${response.status}`
      );
    }

    const responseMap = new Map<string, DeliveryEligibilityItem>();
    for (const item of payload.data.items) {
      if (!item.productVariantId) continue;
      responseMap.set(
        cacheKey(item.productVariantId, Number(item.quantity || 1)),
        item
      );
    }

    const now = Date.now();
    for (const request of batch) {
      const key = cacheKey(request.productVariantId, request.quantity);
      const item = responseMap.get(key) || null;
      cache.set(key, {
        expiresAt: now + CACHE_TTL_MS,
        value: item,
      });
      request.resolve(item);
    }
  } catch (error) {
    for (const request of batch) request.reject(error);
  }
};

export const requestDeliveryEligibility = ({
  productVariantId,
  quantity = 1,
}: {
  productVariantId: string;
  quantity?: number;
}) => {
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const key = cacheKey(productVariantId, normalizedQuantity);
  const cached = cache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.value);
  }

  return new Promise<DeliveryEligibilityItem | null>((resolve, reject) => {
    queue.push({
      productVariantId,
      quantity: normalizedQuantity,
      resolve,
      reject,
    });

    if (!flushTimer) {
      flushTimer = setTimeout(() => {
        void flush();
      }, 10);
    }
  });
};

export const clearDeliveryEligibilityCache = () => {
  cache.clear();
};
