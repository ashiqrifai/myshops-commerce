"use client";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

export interface NetworkInternationalHostedCheckoutResponse {
  success: boolean;

  data: {
    reused: boolean;

    orderId: string;
    orderNumber: string;

    paymentUrl: string;

    gatewayOrderReference:
      | string
      | null;

    gatewayOrderId:
      | string
      | null;

    paymentStatus: string;
    orderStatus: string;
  };
}

export interface NetworkInternationalCompleteResponse {
  success: boolean;

  data: {
    alreadyPaid: boolean;
    gatewayState: string;
    paymentResponse: unknown;

    order: {
      id: string;
      orderNumber: string;
      orderStatus: string;
      paymentStatus: string;
      paymentMethod: string;
      grandTotal: number;
      currencyCode: string;
    };
  };
}

export interface NetworkInternationalReconcileResponse {
  success: boolean;

  data: {
    gatewayState: string;

    order: {
      id: string;
      orderNumber: string;
      orderStatus: string;
      paymentStatus: string;
      paymentMethod: string;
      grandTotal: number;
      currencyCode: string;
    };
  };
}

export class NetworkInternationalApiError extends Error {
  status: number;
  code: string | undefined;
  details: unknown[];

  constructor({
    message,
    status,
    code,
    details = [],
  }: {
    message: string;
    status: number;
    code?: string;
    details?: unknown[];
  }) {
    super(
      message
    );

    this.name =
      "NetworkInternationalApiError";

    this.status =
      status;

    this.code =
      code;

    this.details =
      details;
  }
}

function buildHeaders(
  accessToken?:
    string |
    null
) {
  const headers:
    Record<
      string,
      string
    > = {
    Accept:
      "application/json",

    "Content-Type":
      "application/json",
  };

  if (
    accessToken
  ) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  return headers;
}

async function request<T>({
  path,
  body,
  accessToken,
}: {
  path: string;
  body: unknown;

  accessToken?:
    string |
    null;
}): Promise<T> {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        method:
          "POST",

        headers:
          buildHeaders(
            accessToken
          ),

        credentials:
          "include",

        body:
          JSON.stringify(
            body
          ),
      }
    );

  let payload:
    | {
        success?:
          boolean;

        error?: {
          code?:
            string;

          message?:
            string;

          details?:
            unknown[];
        };

        message?:
          string;
      }
    | undefined;

  try {
    payload =
      await response
        .clone()
        .json();
  } catch {
    payload =
      undefined;
  }

  if (
    !response.ok
  ) {
    throw new NetworkInternationalApiError({
      status:
        response.status,

      code:
        payload
          ?.error
          ?.code,

      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Payment request failed. HTTP ${response.status}`,

      details:
        payload
          ?.error
          ?.details ||
        [],
    });
  }

  return (
    await response.json()
  ) as T;
}

export async function createNetworkInternationalHostedCheckout({
  orderId,
  accessToken,
}: {
  orderId: string;

  accessToken?:
    string |
    null;
}) {
  return request<
    NetworkInternationalHostedCheckoutResponse
  >({
    path:
      "/payments/network-international/public/hosted-checkout",

    body: {
      orderId,
    },

    accessToken,
  });
}

/*
 * Legacy embedded Hosted Sessions API.
 * Safe to remove after migration is fully complete.
 */
export async function completeNetworkInternationalPayment({
  orderId,
  sessionId,
  accessToken,
}: {
  orderId: string;
  sessionId: string;

  accessToken?:
    string |
    null;
}) {
  return request<
    NetworkInternationalCompleteResponse
  >({
    path:
      "/payments/network-international/public/complete",

    body: {
      orderId,
      sessionId,
    },

    accessToken,
  });
}

export async function reconcileNetworkInternationalPayment({
  orderId,
  accessToken,
}: {
  orderId: string;

  accessToken?:
    string |
    null;
}) {
  return request<
    NetworkInternationalReconcileResponse
  >({
    path:
      "/payments/network-international/public/reconcile",

    body: {
      orderId,
    },

    accessToken,
  });
}
