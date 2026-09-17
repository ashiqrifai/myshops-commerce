const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export type CheckoutDeliveryMethod =
  | "STANDARD"
  | "EXPRESS"
  | "PICKUP";

export type CheckoutPaymentMethod =
  | "COD"
  | "CARD"
  | "TABBY"
  | "TAMARA";

export interface PublicOrderProtectionRequest {
  schemeId:
    string;
}

export interface PublicOrderBundleSelectionRequest {
  bundlePromotionId:
    string;

  selectionQuantity:
    number;
}

export interface PublicOrderRequestItem {
  productId:
    string;

  productVariantId:
    string;

  quantity:
    number;

  protection?:
    | PublicOrderProtectionRequest
    | null;

  bundleSelections?:
    PublicOrderBundleSelectionRequest[];
}

export interface PublicOrderFulfilmentLine {
  cartItemKey:
    string;

  productId:
    string;

  variantId:
    string;

  quantity:
    number;

  fulfilmentMethod:
    | "DELIVERY"
    | "EXPRESS"
    | "PICKUP";

  pickupLocationId?:
    string | null;

  pickupLocationCode?:
    string | null;

  pickupLocationName?:
    string | null;

  pickupLeadTimeMinutes?:
    number | null;
}

export interface PublicOrderRequest {
  currencyCode?:
    string;

  customer: {
    firstName:
      string;

    lastName?:
      string;

    email:
      string;

    phone:
      string;
  };

  shippingAddress: {
    addressLine1:
      string;

    addressLine2?:
      string;

    emirate:
      string;

    city:
      string;

    area:
      string;

    landmark?:
      string;
  };

  deliveryMethod:
    CheckoutDeliveryMethod;

  paymentMethod:
    CheckoutPaymentMethod;

  couponCode?:
    string | null;

  notes?:
    string;

  /*
   * Per-item customer fulfilment choice.
   *
   * This is separate from the top-level deliveryMethod because
   * a single order can contain a mix of:
   *
   * - Express delivery
   * - Standard delivery
   * - Store pickup
   */
  fulfilmentLines?:
    PublicOrderFulfilmentLine[];

  items:
    PublicOrderRequestItem[];
}

export interface PublicOrderResult {
  id:
    string;

  orderNumber:
    string;

  orderStatus:
    string;

  paymentStatus:
    string;

  fulfillmentStatus:
    string;

  paymentMethod:
    CheckoutPaymentMethod;

  deliveryMethod:
    CheckoutDeliveryMethod;

  deliveryPlan?:
    unknown;

  currencyCode:
    string;

  subtotal:
    number;

  taxAmount:
    number;

  discountAmount:
    number;

  deliveryAmount:
    number;

  grandTotal:
    number;

  couponCode:
    string | null;

  couponBenefitAmount?:
    number;

  placedAt:
    string;

  items:
    Array<{
      id?:
        string;

      productId:
        string;

      productVariantId:
        string;

      sku:
        string;

      productName:
        string;

      variantName:
        string;

      quantity:
        number;

      unitPrice:
        number;

      taxAmount:
        number;

      lineTotal:
        number;

      selectedDeliveryMethod?:
        | "STANDARD"
        | "EXPRESS"
        | "PICKUP"
        | null;

      selectedPickupLocationId?:
        string | null;

      protection?:
        | {
            id?:
              string;

            schemeId?:
              string;

            schemeCode?:
              string;

            schemeName?:
              string;

            durationMonths?:
              number | null;

            protectionUnitPrice?:
              number;

            totalAmount?:
              number;

            currencyCode?:
              string;

            assignmentId?:
              string | null;

            code?:
              string;

            name?:
              string;

            schemeType?:
              string;

            pricingMethod?:
              string;

            percentage?:
              number | null;

            unitPrice?:
              number;

            subtotal?:
              number;

            taxAmount?:
              number;

            totalPrice?:
              number;

            pricingSource?:
              string;
          }
        | null;
    }>;
}

interface PublicOrderEnvelope {
  success:
    boolean;

