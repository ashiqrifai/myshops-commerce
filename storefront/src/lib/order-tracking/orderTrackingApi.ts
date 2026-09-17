const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export interface TrackingTimelineStep {
  code:
    string;

  label:
    string;

  completed:
    boolean;

  current?:
    boolean;
}

export interface TrackedOrderItem {
  id:
    string;

  sku:
    string;

  productName:
    string;

  variantName?:
    string | null;

  quantity:
    number;

  unitPrice:
    number;

  lineTotal:
    number;

  fulfillmentMethod:
    string;

  fulfillmentLabel:
    string;

  fulfillmentLocation?:
    string | null;

  shipmentNumber?:
    string | null;

  shipmentStatus:
    string;

  timeline:
    TrackingTimelineStep[];
}

export interface TrackedOrder {
  id:
    string;

  orderNumber:
    string;

  placedAt:
    string;

  currencyCode:
    string;

  paymentMethod:
    string;

  paymentStatus:
    string;

  orderStatus:
    string;

  fulfillmentStatus:
    string;

  subtotal:
    number;

  discountAmount:
    number;

  deliveryAmount:
    number;

  taxAmount:
    number;

  grandTotal:
    number;

  items:
    TrackedOrderItem[];
}

const request =
  async <T>(
    path:
      string,
    options:
      RequestInit
  ): Promise<T> => {
    const response =
      await fetch(
        `${API_URL}${path}`,
        options
      );

    const payload =
      await response.json();

    if (
      !response.ok ||
      payload
        ?.success ===
        false
    ) {
      throw new Error(
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        "Unable to process request."
      );
    }

    return payload
      .data as T;
  };

export const requestOrderTrackingOtp =
  async ({
    orderNumber,
    email,
  }: {
    orderNumber:
      string;

    email:
      string;
  }) =>
    request<{
      accepted:
        boolean;

      message:
        string;
    }>(
      "/public/order-tracking/request-otp",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        body:
          JSON.stringify({
            companyCode:
              COMPANY_CODE,

            orderNumber,
            email,
          }),
      }
    );

export const verifyOrderTrackingOtp =
  async ({
    orderNumber,
    email,
    otp,
  }: {
    orderNumber:
      string;

    email:
      string;

    otp:
      string;
  }) =>
    request<{
      verified:
        boolean;

      accessToken:
        string;

      expiresInMinutes:
        number;

      orderNumber:
        string;
    }>(
      "/public/order-tracking/verify-otp",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        body:
          JSON.stringify({
            companyCode:
              COMPANY_CODE,

            orderNumber,
            email,
            otp,
          }),
      }
    );

export const getTrackedOrder =
  async ({
    orderNumber,
    accessToken,
  }: {
    orderNumber:
      string;

    accessToken:
      string;
  }) =>
    request<TrackedOrder>(
      `/public/order-tracking/${encodeURIComponent(
        orderNumber
      )}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,

          "x-company-code":
            COMPANY_CODE,
        },
      }
    );
