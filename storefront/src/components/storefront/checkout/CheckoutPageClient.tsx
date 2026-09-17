"use client";

import {
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearCart,
  selectAppliedCoupon,
  selectCartHydrated,
  selectCartItems,
  selectCartSubtotal,
  selectCartTax,
  selectCartTotal,
} from "@/store/slices/cartSlice";

import {
  selectCustomer,
  selectCustomerAccessToken,
  selectCustomerAuthenticated,
} from "@/store/slices/customerAuthSlice";

import {
  placePublicOrder,
} from "@/lib/customer-orders/publicOrderApi";

import CouponSection from "./CouponSection";

import CheckoutAiAssistant from "./CheckoutAiAssistant";

import NetworkInternationalCard from "./NetworkInternationalCard";
import TabbyCard from "../tabby/TabbyCard";

import {
  createNetworkInternationalHostedCheckout,
} from "@/lib/payments/networkInternationalApi";

import {
  checkTamaraEligibility,
  createTamaraCheckout,
} from "@/lib/payments/tamaraApi";

import {
  checkTabbyPrescore,
  createTabbyCheckout,
} from "@/lib/payments/tabbyApi";



import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";


const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

type DeliveryMethod =
  | "STANDARD"
  | "EXPRESS"
  | "PICKUP";

type PaymentMethod =
  | "CARD"
  | "TABBY"
  | "TAMARA";

interface CheckoutForm {
  firstName:
    string;

  lastName:
    string;

  email:
    string;

  phone:
    string;

  addressLine1:
    string;

  addressLine2:
    string;

  emirate:
    string;

  city:
    string;

  area:
    string;

  landmark:
    string;

  deliveryMethod:
    DeliveryMethod;

  paymentMethod:
    PaymentMethod;

  notes:
    string;
}

const initialForm:
  CheckoutForm = {
  firstName:
    "",

  lastName:
    "",

  email:
    "",

  phone:
    "",

  addressLine1:
    "",

  addressLine2:
    "",

  emirate:
    "Dubai",

  city:
    "",

  area:
    "",

  landmark:
    "",

  deliveryMethod:
    "STANDARD",

  paymentMethod:
    "CARD",

  notes:
    "",
};

/*
|--------------------------------------------------------------------------
| Delivery Plan Types
|--------------------------------------------------------------------------
*/

interface CheckoutDeliveryAllocation {
  productVariantId: string;
  sku?: string;
  quantity: number;
  inventoryLocationId?: string;
  inventoryLocationCode?: string;
  inventoryLocationName?: string;
}

interface CheckoutDeliveryShipment {
  shipmentKey: string;
  deliveryZoneId?: string | null;
  deliveryZoneCode: string;
  deliveryLabel: string;
  deliveryMethod: "STANDARD" | "EXPRESS";
  deliveryHours: number | null;
  deliveryMinDays: number | null;
  deliveryMaxDays: number | null;
  deliveryAmount: number;
  allocations: CheckoutDeliveryAllocation[];
  totalQuantity: number;
}

interface CheckoutDirectDeliveryItem {
  productVariantId?: string;
  sku?: string;
  quantity?: number;
  [key: string]: unknown;
}

interface CheckoutAlwaysAvailableItem {
  productVariantId: string;
  sku?: string;
  productName?: string;
  quantity: number;

  fulfillmentType:
    "ALWAYS_AVAILABLE";

  deliveryMethod:
    "STANDARD";
}

interface CheckoutDeliveryPlan {
  cityCode: string;
  splitShipment: boolean;
  fullyFulfillable: boolean;
  shipments:
  CheckoutDeliveryShipment[];

directDeliveryItems:
  CheckoutDirectDeliveryItem[];

alwaysAvailableItems?:
  CheckoutAlwaysAvailableItem[];

unfulfilled: Array<{
    productVariantId?: string;
    sku?: string;
    quantity?: number;
    [key: string]: unknown;
  }>;
}

interface CheckoutDeliveryPlanResponse {
  success: boolean;
  data?: CheckoutDeliveryPlan;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
}

const getDeliveryCityCode = (
  emirate: string
) => {
  const normalized =
    String(emirate || "")
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  if (normalized === "ABUDHABI") {
    return "ABU_DHABI";
  }

  return normalized;
};

const buildPaymentOptions = (
  tamaraEligible: boolean,
  tamaraChecking: boolean,
  tabbyEligible: boolean,
  tabbyChecking: boolean,
  tabbyMessage: string | null
) => [
  {
    code:
      "CARD" as const,

    title:
      "Credit or debit card",

    description:
      "Secure online card payment powered by Network International",

    enabled:
      true,
  },

  {
    code:
      "TABBY" as const,

    title:
      "Pay Later with Tabby",

    description:
      tabbyChecking
        ? "Checking Tabby availability…"
        : tabbyEligible
          ? "Select Tabby to view your payment schedule"
          : tabbyMessage ||
            "Enter your email and mobile number to check Tabby availability.",

    enabled:
      tabbyEligible &&
      !tabbyChecking,
  },

  {
    code:
      "TAMARA" as const,

    title:
      "Tamara",

    logo:
      "https://api.vkposme.tech/media/eba8444b-69bb-4d13-84cb-1c0a63313075/170ada59-37e2-4e22-8a49-1c4058ef8a80/original/tamara-logos-01-70a271e789b6282d.png",

    description:
      tamaraChecking
        ? "Checking Tamara eligibility…"
        : tamaraEligible
          ? "Split your payment with Tamara"
          : "Tamara is not available for this checkout",

    enabled:
      tamaraEligible &&
      !tamaraChecking,
  },
].filter(
  (option): boolean => {
    const hiddenPaymentCodes: string[] = [
      "TABBY",
      "TAMARA",
    ];

    return !hiddenPaymentCodes.includes(
      String(option.code)
    );
  }
);