  data?: {
    order:
      PublicOrderResult;
  };

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

export class PublicOrderApiError
  extends Error {
  status:
    number;

  code:
    string | undefined;

  details:
    unknown[];

  constructor({
    message,
    status,
    code,
    details = [],
  }: {
    message:
      string;

    status:
      number;

    code?:
      string;

    details?:
      unknown[];
  }) {
    super(
      message
    );

    this.name =
      "PublicOrderApiError";

    this.status =
      status;

    this.code =
      code;

    this.details =
      details;
  }
}

export async function placePublicOrder({
  input,
  accessToken,
}: {
  input:
    PublicOrderRequest;

  accessToken?:
    string | null;
}): Promise<PublicOrderResult> {
  const headers:
    Record<
      string,
      string
    > = {
    Accept:
      "application/json",

    "Content-Type":
      "application/json",

    "x-company-code":
      COMPANY_CODE,
  };

  /*
   * Logged-in customers send their customer
   * access token so the backend can link the
   * order to customerId.
   *
   * Guest checkout sends no token.
   */
  if (
    accessToken
  ) {
    headers.Authorization =
      `Bearer ${accessToken}`;
  }

  const couponCode =
    input.couponCode
      ? input.couponCode
          .trim()
          .toUpperCase()
      : null;

  /*
   * Preserve each cart item's final customer
   * fulfilment selection.
   *
   * Example:
   *
   * iPad may be eligible for Express delivery,
   * but if the customer selected Store Pickup,
   * fulfilmentMethod remains PICKUP and the
   * selected pickup store is sent to the backend.
   */
  const fulfilmentLines =
    Array.isArray(
      input.fulfilmentLines
    )
      ? input.fulfilmentLines.map(
          (
            line
          ) => ({
            cartItemKey:
              line.cartItemKey,

            productId:
              line.productId,

            variantId:
              line.variantId,

            quantity:
              line.quantity,

            fulfilmentMethod:
              line.fulfilmentMethod,

            pickupLocationId:
              line.fulfilmentMethod ===
                "PICKUP"
                ? (
                    line.pickupLocationId ||
                    null
                  )
                : null,

            pickupLocationCode:
              line.fulfilmentMethod ===
                "PICKUP"
                ? (
                    line.pickupLocationCode ||
                    null
                  )
                : null,

            pickupLocationName:
              line.fulfilmentMethod ===
                "PICKUP"
                ? (
                    line.pickupLocationName ||
                    null
                  )
                : null,

            pickupLeadTimeMinutes:
              line.fulfilmentMethod ===
                "PICKUP"
                ? (
                    line.pickupLeadTimeMinutes ??
                    null
                  )
                : null,
          })
        )
      : [];

  const response =
    await fetch(
      `${API_URL}/public/orders`,
      {
        method:
          "POST",

        headers,

        credentials:
          "include",

        body:
          JSON.stringify({
            companyCode:
              COMPANY_CODE,

            currencyCode:
              input.currencyCode ||
              "AED",

            customer:
              input.customer,

            shippingAddress:
              input.shippingAddress,

            deliveryMethod:
              input.deliveryMethod,

            paymentMethod:
              input.paymentMethod,

            /*
             * Only coupon code is sent.
             * Backend validates and calculates
             * the actual discount again.
             */
            couponCode,

            notes:
              input.notes ||
              "",

            /*
             * IMPORTANT:
             *
             * Per-item fulfilment is sent separately
             * from the top-level deliveryMethod.
             *
             * This prevents Express eligibility from
             * silently replacing a customer's explicit
             * Store Pickup selection.
             */
            fulfilmentLines,

            /*
             * Never trust browser pricing.
             *
             * Product price, tax and totals are
             * resolved again by the backend.
             *
             * Protection only sends the selected
             * schemeId. The backend resolves the
             * actual warranty plan and price again.
             */
            items:
              input.items.map(
                (
                  item
                ) => ({
                  productId:
                    item.productId,

                  productVariantId:
                    item.productVariantId,

                  quantity:
                    item.quantity,

                  protection:
                    item.protection
                      ?.schemeId
                      ? {
                          schemeId:
                            item
                              .protection
                              .schemeId,
                        }
                      : undefined,

                  /*
                   * Bundle selections send identifiers only.
                   *
                   * Never trust bundle price or included-item
                   * details from the browser. The backend
                   * resolves the active promotion again.
                   */
                  bundleSelections:
                    Array.isArray(
                      item.bundleSelections
                    )
                      ? item.bundleSelections.map(
                          (
                            bundle
                          ) => ({
                            bundlePromotionId:
                              bundle
                                .bundlePromotionId,

                            selectionQuantity:
                              bundle
                                .selectionQuantity,
                          })
                        )
                      : [],
                })
              ),
          }),
      }
    );

  let payload:
    PublicOrderEnvelope |
    null =
    null;

  try {
    payload =
      await response.json();
  } catch {
    payload =
      null;
  }

  if (
    !response.ok
  ) {
    throw new PublicOrderApiError({
      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Unable to place order. HTTP ${response.status}.`,

      status:
        response.status,

      code:
        payload
          ?.error
          ?.code,

      details:
        Array.isArray(
          payload
            ?.error
            ?.details
        )
          ? payload
              ?.error
              ?.details ||
            []
          : [],
    });
  }

  if (
    payload
      ?.success !==
      true ||
    !payload
      ?.data
      ?.order
  ) {
    throw new PublicOrderApiError({
      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        "The order could not be created.",

      status:
        response.status,

      code:
        payload
          ?.error
          ?.code,

      details:
        Array.isArray(
          payload
            ?.error
            ?.details
        )
          ? payload
              ?.error
              ?.details ||
            []
          : [],
    });
  }

  return payload
    .data
    .order;
}
