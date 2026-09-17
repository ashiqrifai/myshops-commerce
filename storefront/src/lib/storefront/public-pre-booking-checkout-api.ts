export interface PublicPreBookingCheckoutSession {
  publicToken: string;

  status:
    | "OPEN"
    | "RESERVED"
    | "PAYMENT_PENDING"
    | "COMPLETED"
    | "FAILED"
    | "EXPIRED"
    | "CANCELLED";

  campaign: {
    id: string;
    code: string;
    name: string;
    slug: string;
    paymentPolicy: string;

    paymentMethods: {
      card: boolean;
      tabby: boolean;
      tamara: boolean;
    };
  };

  selection: {
    campaignProductId: string;
    productId: string;
    productVariantId: string;
    bundleId: string | null;
    allocationId: string;
    protectionSchemeId: string | null;
    quantity: number;
    productName: string;
    variantName: string;
    sku: string;
    bundleName: string;
  };

  pricing: {
    productUnitPrice: number;
    bundleAmount: number;
    protectionAmount: number;
    taxAmount: number;
    totalAmount: number;
    currencyCode: string;
  };

  expectedStock: {
    from: string | null;
    until: string | null;
  };

  reservedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface CreatePreBookingCheckoutRequest {
  campaignProductId: string;
  productVariantId: string;
  allocationId: string;
  bundleId?: string | null;
  quantity: number;
  channel?: "WEBSITE" | "KIOSK";
}

export interface CreatePreBookingCheckoutResponse {
  session:
    PublicPreBookingCheckoutSession;

  allocation: {
    id: string;
    availableQuantity: number;
  };
}

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

const getApiUrl = () => {
  if (
    typeof window ===
    "undefined"
  ) {
    return (
      process.env.API_URL ||
      process.env
        .NEXT_PUBLIC_API_URL ||
      "http://localhost:5080/api/v1"
    ).replace(
      /\/$/,
      ""
    );
  }

  return (
    process.env
      .NEXT_PUBLIC_API_URL ||
    "https://api.vkposme.tech/api/v1"
  ).replace(
    /\/$/,
    ""
  );
};

const getErrorMessage =
  async (
    response:
      Response
  ) => {
    try {
      const payload =
        await response.json();

      return (
        payload?.error
          ?.message ||
        payload?.message ||
        `Request failed. HTTP ${response.status}`
      );
    } catch {
      return `Request failed. HTTP ${response.status}`;
    }
  };

export async function createPreBookingCheckoutSession(
  request:
    CreatePreBookingCheckoutRequest
): Promise<CreatePreBookingCheckoutResponse> {
  const response =
    await fetch(
      `${getApiUrl()}/public/pre-booking/checkout-sessions`,
      {
        method:
          "POST",

        headers: {
          Accept:
            "application/json",

          "Content-Type":
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        body:
          JSON.stringify({
            ...request,

            channel:
              request.channel ||
              "WEBSITE",
          }),

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  const payload =
    await response.json();

  if (
    !payload?.success ||
    !payload?.data?.session
  ) {
    throw new Error(
      "The pre-booking checkout API returned an invalid response."
    );
  }

  return payload.data;
}

export async function getPreBookingCheckoutSession(
  publicToken:
    string
): Promise<PublicPreBookingCheckoutSession> {
  const response =
    await fetch(
      `${getApiUrl()}/public/pre-booking/checkout-sessions/${encodeURIComponent(
        publicToken
      )}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        cache:
          "no-store",
      }
    );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response
      )
    );
  }

  const payload =
    await response.json();

  if (
    !payload?.success ||
    !payload?.data
  ) {
    throw new Error(
      "The pre-booking checkout API returned an invalid response."
    );
  }

  return payload.data;
}