export default function CheckoutPageClient() {
  const router =
    useRouter();

  const dispatch =
    useAppDispatch();

 const [
    tamaraEligible,
    setTamaraEligible,
  ] =
    useState(
      false
    );

  const [
    tamaraChecking,
    setTamaraChecking,
  ] =
    useState(
      false
    );

  const [
    tabbyEligible,
    setTabbyEligible,
  ] =
    useState(
      false
    );

  const [
    tabbyChecking,
    setTabbyChecking,
  ] =
    useState(
      false
    );

  const [
    tabbyMessage,
    setTabbyMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const hydrated =
    useAppSelector(
      selectCartHydrated
    );

  const items =
    useAppSelector(
      selectCartItems
    );

  const deliveryCartItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            (item.fulfilmentMethod ||
              "DELIVERY") !==
            "PICKUP"
        ),
      [items]
    );

  const pickupCartItems =
    useMemo(
      () =>
        items.filter(
          (item) =>
            (item.fulfilmentMethod ||
              "DELIVERY") ===
            "PICKUP"
        ),
      [items]
    );

  const hasDeliveryItems =
    deliveryCartItems.length > 0;

  const pickupSelectionComplete =
    items.every(
      (
        item
      ) =>
        item.fulfilmentMethod !==
          "PICKUP" ||
        Boolean(
          item.pickupLocationId
        )
    );

  const fulfilmentLines =
    items.map(
      (
        item
      ) => ({
        cartItemKey:
          item.key,

        productId:
          item.productId,

        variantId:
          item.variantId,

        quantity:
          item.quantity,

        fulfilmentMethod:
          item.fulfilmentMethod ||
          "DELIVERY",

        pickupLocationId:
          item.pickupLocationId ||
          null,

        pickupLocationCode:
          item.pickupLocationCode ||
          null,

        pickupLocationName:
          item.pickupLocationName ||
          null,

        pickupLeadTimeMinutes:
          item.pickupLeadTimeMinutes ??
          null,
      })
    );


  const subtotal =
    useAppSelector(
      selectCartSubtotal
    );

  const tax =
    useAppSelector(
      selectCartTax
    );

  const cartTotal =
    useAppSelector(
      selectCartTotal
    );

  const customer =
    useAppSelector(
      selectCustomer
    );

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const authenticated =
    useAppSelector(
      selectCustomerAuthenticated
    );

  const [
    form,
    setForm,
  ] =
    useState<CheckoutForm>(
      initialForm
    );

  const [
    deliveryPlan,
    setDeliveryPlan,
  ] =
    useState<
      CheckoutDeliveryPlan |
      null
    >(null);

  const [
    deliveryPlanLoading,
    setDeliveryPlanLoading,
  ] =
    useState(false);

  const [
    deliveryPlanError,
    setDeliveryPlanError,
  ] =
    useState<
      string | null
    >(null);

  const [
    errors,
    setErrors,
  ] =
    useState<
      Record<
        string,
        string
      >
    >({});

  const [
    submitMessage,
    setSubmitMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    submitError,
    setSubmitError,
  ] =
    useState(
      false
    );

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(
      false
    );

  const [
    orderCompleted,
    setOrderCompleted,
  ] =
    useState(
      false
    );

  const appliedCoupon =
    useAppSelector(
      selectAppliedCoupon
    );

  /*
   * Prefill checkout contact information
   * when the customer is signed in.
   */
  useEffect(
    () => {
      if (
        !customer
      ) {
        return;
      }

      setForm(
        (
          current
        ) => ({
          ...current,

          firstName:
            current.firstName ||
            customer.firstName ||
            "",

          lastName:
            current.lastName ||
            customer.lastName ||
            "",

          email:
            current.email ||
            customer.email ||
            "",

          phone:
            current.phone ||
            customer.mobile ||
            "",
        })
      );
    },
    [
      customer,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Automatic Delivery Planning
  |--------------------------------------------------------------------------
  |
  | Customers do not choose STANDARD vs EXPRESS.
  | The backend selects the fastest valid shipment plan from current stock.
  |
  | Dubai / Sharjah -> 2-hour express where eligible.
  | Abu Dhabi        -> 1-hour express where eligible.
  | Remaining stock  -> standard delivery.
  |
  | Express delivery is free.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!hydrated) {
        return;
      }

      if (!hasDeliveryItems) {
        setDeliveryPlan(null);
        setDeliveryPlanError(null);
        setDeliveryPlanLoading(false);

        setForm((current) =>
          current.deliveryMethod ===
          "PICKUP"
            ? current
            : {
                ...current,
                deliveryMethod:
                  "PICKUP",
              }
        );

        return;
      }

      const cityCode =
        getDeliveryCityCode(
          form.emirate
        );

      if (!cityCode) {
        setDeliveryPlan(null);
        setDeliveryPlanError(
          "Select an emirate to calculate delivery."
        );
        setDeliveryPlanLoading(false);
        return;
      }

      const controller =
        new AbortController();

      const timer =
        window.setTimeout(
          async () => {
            setDeliveryPlanLoading(
              true
            );
            setDeliveryPlanError(
              null
            );

            try {
              const response =
                await fetch(
                  `${API_URL}/public/checkout/delivery-plan`,
                  {
                    method: "POST",
                    headers: {
                      Accept:
                        "application/json",
                      "Content-Type":
                        "application/json",
                      "x-company-code":
                        COMPANY_CODE,
                    },
                    credentials:
                      "include",
                    signal:
                      controller.signal,
                    body:
                      JSON.stringify({
                        companyCode:
                          COMPANY_CODE,
                        cityCode,
                        items:
                          deliveryCartItems.map(
                            (item) => ({
                              productVariantId:
                                item.variantId,
                              quantity:
                                item.quantity,
                            })
                          ),
                      }),
                  }
                );

              let payload:
                | CheckoutDeliveryPlanResponse
                | undefined;

              try {
                payload =
                  (await response.json()) as
                    CheckoutDeliveryPlanResponse;
              } catch {
                payload =
                  undefined;
              }

              if (
                !response.ok ||
                !payload?.success ||
                !payload.data
              ) {
                throw new Error(
                  payload?.error
                    ?.message ||
                    payload?.message ||
                    "Unable to calculate the delivery plan."
                );
              }

              if (
                controller.signal.aborted
              ) {
                return;
              }

              const plan =
                payload.data;

              setDeliveryPlan(plan);

              const hasExpress =
                plan.shipments.some(
                  (shipment) =>
                    shipment.deliveryMethod ===
                    "EXPRESS"
                );

              setForm((current) => {
                const nextMethod:
                  DeliveryMethod =
                    hasExpress
                      ? "EXPRESS"
                      : "STANDARD";

                return current.deliveryMethod ===
                  nextMethod
                  ? current
                  : {
                      ...current,
                      deliveryMethod:
                        nextMethod,
                    };
              });
            } catch (error) {
              if (
                controller.signal.aborted
              ) {
                return;
              }

              console.error(
                "Unable to calculate delivery plan:",
                error
              );

              setDeliveryPlan(null);
              setDeliveryPlanError(
                error instanceof Error
                  ? error.message
                  : "Unable to calculate the delivery plan."
              );

              setForm((current) =>
                current.deliveryMethod ===
                "STANDARD"
                  ? current
                  : {
                      ...current,
                      deliveryMethod:
                        "STANDARD",
                    }
              );
            } finally {
              if (
                !controller.signal.aborted
              ) {
                setDeliveryPlanLoading(
                  false
                );
              }
            }
          },
          250
        );

      return () => {
        window.clearTimeout(
          timer
        );
        controller.abort();
      };
    },
    [
      hydrated,
      hasDeliveryItems,
      form.emirate,
      deliveryCartItems,
    ]
  );

  const currencyCode =
    items[0]
      ?.currencyCode ||
    customer
      ?.preferredCurrency ||
    "AED";

  const baseDeliveryAmount =
    useMemo(
      () =>
        (deliveryPlan
          ?.shipments ||
          []
        ).reduce(
          (total, shipment) => {
            /*
             * MyExpressDelivery is free.
             * Keep non-express backend fees future-proof.
             */
            if (
              shipment.deliveryMethod ===
              "EXPRESS"
            ) {
              return total;
            }

            return (
              total +
              Number(
                shipment.deliveryAmount ||
                  0
              )
            );
          },
          0
        ),
      [deliveryPlan]
    );

  /*
   * Coupon amounts below come from the real backend
   * coupon validation API and are stored in Redux.
   *
   * The backend validates the coupon again during
   * final order creation, so these values are only
   * used to keep the checkout display in sync.
   */
  const discountAmount =
    appliedCoupon
      ?.merchandiseDiscount ||
    0;

  const deliveryAmount =
    appliedCoupon
      ? appliedCoupon
          .finalDeliveryAmount
      : baseDeliveryAmount;

  const grandTotal =
    Math.max(
      0,

      cartTotal +
        deliveryAmount -
        discountAmount
    );

  const paymentOptions =
    useMemo(
      () =>
        buildPaymentOptions(
          tamaraEligible,
          tamaraChecking,
          tabbyEligible,
          tabbyChecking,
          tabbyMessage
        ),
      [
        tamaraEligible,
        tamaraChecking,
        tabbyEligible,
        tabbyChecking,
        tabbyMessage,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Tabby Background Pre-scoring
  |--------------------------------------------------------------------------
  |
  | Runs without creating a MyShops order.
  | Debounced while the customer enters contact/address details.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const email =
        form.email
          .trim();

      const phone =
        form.phone
          .trim();

      if (
        !hydrated ||
        grandTotal <= 0 ||
        !email ||
        phone
          .replace(
            /\D/g,
            ""
          )
          .length <
          9
      ) {
        setTabbyEligible(
          false
        );

        setTabbyChecking(
          false
        );

        setTabbyMessage(
          "Enter your email and mobile number to check Tabby availability."
        );

        return;
      }

      let cancelled =
        false;

      const timer =
        window.setTimeout(
          async () => {
            setTabbyChecking(
              true
            );

            try {
              const result =
                await checkTabbyPrescore(
                  {
                    amount:
                      grandTotal,

                    currency:
                      currencyCode,

                    firstName:
                      form.firstName
                        .trim(),

                    lastName:
                      form.lastName
                        .trim(),

                    email,

                    phone,

                    city:
                      form.city
                        .trim() ||
                      form.emirate
                        .trim() ||
                      "Dubai",

                    address:
                      [
                        form.addressLine1
                          .trim(),
                        form.addressLine2
                          .trim(),
                        form.area
                          .trim(),
                        form.emirate
                          .trim(),
                      ]
                        .filter(
                          Boolean
                        )
                        .join(
                          ", "
                        ) ||
                      "United Arab Emirates",

                    lang:
                      "en",

                    items: [
                      {
                        id:
                          "checkout-prescore",

                        title:
                          "MyShops checkout",

                        quantity:
                          1,

                        unitPrice:
                          grandTotal,

                        referenceId:
                          "checkout-prescore",

                        description:
                          "MyShops checkout",

                        category:
                          "Electronics",

                        discountAmount:
                          0,
                      },
                    ],

                  }
                );

              if (
                cancelled
              ) {
                return;
              }

              const eligible =
                result.eligible ===
                true;

              setTabbyEligible(
                eligible
              );

              setTabbyMessage(
                eligible
                  ? null
                  : result.message ||
                    "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order."
              );

              /*
               * If Tabby was selected and a subsequent
               * background pre-score rejects the checkout,
               * move the customer back to CARD.
               */
              if (
                !eligible
              ) {
                setForm(
                  (
                    current
                  ) =>
                    current
                      .paymentMethod ===
                    "TABBY"
                      ? {
                          ...current,
                          paymentMethod:
                            "CARD",
                        }
                      : current
                );
              }
            } catch (
              error
            ) {
              console.error(
                "Tabby background pre-scoring failed:",
                error
              );

              if (
                !cancelled
              ) {
                setTabbyEligible(
                  false
                );

                setTabbyMessage(
                  "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order."
                );

                setForm(
                  (
                    current
                  ) =>
                    current
                      .paymentMethod ===
                    "TABBY"
                      ? {
                          ...current,
                          paymentMethod:
                            "CARD",
                        }
                      : current
                );
              }
            } finally {
              if (
                !cancelled
              ) {
                setTabbyChecking(
                  false
                );
              }
            }
          },
          450
        );

      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timer
        );
      };
    },
    [
      hydrated,
      grandTotal,
      currencyCode,
      form.firstName,
      form.lastName,
      form.email,
      form.phone,
      form.addressLine1,
      form.addressLine2,
      form.area,
      form.city,
      form.emirate,
      items,
    ]
  );

    useEffect(
      () => {
        if (
          !hydrated ||
          grandTotal <= 0
        ) {
          setTamaraEligible(
            false
          );
    
          setTamaraChecking(
            false
          );
    
          return;
        }
    
        let cancelled =
          false;
    
        const timer =
          window.setTimeout(
            async () => {
              setTamaraChecking(
                true
              );
    
              try {
                /*
                 * Initial pre-check:
                 * amount/currency/country are enough.
                 *
                 * If phone is empty, we simply omit it.
                 */
                const result =
                  await checkTamaraEligibility(
                    {
                      amount:
                        grandTotal,
    
                      currency:
                        currencyCode,
    
                      countryCode:
                        "AE",
    
                      phoneNumber:
                        form.phone
                          .trim() ||
                        undefined,
                    }
                  );
    
                if (cancelled) {
                  return;
                }
    
                const eligible =
                  result.eligible ===
                  true;
    
                setTamaraEligible(
                  eligible
                );
    
                /*
                 * If Tamara had been selected and
                 * a later phone-based re-check says
                 * no, move the customer back to COD.
                 */
                if (!eligible) {
                  setForm(
                    (
                      current
                    ) =>
                      current
                        .paymentMethod ===
                      "TAMARA"
                        ? {
                            ...current,
                            paymentMethod:
                              "CARD",
                          }
                        : current
                  );
                }
              } catch (error) {
                console.error(
                  "Tamara eligibility check failed:",
                  error
                );
    
                if (!cancelled) {
                  setTamaraEligible(
                    false
                  );
    
                  setForm(
                    (
                      current
                    ) =>
                      current
                        .paymentMethod ===
                      "TAMARA"
                        ? {
                            ...current,
                            paymentMethod:
                              "CARD",
                          }
                        : current
                  );
                }
              } finally {
                if (!cancelled) {
                  setTamaraChecking(
                    false
                  );
                }
              }
            },
            350
          );
    
        return () =>

      {!pickupSelectionComplete ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">
            Please return to your cart and select a pickup store for every store-pickup item.
          </p>
        </div>
      ) : null}
 {
          cancelled =
            true;
    
          window.clearTimeout(
            timer
          );
        };
      },
      [
        hydrated,
        grandTotal,
        currencyCode,
        form.phone,
      ]
    );

  const update = <
    K extends keyof CheckoutForm,
  >(
    key:
      K,

    value:
      CheckoutForm[K]
  ) => {
    setForm(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );

    setErrors(
      (
        current
      ) => ({
        ...current,

        [key]:
          "",
      })
    );

    setSubmitMessage(
      null
    );

    setSubmitError(
      false
    );
  };

  const validate =
    () => {
      const nextErrors:
        Record<
          string,
          string
        > = {};

      if (
        !form.firstName
          .trim()
      ) {
        nextErrors.firstName =
          "First name is required.";
      }

      if (
        !form.lastName
          .trim()
      ) {
        nextErrors.lastName =
          "Last name is required.";
      }

      if (
        !form.email
          .trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email
        )
      ) {
        nextErrors.email =
          "Enter a valid email address.";
      }

      if (
        !form.phone
          .trim() ||
        form.phone
          .replace(
            /\D/g,
            ""
          )
          .length <
          9
      ) {
        nextErrors.phone =
          "Enter a valid mobile number.";
      }

      if (
        hasDeliveryItems &&
        !form.addressLine1
          .trim()
      ) {
        nextErrors.addressLine1 =
          "Delivery address is required.";
      }

      if (
        hasDeliveryItems &&
        !form.emirate
          .trim()
      ) {
        nextErrors.emirate =
          "Emirate is required.";
      }

      if (
        hasDeliveryItems &&
        !form.city
          .trim()
      ) {
        nextErrors.city =
          "City is required.";
      }

      if (
        hasDeliveryItems &&
        !form.area
          .trim()
      ) {
        nextErrors.area =
          "Area is required.";
      }

      setErrors(
        nextErrors
      );

      return (
        Object.keys(
          nextErrors
        ).length ===
        0
      );
    };

    const submitOrder =
    async () => {
      /*
       * Prevent double-click / duplicate submission.
       */
      if (
        isSubmitting
      ) {
        return;
      }
  
      setSubmitMessage(
        null
      );
  
      setSubmitError(
        false
      );
  
      /*
       * ========================================================
       * STEP 1
       * LOCAL CHECKOUT VALIDATION
       * ========================================================
       *
       * Absolutely nothing payment-related happens before
       * this validation succeeds.
       */
      if (
        !validate()
      ) {
        window.scrollTo({
          top:
            0,
  
          behavior:
            "smooth",
        });
  
        return;
      }
  
      if (
        hasDeliveryItems
      ) {
        if (
          deliveryPlanLoading
        ) {
          setSubmitError(true);
          setSubmitMessage(
            "Please wait while we confirm the fastest delivery option for your order."
          );
          return;
        }

        if (
          !deliveryPlan
        ) {
          setSubmitError(true);
          setSubmitMessage(
            deliveryPlanError ||
              "Unable to confirm delivery availability. Please review your delivery address and try again."
          );
          return;
        }

        if (
          !deliveryPlan.fullyFulfillable
        ) {
          setSubmitError(true);
          setSubmitMessage(
            "One or more items are no longer available in the required quantity. Please review your cart."
          );
          return;
        }
      }

      /*
       * ========================================================
       * STEP 2
       * PAYMENT METHOD VALIDATION
       * ========================================================
       */
  
      if (
        ![
          "COD",
          "CARD",
          "TABBY",
          "TAMARA",
        ].includes(
          form.paymentMethod
        )
      ) {
        setSubmitError(
          true
        );
  
        setSubmitMessage(
          "The selected payment method is not available yet."
        );
  
        return;
      }
  
      if (
        form.paymentMethod ===
          "TABBY"
      ) {
        if (
          tabbyChecking ||
          !tabbyEligible
        ) {
          setSubmitError(
            true
          );

          setSubmitMessage(
            tabbyChecking
              ? "Please wait while Tabby availability is checked."
              : tabbyMessage ||
                "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order."
          );

          return;
        }
      }

      if (
        form.paymentMethod ===
          "TAMARA"
      ) {
        if (
          tamaraChecking ||
          !tamaraEligible
        ) {
          setSubmitError(
            true
          );

          setSubmitMessage(
            tamaraChecking
              ? "Please wait while Tamara availability is checked."
              : "Tamara is not available for this checkout."
          );

          return;
        }

        try {
          const eligibility =
            await checkTamaraEligibility(
              {
                amount:
                  grandTotal,

                currency:
                  currencyCode,

                countryCode:
                  "AE",

                phoneNumber:
                  form.phone
                    .trim() ||
                  undefined,
              }
            );

          if (
            eligibility.eligible !==
            true
          ) {
            setTamaraEligible(
              false
            );

            setSubmitError(
              true
            );

            setSubmitMessage(
              "Tamara is not available for this checkout. Please choose another payment method."
            );

            return;
          }
        } catch (error) {
          console.error(
            "Tamara final eligibility check failed:",
            error
          );

          setTamaraEligible(
            false
          );

          setSubmitError(
            true
          );

          setSubmitMessage(
            "Tamara is currently unavailable. Please choose another payment method."
          );

          return;
        }
      }

      try {
        /*
         * ======================================================
         * STEP 3
         * BEGIN CHECKOUT VALIDATION / ORDER CREATION
         * ======================================================
         */
  
        setIsSubmitting(
          true
        );
  
        /*
         * IMPORTANT:
         *
         * Do NOT generate a Network International
         * session yet.
         *
         * placePublicOrder() must succeed FIRST.
         *
         * The backend will validate:
         *
         * - coupon
         * - coupon usage limit
         * - product availability
         * - product prices
         * - delivery
         * - customer/order rules
         * - etc.
         *
         * If ANY of those fail, this throws and we
         * go directly to catch().
         *
         * Therefore no payment attempt has happened.
         */
  
        const order =
          await placePublicOrder({
            accessToken:
              authenticated
                ? accessToken
                : null,
  
            input: {
              currencyCode,
  
              customer: {
                firstName:
                  form.firstName
                    .trim(),
  
                lastName:
                  form.lastName
                    .trim(),
  
                email:
                  form.email
                    .trim(),
  
                phone:
                  form.phone
                    .trim(),
              },
  
              shippingAddress: {
                addressLine1:
                  form.addressLine1
                    .trim(),
  
                addressLine2:
                  form.addressLine2
                    .trim(),
  
                emirate:
                  form.emirate
                    .trim(),
  
                city:
                  form.city
                    .trim(),
  
                area:
                  form.area
                    .trim(),
  
                landmark:
                  form.landmark
                    .trim(),
              },
  
              deliveryMethod:
                form.deliveryMethod,
  
              paymentMethod:
                form.paymentMethod,
  
              couponCode:
                appliedCoupon
                  ?.code ||
                null,
  
           
              
              notes:
                form.notes
                  .trim(),
              
              fulfilmentLines,
  
              /*
               * Never trust prices from the browser.
               *
               * Backend resolves ProductVariantPrice
               * again from the database.
               */
              items:
                items.map(
                  (
                    item
                  ) => ({
                    productId:
                      item.productId,
  
                    productVariantId:
                      item.variantId,
  
                    quantity:
                      item.quantity,
  
                    protection:
                      item.extendedWarranty
                        ? {
                            schemeId:
                              item.extendedWarranty
                                .schemeId,
                          }
                        : undefined,

                    bundleSelections:
                      (
                        item.bundleSelections ||
                        []
                      ).map(
                        (bundle) => ({
                          bundlePromotionId:
                            bundle.bundlePromotionId,

                          selectionQuantity:
                            bundle.selectionQuantity,
                        })
                      ),
                  })
                ),
            },
          });
  
        /*
         * ======================================================
         * IMPORTANT PAYMENT BOUNDARY
         * ======================================================
         *
         * If execution reaches HERE:
         *
         * ✓ Local validation passed
         * ✓ Backend validation passed
         * ✓ Coupon validation passed
         * ✓ Order creation succeeded
         *
         * Only NOW are we allowed to start
         * external payment processing:
         *
         * CARD   -> Network International
         * TAMARA -> Tamara checkout
         */

        if (
          form.paymentMethod ===
          "CARD"
        ) {
          /*
           * ====================================================
           * STEP 4
           * CREATE NETWORK INTERNATIONAL HOSTED CHECKOUT
           * ====================================================
           *
           * The MyShops order already exists and has passed
           * backend validation. The backend now creates the
           * authoritative Network International payment order
           * using orders.grandTotal.
           */

          const payment =
            await createNetworkInternationalHostedCheckout({
              orderId:
                order.id,

              accessToken:
                authenticated
                  ? accessToken
                  : null,
            });

          const paymentUrl =
            payment.data
              ?.paymentUrl;

          if (
            !paymentUrl
          ) {
            throw new Error(
              "Network International did not return a secure payment URL."
            );
          }

          /*
           * Do not clear the cart yet.
           *
           * The Network International return page must reconcile
           * the payment first and clear the cart only after the
           * backend confirms PAID/AUTHORIZED.
           */
          try {
            window.localStorage.setItem(
              "myshops_pending_network_order_id",
              order.id
            );
          } catch (
            storageError
          ) {
            console.warn(
              "Unable to store pending Network International order id:",
              storageError
            );
          }

          window.location.assign(
            paymentUrl
          );

          return;
        }

        if (
          form.paymentMethod ===
          "TABBY"
        ) {
          /*
           * MyShops order has already been created and
           * validated by the backend. Only the order ID
           * is sent to our Tabby endpoint; the backend
           * loads the authoritative order amount/items.
           */
          const tabby =
            await createTabbyCheckout(
              order.id
            );

          if (
            !tabby.checkoutUrl
          ) {
            throw new Error(
              tabby.message ||
              "Tabby did not return a checkout URL."
            );
          }

          /*
           * Do not clear the cart here.
           * The Tabby success page reconciles the payment
           * with Tabby and clears the cart only after a
           * successful AUTHORIZED/CLOSED result.
           */
          /*
           * Remember the pending Tabby order in this browser.
           *
           * If the customer closes the browser after Tabby authorizes
           * the payment, the backend webhook will still capture it.
           * When the customer later comes back to MyShops, the global
           * recovery component can detect the paid order and clear the
           * browser cart.
           */
          try {
            window.localStorage.setItem(
              "myshops_pending_tabby_order_id",
              order.id
            );
          } catch (
            storageError
          ) {
            console.warn(
              "Unable to store pending Tabby order id:",
              storageError
            );
          }

          window.location.assign(
            tabby.checkoutUrl
          );

          return;
        }

        if (
          form.paymentMethod ===
          "TAMARA"
        ) {
          /*
           * IMPORTANT:
           *
           * Eligibility was already checked immediately
           * before placePublicOrder().
           *
           * Do NOT run another eligibility call here.
           * The MyShops order now exists, so the next step
           * is to create the Tamara checkout session.
           */

          const tamara =
            await createTamaraCheckout(
              {
                orderId:
                  order.id,

                consumer: {
                  firstName:
                    form.firstName
                      .trim(),

                  lastName:
                    form.lastName
                      .trim(),

                  email:
                    form.email
                      .trim(),

                  phoneNumber:
                    form.phone
                      .trim(),
                },

                billingAddress: {
                  firstName:
                    form.firstName
                      .trim(),

                  lastName:
                    form.lastName
                      .trim(),

                  line1:
                    form.addressLine1
                      .trim(),

                  line2:
                    form.addressLine2
                      .trim(),

                  region:
                    form.emirate
                      .trim(),

                  city:
                    form.city
                      .trim(),

                  countryCode:
                    "AE",

                  phoneNumber:
                    form.phone
                      .trim(),
                },

                shippingAddress: {
                  firstName:
                    form.firstName
                      .trim(),

                  lastName:
                    form.lastName
                      .trim(),

                  line1:
                    form.addressLine1
                      .trim(),

                  line2:
                    form.addressLine2
                      .trim(),

                  region:
                    form.emirate
                      .trim(),

                  city:
                    form.city
                      .trim(),

                  countryCode:
                    "AE",

                  phoneNumber:
                    form.phone
                      .trim(),
                },

                /*
                 * Use the backend-created order lines.
                 * These values have already passed MyShops
                 * order validation.
                 */
                items:
                  order.items.map(
                    (
                      item
                    ) => ({
                      id:
                        item.productVariantId,

                      itemId:
                        item.productId,

                      referenceId:
                        item.productVariantId,

                      name:
                        item.productName,

                      sku:
                        item.sku,

                      type:
                        "Physical",

                      quantity:
                        Number(
                          item.quantity
                        ),

                      unitPrice:
                        Number(
                          item.unitPrice
                        ),

                      totalAmount:
                        Number(
                          item.lineTotal
                        ),

                      taxAmount:
                        Number(
                          item.taxAmount ||
                            0
                        ),

                      discountAmount:
                        0,
                    })
                  ),

                /*
                 * Use backend-calculated order totals,
                 * not browser-calculated totals.
                 */
                taxAmount:
                  Number(
                    order.taxAmount ||
                      0
                  ),

                shippingAmount:
                  Number(
                    order.deliveryAmount ||
                      0
                  ),

                discountName:
                  order.couponCode ||
                  "MyShops Discount",

                discountAmount:
                  Number(
                    order.discountAmount ||
                      0
                  ),

                locale:
                  "en_US",

                paymentType:
                  "PAY_BY_INSTALMENTS",
              }
            );

          console.log(
            "Tamara checkout response:",
            tamara
          );

          if (
            !tamara.checkoutUrl
          ) {
            throw new Error(
              "Tamara did not return a checkout URL."
            );
          }

          /*
           * CRITICAL:
           *
           * Do NOT clear the Redux cart here.
           * Do NOT navigate to /order-success here.
           *
           * The customer must first complete Tamara.
           * The Tamara success return page reconciles the
           * payment and clears the cart only after success.
           */
          window.location.assign(
            tamara.checkoutUrl
          );

          return;
        }

        /*
         * ======================================================
         * STEP 7
         * CHECKOUT SUCCESS
         * ======================================================
         */
  
        setOrderCompleted(
          true
        );
  
        /*
         * Navigate before clearing Redux so the checkout
         * does not temporarily display an empty cart.
         */
        router.replace(
          `/order-success/${order.id}`
        );
  
        /*
         * Clear cart only after:
         *
         * COD  -> order successfully created
         *
         * CARD -> order successfully created AND
         *         Network International confirms payment
         */
        dispatch(
          clearCart()
        );
  
        return;
      } catch (
        error
      ) {
        console.error(
          "Checkout order placement failed:",
          error
        );
  
        /*
         * ======================================================
         * IMPORTANT
         * ======================================================
         *
         * Any validation/order/payment error must leave
         * checkout retryable.
         */
  
        setSubmitError(
          true
        );
  
        setSubmitMessage(
          error instanceof
            Error
            ? error.message
            : "Unable to place your order. Please try again."
        );
      } finally {
        /*
         * Always release the checkout button.
         *
         * Example:
         *
         * Coupon already used
         *       ↓
         * backend rejects order
         *       ↓
         * catch displays error
         *       ↓
         * finally executes
         *       ↓
         * button becomes available again
         */
        setIsSubmitting(
          false
        );
      }
    };

  if (
    !hydrated
  ) {
    return (
      <div className="py-24 text-center text-sm text-storefront-muted">
        Loading checkout…
      </div>
    );
  }

  if (
    orderCompleted
  ) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto max-w-xl rounded-2xl border border-storefront-border-light bg-storefront-surface p-8">
          <p className="text-sm font-black text-storefront-primary">
            Order placed successfully
          </p>

          <p className="mt-2 text-sm text-storefront-muted">
            Redirecting to your order confirmation…
          </p>
        </div>
      </div>
    );
  }

  if (
    !items.length
  ) {
    return (
      <div className="py-20">
        <div className="mx-auto max-w-xl rounded-2xl border border-storefront-border-light bg-storefront-surface p-8 text-center">
          <h1 className="text-2xl font-black text-storefront-text">
            Your cart is
            empty
          </h1>

          <p className="mt-3 text-sm text-storefront-muted">
            Add products
            before
            proceeding to
            checkout.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/"
              )
            }
            className="mt-6 h-11 rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white"
          >
            Continue
            shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Secure checkout
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            Complete your
            order
          </h1>

          <p className="mt-2 text-sm text-storefront-muted">
            Enter your
            delivery and
            payment
            details.
          </p>

          {authenticated ? (
            <p className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              Signed in as{" "}
              {
                customer
                  ?.email
              }
            </p>
          ) : (
            <p className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              Guest checkout
            </p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
            <CheckoutSection
              icon={
                ShieldCheck
              }
              title="Contact information"
              subtitle="Used for order confirmation and delivery updates."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  value={
                    form.firstName
                  }
                  error={
                    errors.firstName
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "firstName",
                      value
                    )
                  }
                />

                <Field
                  label="Last name"
                  value={
                    form.lastName
                  }
                  error={
                    errors.lastName
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "lastName",
                      value
                    )
                  }
                />

                <Field
                  label="Email"
                  type="email"
                  value={
                    form.email
                  }
                  error={
                    errors.email
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "email",
                      value
                    )
                  }
                />

                <Field
                  label="Mobile number"
                  type="tel"
                  placeholder="+971"
                  value={
                    form.phone
                  }
                  error={
                    errors.phone
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "phone",
                      value
                    )
                  }
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={
                MapPin
              }
              title="Delivery address"
              subtitle="UAE delivery information."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Address line 1"
                    value={
                      form.addressLine1
                    }
                    error={
                      errors.addressLine1
                    }
                    onChange={(
                      value
                    ) =>
                      update(
                        "addressLine1",
                        value
                      )
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Address line 2"
                    value={
                      form.addressLine2
                    }
                    onChange={(
                      value
                    ) =>
                      update(
                        "addressLine2",
                        value
                      )
                    }
                  />
                </div>

                <SelectField
                  label="Emirate"
                  value={
                    form.emirate
                  }
                  options={[
                    "Abu Dhabi",
                    "Dubai",
                    "Sharjah",
                    "Ajman",
                    "Umm Al Quwain",
                    "Ras Al Khaimah",
                    "Fujairah",
                  ]}
                  onChange={(
                    value
                  ) =>
                    update(
                      "emirate",
                      value
                    )
                  }
                />

                <Field
                  label="City"
                  value={
                    form.city
                  }
                  error={
                    errors.city
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "city",
                      value
                    )
                  }
                />

                <Field
                  label="Area"
                  value={
                    form.area
                  }
                  error={
                    errors.area
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "area",
                      value
                    )
                  }
                />

                <Field
                  label="Landmark"
                  value={
                    form.landmark
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "landmark",
                      value
                    )
                  }
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={
                Truck
              }
              title="Delivery method"
              subtitle="The fastest available delivery is selected automatically from live stock."
            >
              <div className="space-y-3">
                {hasDeliveryItems ? (
                  <>
                    {deliveryPlanLoading ? (
                      <div className="rounded-xl border border-storefront-border-light bg-[#FAFAFA] p-4">
                        <p className="text-sm font-black text-storefront-text">
                          Checking the fastest delivery option…
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          We are checking current stock across MyShops fulfilment locations.
                        </p>
                      </div>
                    ) : null}

                    {!deliveryPlanLoading &&
                    deliveryPlanError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-black text-red-700">
                          Delivery plan unavailable
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600">
                          {deliveryPlanError}
                        </p>
                      </div>
                    ) : null}

                    {!deliveryPlanLoading &&
                    deliveryPlan ? (
                      <>
                        <div className="rounded-xl border border-[#ccebe8] bg-[#f1fbfa] px-4 py-3">
                          <p className="text-xs font-black text-[#117f77]">
                            Fastest available delivery applied automatically
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-[#397d78]">
                            Express delivery is free. Delivery options are based on live inventory and may be split into more than one shipment.
                          </p>
                        </div>

                        {deliveryPlan.splitShipment ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-black text-amber-800">
                              Your order will arrive in {deliveryPlan.shipments.length} delivery batches
                            </p>
                          </div>
                        ) : null}

                        {deliveryPlan.shipments.map(
                          (shipment, shipmentIndex) => {
                            const isExpress =
                              shipment.deliveryMethod ===
                              "EXPRESS";

                            const title =
                              isExpress
                                ? shipment.deliveryHours ===
                                  1
                                  ? "1-Hour Express — Abu Dhabi"
                                  : shipment.deliveryHours ===
                                    2
                                    ? "2-Hour Express — Dubai / Sharjah"
                                    : shipment.deliveryLabel ||
                                      "Express Delivery"
                                : shipment.deliveryLabel ||
                                  "Standard Delivery";

                            const allocationMap =
                              new Map<
                                string,
                                number
                              >();

                            shipment.allocations.forEach(
                              (allocation) => {
                                allocationMap.set(
                                  allocation.productVariantId,
                                  (allocationMap.get(
                                    allocation.productVariantId
                                  ) || 0) +
                                    Number(
                                      allocation.quantity ||
                                        0
                                    )
                                );
                              }
                            );

                            return (
                              <div
                                key={
                                  shipment.shipmentKey
                                }
                                className={[
                                  "rounded-xl border p-4",
                                  isExpress
                                    ? "border-[#b9e5e1] bg-[#f7fdfc]"
                                    : "border-storefront-border-light bg-white",
                                ].join(
                                  " "
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <div
                                    className={[
                                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                                      isExpress
                                        ? "bg-[#d9f5f2] text-[#159b91]"
                                        : "bg-storefront-secondary text-storefront-primary",
                                    ].join(
                                      " "
                                    )}
                                  >
                                    {isExpress ? (
                                      <PackageCheck
                                        size={18}
                                      />
                                    ) : (
                                      <Truck
                                        size={18}
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-storefront-muted">
                                          {deliveryPlan.shipments.length >
                                          1
                                            ? `Shipment ${
                                                shipmentIndex +
                                                1
                                              }`
                                            : "Delivery"}
                                        </p>

                                        <p className="mt-1 text-sm font-black text-storefront-text">
                                          {title}
                                        </p>
                                      </div>

                                      <span className="text-sm font-black text-emerald-600">
                                        Free
                                      </span>
                                    </div>

                                    {!isExpress &&
                                    shipment.deliveryMinDays !==
                                      null ? (
                                      <p className="mt-1 text-xs text-storefront-muted">
                                        Estimated {shipment.deliveryMinDays}
                                        {shipment.deliveryMaxDays !==
                                          null &&
                                        shipment.deliveryMaxDays !==
                                          shipment.deliveryMinDays
                                          ? `–${shipment.deliveryMaxDays}`
                                          : ""}{" "}
                                        business {shipment.deliveryMaxDays ===
                                          1 ||
                                        (shipment.deliveryMaxDays ===
                                          null &&
                                          shipment.deliveryMinDays ===
                                            1)
                                          ? "day"
                                          : "days"}
                                      </p>
                                    ) : null}

                                    <div className="mt-3 space-y-2 border-t border-black/5 pt-3">
                                      {[
                                        ...allocationMap.entries(),
                                      ].map(
                                        ([
                                          variantId,
                                          allocatedQuantity,
                                        ]) => {
                                          const cartItem =
                                            deliveryCartItems.find(
                                              (item) =>
                                                item.variantId ===
                                                variantId
                                            );

                                          return (
                                            <div
                                              key={
                                                variantId
                                              }
                                              className="flex items-center justify-between gap-3 text-xs"
                                            >
                                              <span className="min-w-0 flex-1 truncate font-bold text-storefront-text">
                                                {cartItem
                                                  ?.productName ||
                                                  "Product"}
                                              </span>

                                              <span className="shrink-0 text-storefront-muted">
                                                Qty {allocatedQuantity}
                                              </span>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}

                        {deliveryPlan.directDeliveryItems.length >
                        0 ? (
                          <div className="rounded-xl border border-storefront-border-light bg-white p-4">
                            <div className="flex items-start gap-3">
                              <MapPin
                                size={18}
                                className="mt-0.5 shrink-0 text-storefront-primary"
                              />

                              <div>
                                <p className="text-sm font-black text-storefront-text">
                                  Direct Delivery
                                </p>

                                <p className="mt-1 text-xs leading-5 text-storefront-muted">
                                  {deliveryPlan.directDeliveryItems.length} item
                                  {deliveryPlan.directDeliveryItems.length ===
                                  1
                                    ? " is"
                                    : "s are"} handled as direct delivery. Delivery timing will follow the direct-delivery arrangement.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : null}

{(
  deliveryPlan
    .alwaysAvailableItems
    ?.length ||
  0
) > 0 ? (
  <div className="rounded-xl border border-storefront-border-light bg-white p-4">
    <div className="flex items-start gap-3">
      <MapPin
        size={18}
        className="mt-0.5 shrink-0 text-storefront-primary"
      />

      <div>
        <p className="text-sm font-black text-storefront-text">
          Standard Delivery
        </p>

        <p className="mt-1 text-xs leading-5 text-storefront-muted">
          {deliveryPlan.alwaysAvailableItems?.length}{" "}
          {deliveryPlan.alwaysAvailableItems?.length === 1
            ? "item is"
            : "items are"}{" "}
          available to order and will be delivered by standard delivery.
        </p>
      </div>
    </div>
  </div>
) : null}

                        {!deliveryPlan.fullyFulfillable ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-xs font-black text-red-700">
                              Some items cannot currently be fulfilled in the requested quantity.
                            </p>
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </>
                ) : null}

                {pickupCartItems.length >
                0 ? (
                  <div className="rounded-xl border border-storefront-border-light bg-white p-4">
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={20}
                        className="mt-0.5 shrink-0 text-storefront-primary"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-black text-storefront-text">
                            Store pickup
                          </p>

                          <span className="text-sm font-black text-emerald-600">
                            Free
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {pickupCartItems.map(
                            (item) => (
                              <div
                                key={item.key}
                                className="text-xs"
                              >
                                <p className="font-bold text-storefront-text">
                                  {item.productName} × {item.quantity}
                                </p>

                                <p className="mt-0.5 text-storefront-muted">
                                  {item.pickupLocationName
                                    ? `Pickup from ${item.pickupLocationName}`
                                    : "Pickup store must be selected in the cart"}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={
                CreditCard
              }
              title="Payment method"
            >
              <div className="space-y-3">
                {paymentOptions.map(
                  (
                    option
                  ) => {
                    const selected =
                      form.paymentMethod ===
                      option.code;

                    return (
                      <div
                        key={
                          option.code
                        }
                        className="space-y-3"
                      >
                        <button
                          type="button"
                          disabled={
                            !option.enabled
                          }
                          onClick={() =>
                            update(
                              "paymentMethod",
                              option.code
                            )
                          }
                          className={[
                            "flex w-full items-center justify-between rounded-xl border p-4 text-left transition",

                            !option.enabled
                              ? "cursor-not-allowed border-storefront-border-light bg-[#FAFAFA] opacity-55"
                              : selected
                                ? "border-[#C9CED4] bg-[#FAFAFA] shadow-[0_0_0_1px_rgba(17,17,17,0.02)]"
                                : "border-storefront-border-light bg-white hover:border-[#D9DDE3] hover:bg-[#FCFCFC]",
                          ].join(
                            " "
                          )}
                        >
                          <div className="flex min-w-0 flex-1 items-center justify-between gap-6">
                            <div className="min-w-0 flex-1">
                              {option.code ===
                              "TAMARA" ? (
                                <>
                                  <p className="text-lg font-bold leading-tight text-storefront-text sm:text-xl">
                                    {
                                      option.description
                                    }
                                  </p>

                                  {tamaraEligible &&
                                  !tamaraChecking ? (
                                    <p className="mt-2 text-sm font-semibold text-storefront-muted sm:text-base">
                                      Pay securely with Tamara
                                    </p>
                                  ) : null}
                                </>
                              ) : option.code ===
                                "TABBY" ? (
                                <>
                                  <p className="text-lg font-bold leading-tight text-storefront-text sm:text-xl">
                                    Pay later with Tabby
                                  </p>

                                  <p className="mt-2 text-sm font-medium text-storefront-muted sm:text-base">
                                    {
                                      option.description
                                    }
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-base font-bold text-storefront-text sm:text-lg">
                                    {
                                      option.title
                                    }
                                  </p>

                                  <p className="mt-1.5 text-sm font-medium text-storefront-muted">
                                    {
                                      option.description
                                    }
                                  </p>
                                </>
                              )}
                            </div>

                            {option.code ===
                            "TABBY" ? (
                              <div className="ml-auto flex shrink-0 items-center justify-end pl-4">
                                {/* Use the official, unmodified Tabby wordmark downloaded from Tabby's brand assets. */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src="/images/payments/tabby-wordmark.svg"
                                  alt="Tabby"
                                  className="block h-8 w-auto max-w-[112px] object-contain"
                                />
                              </div>
                            ) : null}

                            {option.code ===
                              "TAMARA" &&
                            "logo" in option &&
                            option.logo ? (
                              <div className="ml-auto flex shrink-0 items-center justify-end pl-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={
                                    option.logo
                                  }
                                  alt="Tamara"
                                  className="block h-[24px] w-auto max-w-[88px] object-contain object-right"
                                />
                              </div>
                            ) : null}
                          </div>

                          {!option.enabled &&
                          option.code ===
                            "TAMARA" ? (
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                              {
                                tamaraChecking
                                  ? "Checking"
                                  : "Unavailable"
                              }
                            </span>
                          ) : null}
                        </button>

                        {option.code ===
                          "TABBY" &&
                        selected &&
                        option.enabled ? (
                          <div className="rounded-xl border border-storefront-border-light bg-white p-4">
                            <TabbyCard
                              amount={
                                grandTotal
                              }
                              currencyCode={
                                currencyCode
                              }
                              language="en"
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  }
                )}
              </div>

              {form.paymentMethod ===
              "CARD" ? (
                <div className="mt-4">
                  <NetworkInternationalCard
                    amount={
                      grandTotal
                    }
                    currencyCode={
                      currencyCode
                    }
                  />
                </div>
              ) : null}
            </CheckoutSection>

            <section className="rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 sm:p-6">
              <label className="text-sm font-black text-storefront-text">
                Order notes
              </label>

              <textarea
                value={
                  form.notes
                }
                onChange={(
                  event
                ) =>
                  update(
                    "notes",
                    event.target
                      .value
                  )
                }
                rows={
                  4
                }
                placeholder="Optional delivery instructions"
                className="mt-3 w-full rounded-xl border border-storefront-border-light bg-white px-4 py-3 text-sm text-storefront-text outline-none transition hover:border-[#D9DDE3] focus:border-[#BFC5CC] focus:ring-2 focus:ring-[#EEF0F2]"
              />
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 shadow-[0_6px_22px_rgba(17,24,39,0.035)] sm:p-6">
              <h2 className="text-xl font-black text-storefront-text">
                Order
                summary
              </h2>

              <div className="mt-5 max-h-[360px] space-y-4 overflow-auto pr-1">
                {items.map(
                  (
                    item
                  ) => (
                    <div
                      key={
                        item.key
                      }
                      className="flex gap-3"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-storefront-border-light bg-white">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.imageUrl
                            }
                            alt={
                              item.productName
                            }
                            className="h-full w-full object-contain p-2"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black text-storefront-text">
                          {
                            item.productName
                          }
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          SKU:{" "}
                          {
                            item.sku
                          }
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </p>

                        {item.extendedWarranty ? (
  <div className="mt-2">
    <p className="text-[11px] font-black text-storefront-primary">
      {
        item.extendedWarranty
          .name
      }
    </p>

    <div className="mt-0.5 flex items-center gap-1 text-[11px] text-storefront-muted">
  <StorefrontMoney
    amount={
      item.extendedWarranty
        .unitPrice
    }
    currencyCode={
      item.extendedWarranty
        .currencyCode ||
      item.currencyCode
    }
  />

  <span>
    × {item.quantity}
  </span>
</div>
  </div>
) : null}

                        {item.bundleSelections?.length ? (
                          <div className="mt-3 space-y-2">
                            {item.bundleSelections.map(
                              (bundle) => (
                                <div
                                  key={
                                    bundle.bundlePromotionId
                                  }
                                  className="rounded-lg border border-storefront-primary/25 bg-storefront-secondary/40 p-2.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-[11px] font-black text-storefront-text">
                                      {
                                        bundle.name
                                      }
                                    </p>

                                    <span className="shrink-0 text-[11px] font-black text-storefront-text">
                                      {bundle.priceMode ===
                                      "FREE" ? (
                                        "FREE"
                                      ) : bundle.priceMode ===
                                          "FIXED_TOTAL" &&
                                        bundle.priceAmount !=
                                          null ? (
                                        <>
                                          <StorefrontMoney
                                            amount={
                                              Number(
                                                bundle.priceAmount
                                              )
                                            }
                                            currencyCode={
                                              bundle.currencyCode ||
                                              item.currencyCode
                                            }
                                          />{" "}
                                          total
                                        </>
                                      ) : (
                                        <>
                                          +{" "}
                                          <StorefrontMoney
                                            amount={
                                              Number(
                                                bundle.priceAmount ||
                                                0
                                              ) *
                                              Number(
                                                bundle.selectionQuantity ||
                                                1
                                              )
                                            }
                                            currencyCode={
                                              bundle.currencyCode ||
                                              item.currencyCode
                                            }
                                          />
                                        </>
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-storefront-primary">
                                    Bundle included
                                  </p>

                                  <div className="mt-1 space-y-0.5">
                                    {bundle.items.map(
                                      (
                                        bundleItem
                                      ) => (
                                        <p
                                          key={
                                            bundleItem.id
                                          }
                                          className="text-[10px] leading-4 text-storefront-muted"
                                        >
                                          •{" "}
                                          {
                                            bundleItem.label
                                          }
                                          {Number(
                                            bundleItem.quantity ||
                                            1
                                          ) > 1
                                            ? ` × ${Number(
                                                bundleItem.quantity
                                              )}`
                                            : ""}
                                        </p>
                                      )
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : null}
                      </div>

                      <StorefrontMoney
                          amount={
                            item.unitPrice *
                            item.quantity
                          }
                          currencyCode={
                            item.currencyCode
                          }
                          className="text-sm font-black text-storefront-text"
                        />
                    </div>
                  )
                )}
              </div>

              <div className="my-5 border-t border-storefront-border-light" />

              <CouponSection
                merchandiseTotal={
                  cartTotal
                }
                deliveryAmount={
                  baseDeliveryAmount
                }
                currencyCode={
                  currencyCode
                }
              />

              <div className="my-5 border-t border-storefront-border-light" />

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    Subtotal
                  </dt>

                  <dd className="font-bold text-storefront-text">
                      <StorefrontMoney
                        amount={
                          subtotal
                        }
                        currencyCode={
                          currencyCode
                        }
                      />
                    </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    VAT
                  </dt>

                  <dd className="font-bold text-storefront-text">
                    {tax > 0 ? (
                      <StorefrontMoney
                        amount={
                          tax
                        }
                        currencyCode={
                          currencyCode
                        }
                      />
                    ) : (
                      "Included"
                    )}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    Delivery
                  </dt>

                  <dd className="font-bold text-storefront-text">
                    {deliveryAmount ===
                    0 ? (
                      "Free"
                    ) : (
                      <StorefrontMoney
                        amount={
                          deliveryAmount
                        }
                        currencyCode={
                          currencyCode
                        }
                      />
                    )}
                  </dd>
                </div>

                {discountAmount >
                0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-emerald-700">
                      Discount
                    </dt>

                    <dd className="flex items-center font-black text-emerald-700">
                            <span>
                              -
                            </span>

                            <StorefrontMoney
                              amount={
                                discountAmount
                              }
                              currencyCode={
                                currencyCode
                              }
                            />
                          </dd>
                  </div>
                ) : null}
              </dl>

              <div className="my-5 border-t border-storefront-border-light" />

              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-black text-storefront-text">
                  Total
                </span>

                <StorefrontMoney
                      amount={
                        grandTotal
                      }
                      currencyCode={
                        currencyCode
                      }
                      className="text-2xl font-black text-storefront-text"
                    />
              </div>

              {appliedCoupon ? (
                <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-semibold leading-5 text-emerald-700">
                  Coupon{" "}
                  <span className="font-black">
                    {
                      appliedCoupon.code
                    }
                  </span>{" "}
                  has been applied.
                  The discount will be
                  validated again when
                  the order is placed.
                </p>
              ) : null}

             
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      deliveryPlanLoading ||
                      (hasDeliveryItems &&
                        (!deliveryPlan ||
                          !deliveryPlan.fullyFulfillable))
                    }
                    onClick={() =>
                      void submitOrder()
                    }
                    className={[
                      "mt-6 h-12 w-full rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white transition",

                      isSubmitting
                        ? "cursor-wait opacity-60"
                        : "hover:opacity-90",
                    ].join(
                      " "
                    )}
                  >
                    {deliveryPlanLoading &&
                    !isSubmitting ? (
                      "Checking delivery…"
                    ) : isSubmitting ? (
                      form.paymentMethod ===
                      "CARD" ? (
                        "Redirecting to secure payment…"
                      ) : form.paymentMethod ===
                        "TABBY" ? (
                        "Redirecting to Tabby…"
                      ) : form.paymentMethod ===
                        "TAMARA" ? (
                        "Redirecting to Tamara…"
                      ) : (
                        "Placing order…"
                      )
                    ) : form.paymentMethod ===
                      "CARD" ? (
                      <span className="inline-flex items-center justify-center gap-1.5">
                        <span>
                          Pay
                        </span>

                        <StorefrontMoney
                          amount={
                            grandTotal
                          }
                          currencyCode={
                            currencyCode
                          }
                          className="font-black text-white"
                        />
                      </span>
                    ) : form.paymentMethod ===
                      "TABBY" ? (
                      "Continue with Tabby"
                    ) : form.paymentMethod ===
                      "TAMARA" ? (
                      "Continue with Tamara"
                    ) : (
                      "Place order"
                    )}
                  </button>

              {submitMessage ? (
                <p
                  className={[
                    "mt-4 rounded-xl px-4 py-3 text-xs font-semibold leading-5",

                    submitError
                      ? "bg-red-50 text-red-700"
                      : "bg-emerald-50 text-emerald-700",
                  ].join(
                    " "
                  )}
                >
                  {
                    submitMessage
                  }
                </p>
              ) : null}

              <p className="mt-4 text-center text-[11px] leading-5 text-storefront-muted">
                Final prices
                and product
                availability
                are validated
                securely by
                the backend
                before order
                creation.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CheckoutAiAssistant
        items={
          items
        }
        deliveryMethod={
          form.deliveryMethod
        }
        paymentMethod={
          form.paymentMethod
        }
        total={
          grandTotal
        }
        currencyCode={
          currencyCode
        }
        appliedCouponCode={
          appliedCoupon
            ?.code ||
          null
        }
      />
    </>
  );
}

function CheckoutSection({
  icon:
    Icon,

  title,

  subtitle,

  children,
}: {
  icon:
    typeof ShieldCheck;

  title:
    string;

  subtitle?:
    string;

  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-storefront-border-light bg-storefront-surface p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
          <Icon
            size={
              20
            }
          />
        </div>

        <div>
          <h2 className="text-lg font-black text-storefront-text">
            {
              title
            }
          </h2>

          {subtitle ? (
            <p className="text-xs text-storefront-muted">
              {
                subtitle
              }
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        {
          children
        }
      </div>
    </section>
  );
}

function Field({
  label,

  value,

  onChange,

  type =
    "text",

  placeholder,

  error,
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value:
      string
  ) => void;

  type?:
    string;

  placeholder?:
    string;

  error?:
    string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-storefront-text">
        {
          label
        }
      </span>

      <input
        type={
          type
        }
        value={
          value
        }
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className={[
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-storefront-text outline-none transition",

          error
            ? "border-red-400 focus:border-red-500"
            : "border-storefront-border-light hover:border-[#D9DDE3] focus:border-[#BFC5CC] focus:ring-2 focus:ring-[#EEF0F2]",
        ].join(
          " "
        )}
      />

      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {
            error
          }
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,

  value,

  options,

  onChange,
}: {
  label:
    string;

  value:
    string;

  options:
    string[];

  onChange: (
    value:
      string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-storefront-text">
        {
          label
        }
      </span>

      <select
        value={
          value
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .value
          )
        }
        className="h-11 w-full rounded-xl border border-storefront-border-light bg-white px-3 text-sm text-storefront-text outline-none focus:border-storefront-primary"
      >
        {options.map(
          (
            option
          ) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {
                option
              }
            </option>
          )
        )}
      </select>
    </label>
  );
}