"use client";

import {
  AlertCircle,
  BadgeCheck,
  Check,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

/*
 * ------------------------------------------------------------
 * API CONFIG
 * ------------------------------------------------------------
 */

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
 * ------------------------------------------------------------
 * TYPES
 * ------------------------------------------------------------
 */

export type ProtectionSchemeType =
  | "EXTENDED_WARRANTY"
  | "DAMAGE_PROTECTION";

export type ProtectionPricingMethod =
  | "PERCENTAGE"
  | "FIXED";

export type ProtectionPricingSource =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY"
  | "DEFAULT";

export interface ExtendedWarrantySelection {
  schemeId: string;

  assignmentId:
    | string
    | null;

  code: string;

  name: string;

  schemeType:
    ProtectionSchemeType;

  durationMonths:
    | number
    | null;

  /*
   * Kept for compatibility with
   * the current cart structure.
   */
  periodYears:
    | number
    | null;

  pricingMethod:
    ProtectionPricingMethod;

  percentage:
    | number
    | null;

  fixedAmount:
    | number
    | null;

  unitPrice: number;

  totalPrice: number;

  currencyCode: string;

  pricingSource:
    ProtectionPricingSource;

  coverageStartMode:
    | string
    | null;
}

interface ProtectionPlan {
  schemeId: string;

  assignmentId:
    | string
    | null;

  code: string;

  name: string;

  description:
    | string
    | null;

  schemeType:
    ProtectionSchemeType;

  durationMonths:
    | number
    | null;

  coverageStartMode:
    | string
    | null;

  pricingMethod:
    ProtectionPricingMethod;

  percentage:
    | number
    | null;

  fixedAmount:
    | number
    | null;

  productUnitPrice: number;

  unitPrice: number;

  currencyCode: string;

  pricingSource:
    ProtectionPricingSource;

  termsAndConditions:
    | string
    | null;

  sortOrder: number;
}

interface ProtectionResolverData {
  eligible: boolean;

  reason:
    | string
    | null;

  message: string;

  product?: {
    id:
      | string
      | null;

    name:
      | string
      | null;

    brandId?:
      | string
      | null;

    categoryId?:
      | string
      | null;
  };

  variant?: {
    id:
      | string
      | null;

    sku:
      | string
      | null;

    name:
      | string
      | null;
  };

  pricing?: {
    sellingPrice:
      | number
      | null;

    currencyCode: string;

    minimumEligibleProductAmount?:
      number;
  };

  plans: ProtectionPlan[];
}

interface ProtectionApiResponse {
  success: boolean;

  data?:
    ProtectionResolverData;

  error?: {
    code?: string;

    message?: string;

    details?: unknown[];
  };
}

interface ExtendedWarrantyDrawerProps {
  open: boolean;

  onClose:
    () => void;

  onContinueWithoutWarranty:
    () => void;

  onWarrantyAdded: (
    selection:
      ExtendedWarrantySelection
  ) => void;

  productId: string;

  variantId: string;

  productName: string;

  imageUrl?:
    | string
    | null;

  productPrice: number;

  currencyCode: string;

  quantity: number;
}

/*
 * ------------------------------------------------------------
 * HELPERS
 * ------------------------------------------------------------
 */

const money = (
  value: number,
  currencyCode: string
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency:
        currencyCode ||
        "AED",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value ||
        0
    )
  );

function getDurationLabel(
  durationMonths:
    | number
    | null
) {
  if (
    !durationMonths
  ) {
    return null;
  }

  if (
    durationMonths %
      12 ===
    0
  ) {
    const years =
      durationMonths /
      12;

    return `${years} ${
      years === 1
        ? "Year"
        : "Years"
    }`;
  }

  return `${durationMonths} Months`;
}

function getSchemeTypeLabel(
  schemeType:
    ProtectionSchemeType
) {
  if (
    schemeType ===
    "DAMAGE_PROTECTION"
  ) {
    return "Damage Protection";
  }

  return "Extended Warranty";
}

function getPeriodYears(
  durationMonths:
    | number
    | null
) {
  if (
    !durationMonths ||
    durationMonths %
      12 !==
      0
  ) {
    return null;
  }

  return (
    durationMonths /
    12
  );
}

function getPlanSubtitle(
  plan:
    ProtectionPlan
) {
  if (
    plan.description
  ) {
    return plan.description;
  }

  if (
    plan.schemeType ===
    "DAMAGE_PROTECTION"
  ) {
    return "Additional protection against eligible accidental damage.";
  }

  if (
    plan.coverageStartMode ===
    "AFTER_MANUFACTURER_WARRANTY"
  ) {
    return "Protection continues after the standard manufacturer warranty.";
  }

  return "Additional protection for your purchase.";
}

function getPlanBenefits(
  plan:
    ProtectionPlan
) {
  if (
    plan.schemeType ===
    "DAMAGE_PROTECTION"
  ) {
    return [
      "Protection linked to the selected product",
      "Coverage according to the selected damage protection plan",
      "Service support through approved channels",
      "Protection details are recorded against your purchase",
    ];
  }

  return [
    plan.coverageStartMode ===
    "AFTER_MANUFACTURER_WARRANTY"
      ? "Starts after the standard manufacturer warranty"
      : "Coverage starts from the purchase date",

    "Electrical and mechanical failure protection",

    "Service support through approved channels",

    "Coverage is linked to the selected product variant",
  ];
}

/*
 * ------------------------------------------------------------
 * COMPONENT
 * ------------------------------------------------------------
 */

export default function ExtendedWarrantyDrawer({
  open,
  onClose,
  onContinueWithoutWarranty,
  onWarrantyAdded,
  productId,
  variantId,
  productName,
  imageUrl,
  productPrice,
  currencyCode,
  quantity,
}: ExtendedWarrantyDrawerProps) {
  const [
    plans,
    setPlans,
  ] =
    useState<
      ProtectionPlan[]
    >(
      []
    );

  const [
    selectedSchemeId,
    setSelectedSchemeId,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    resolverData,
    setResolverData,
  ] =
    useState<
      ProtectionResolverData |
      null
    >(
      null
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    reloadKey,
    setReloadKey,
  ] =
    useState(
      0
    );

  /*
   * ----------------------------------------------------------
   * PREVENT BACKGROUND SCROLL
   * ----------------------------------------------------------
   */

  useEffect(
    () => {
      if (
        !open
      ) {
        return;
      }

      const previousOverflow =
        document.body.style
          .overflow;

      document.body.style
        .overflow =
        "hidden";

      return () => {
        document.body.style
          .overflow =
          previousOverflow;
      };
    },
    [
      open,
    ]
  );

  /*
   * ----------------------------------------------------------
   * LOAD DYNAMIC PROTECTION PLANS
   * ----------------------------------------------------------
   */

  useEffect(
    () => {
      if (
        !open ||
        !productId ||
        !variantId
      ) {
        return;
      }

      const controller =
        new AbortController();

      const loadPlans =
        async () => {
          setIsLoading(
            true
          );

          setErrorMessage(
            null
          );

          setPlans(
            []
          );

          setResolverData(
            null
          );

          setSelectedSchemeId(
            null
          );

          try {
            const params =
              new URLSearchParams({
                productId,

                productVariantId:
                  variantId,

                channelCode:
                  "WEBSITE",

                currencyCode:
                  currencyCode ||
                  "AED",

                quantity:
                  String(
                    Math.max(
                      1,
                      quantity
                    )
                  ),
              });

            const response =
              await fetch(
                `${API_URL}/public/protection/plans?${params.toString()}`,
                {
                  method:
                    "GET",

                  headers: {
                    Accept:
                      "application/json",

                    "x-company-code":
                      COMPANY_CODE,
                  },

                  credentials:
                    "include",

                  signal:
                    controller
                      .signal,
                }
              );

            const payload =
              (await response.json()) as
                ProtectionApiResponse;

            if (
              !response.ok ||
              !payload.success
            ) {
              throw new Error(
                payload.error
                  ?.message ||
                  "Unable to load protection plans."
              );
            }

            if (
              !payload.data
            ) {
              throw new Error(
                "Protection plan response is empty."
              );
            }

            setResolverData(
              payload.data
            );

            const availablePlans =
              Array.isArray(
                payload.data
                  .plans
              )
                ? payload.data
                    .plans
                : [];

            setPlans(
              availablePlans
            );

            if (
              availablePlans
                .length >
              0
            ) {
              setSelectedSchemeId(
                availablePlans[
                  0
                ].schemeId
              );
            }
          } catch (
            error
          ) {
            if (
              error instanceof
                DOMException &&
              error.name ===
                "AbortError"
            ) {
              return;
            }

            console.error(
              "Unable to load protection plans:",
              error
            );

            setErrorMessage(
              error instanceof
                Error
                ? error.message
                : "Unable to load protection plans."
            );
          } finally {
            if (
              !controller
                .signal
                .aborted
            ) {
              setIsLoading(
                false
              );
            }
          }
        };

      void loadPlans();

      return () => {
        controller.abort();
      };
    },
    [
      open,
      productId,
      variantId,
      currencyCode,
      quantity,
      reloadKey,
    ]
  );

  /*
   * ----------------------------------------------------------
   * SELECTED PLAN
   * ----------------------------------------------------------
   */

  const selectedPlan =
    useMemo(
      () =>
        plans.find(
          (
            plan
          ) =>
            plan.schemeId ===
            selectedSchemeId
        ) ||
        plans[0] ||
        null,
      [
        plans,
        selectedSchemeId,
      ]
    );

  /*
   * IMPORTANT:
   *
   * The backend resolver already calculated
   * the protection price.
   *
   * We DO NOT calculate percentage pricing
   * again in the browser.
   */

  const resolvedUnitPrice =
    selectedPlan
      ? Number(
          selectedPlan
            .unitPrice ||
            0
        )
      : 0;

  const safeQuantity =
    Math.max(
      1,
      Number(
        quantity ||
          1
      )
    );

  const totalProtectionPrice =
    resolvedUnitPrice *
    safeQuantity;

  const displayCurrency =
    selectedPlan
      ?.currencyCode ||
    resolverData
      ?.pricing
      ?.currencyCode ||
    currencyCode ||
    "AED";

  const resolvedProductPrice =
    Number(
      resolverData
        ?.pricing
        ?.sellingPrice ??
        productPrice ??
        0
    );

  /*
   * ----------------------------------------------------------
   * ADD SELECTED PLAN
   * ----------------------------------------------------------
   */

  const handleAddProtection =
    () => {
      if (
        !selectedPlan
      ) {
        return;
      }

      onWarrantyAdded({
        schemeId:
          selectedPlan
            .schemeId,

        assignmentId:
          selectedPlan
            .assignmentId,

        code:
          selectedPlan
            .code,

        name:
          selectedPlan
            .name,

        schemeType:
          selectedPlan
            .schemeType,

        durationMonths:
          selectedPlan
            .durationMonths,

        periodYears:
          getPeriodYears(
            selectedPlan
              .durationMonths
          ),

        pricingMethod:
          selectedPlan
            .pricingMethod,

        percentage:
          selectedPlan
            .percentage,

        fixedAmount:
          selectedPlan
            .fixedAmount,

        unitPrice:
          Number(
            resolvedUnitPrice.toFixed(
              2
            )
          ),

        totalPrice:
          Number(
            totalProtectionPrice.toFixed(
              2
            )
          ),

        currencyCode:
          displayCurrency,

        pricingSource:
          selectedPlan
            .pricingSource,

        coverageStartMode:
          selectedPlan
            .coverageStartMode,
      });
    };

  if (
    !open
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110]">
      {/* BACKDROP */}

      <button
        type="button"
        aria-label="Close protection drawer"
        onClick={
          onClose
        }
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      {/* DRAWER */}

      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[540px] flex-col bg-white shadow-2xl">
        {/* HEADER */}

        <header className="flex items-center justify-between border-b border-storefront px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-storefront-primary">
              Added to cart
            </p>

            <h2 className="mt-1 text-xl font-black text-storefront-text">
              Protect your purchase
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-storefront-secondary"
          >
            <X
              size={
                21
              }
            />
          </button>
        </header>

        {/* BODY */}

        <div className="flex-1 overflow-y-auto p-5">
          {/* PRODUCT */}

          <div className="flex gap-4 rounded-2xl bg-storefront-secondary/50 p-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    imageUrl
                  }
                  alt={
                    productName
                  }
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <ShieldCheck
                  size={
                    34
                  }
                  className="text-storefront-primary"
                />
              )}
            </div>

            <div className="min-w-0">
              <p className="line-clamp-3 text-sm font-black leading-6 text-storefront-text">
                {
                  productName
                }
              </p>

              <p className="mt-2 text-sm font-black text-storefront-primary">
                {money(
                  resolvedProductPrice,
                  displayCurrency
                )}
              </p>

              <p className="mt-1 text-xs text-storefront-muted">
                Quantity:{" "}
                {
                  safeQuantity
                }
              </p>
            </div>
          </div>

          {/* LOADING */}

          {isLoading ? (
            <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-storefront bg-white p-6 text-center">
              <LoaderCircle
                size={
                  32
                }
                className="animate-spin text-storefront-primary"
              />

              <p className="mt-4 text-sm font-black text-storefront-text">
                Checking available protection plans
              </p>

              <p className="mt-1 text-xs text-storefront-muted">
                Please wait a moment.
              </p>
            </div>
          ) : null}

          {/* API ERROR */}

          {!isLoading &&
          errorMessage ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={
                    22
                  }
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="text-sm font-black text-red-800">
                    Protection plans could not be loaded
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-700">
                    {
                      errorMessage
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReloadKey(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700"
              >
                <RefreshCw
                  size={
                    14
                  }
                />

                Try again
              </button>
            </div>
          ) : null}

          {/* PRODUCT NOT ELIGIBLE */}

          {!isLoading &&
          !errorMessage &&
          resolverData &&
          !resolverData
            .eligible ? (
            <div className="mt-6 rounded-2xl border border-storefront bg-storefront-secondary/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={
                    25
                  }
                  className="mt-0.5 shrink-0 text-storefront-muted"
                />

                <div>
                  <p className="text-sm font-black text-storefront-text">
                    No protection plan available
                  </p>

                  <p className="mt-1 text-xs leading-5 text-storefront-muted">
                    {
                      resolverData
                        .message
                    }
                  </p>

                  {resolverData
                    .pricing
                    ?.minimumEligibleProductAmount ? (
                    <p className="mt-2 text-xs font-bold text-storefront-muted">
                      Minimum eligible product value:{" "}
                      {money(
                        resolverData
                          .pricing
                          .minimumEligibleProductAmount,
                        displayCurrency
                      )}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}

          {/* ELIGIBLE BUT NO SCHEMES */}

          {!isLoading &&
          !errorMessage &&
          resolverData
            ?.eligible &&
          plans.length ===
            0 ? (
            <div className="mt-6 rounded-2xl border border-storefront bg-storefront-secondary/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={
                    25
                  }
                  className="mt-0.5 shrink-0 text-storefront-muted"
                />

                <div>
                  <p className="text-sm font-black text-storefront-text">
                    No active protection plans
                  </p>

                  <p className="mt-1 text-xs leading-5 text-storefront-muted">
                    {
                      resolverData
                        .message
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* AVAILABLE PLANS */}

          {!isLoading &&
          !errorMessage &&
          plans.length >
            0 ? (
            <>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-black text-storefront-text">
                    Available protection
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-storefront-muted">
                    Choose the protection option that suits your purchase.
                  </p>
                </div>

                <ShieldCheck
                  size={
                    30
                  }
                  className="shrink-0 text-storefront-primary"
                />
              </div>

              <div className="mt-5 grid gap-3">
                {plans.map(
                  (
                    plan
                  ) => {
                    const selected =
                      selectedPlan
                        ?.schemeId ===
                      plan.schemeId;

                    const duration =
                      getDurationLabel(
                        plan.durationMonths
                      );

                    return (
                      <button
                        key={
                          plan.schemeId
                        }
                        type="button"
                        onClick={() =>
                          setSelectedSchemeId(
                            plan.schemeId
                          )
                        }
                        className={[
                          "relative w-full rounded-2xl border p-4 text-left transition",
                          selected
                            ? "border-storefront-primary bg-storefront-secondary ring-1 ring-storefront-primary"
                            : "border-storefront bg-white hover:border-storefront-primary/60",
                        ].join(
                          " "
                        )}
                      >
                        {/* CHECK */}

                        <span
                          className={[
                            "absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-md border",
                            selected
                              ? "border-storefront-primary bg-storefront-primary text-white"
                              : "border-storefront bg-white text-transparent",
                          ].join(
                            " "
                          )}
                        >
                          <Check
                            size={
                              15
                            }
                          />
                        </span>

                        {/* TYPE */}

                        <p className="pr-10 text-[11px] font-black uppercase tracking-[0.12em] text-storefront-primary">
                          {getSchemeTypeLabel(
                            plan.schemeType
                          )}
                        </p>

                        {/* NAME */}

                        <p className="mt-1 pr-10 text-base font-black text-storefront-text">
                          {
                            plan.name
                          }
                        </p>

                        {/* DURATION */}

                        {duration ? (
                          <p className="mt-1 text-xs font-bold text-storefront-muted">
                            {
                              duration
                            }{" "}
                            coverage
                          </p>
                        ) : null}

                        {/* PRICE */}

                        <p className="mt-4 text-2xl font-black text-storefront-text">
                          {money(
                            Number(
                              plan.unitPrice ||
                                0
                            ),
                            plan.currencyCode ||
                              displayCurrency
                          )}
                        </p>

                        {/* PRICING DETAIL */}

                        {plan.pricingMethod ===
                          "PERCENTAGE" &&
                        plan.percentage !==
                          null ? (
                          <p className="mt-1 text-[11px] font-bold text-storefront-primary">
                            {
                              plan.percentage
                            }
                            % of product price
                          </p>
                        ) : null}

                        {plan.pricingMethod ===
                          "FIXED" ? (
                          <p className="mt-1 text-[11px] font-bold text-storefront-primary">
                            Fixed protection price
                          </p>
                        ) : null}
                      </button>
                    );
                  }
                )}
              </div>

              {/* SELECTED PLAN DETAILS */}

              {selectedPlan ? (
                <div className="mt-5 rounded-2xl border border-storefront p-5">
                  <div className="flex items-start gap-3">
                    <BadgeCheck
                      size={
                        24
                      }
                      className="mt-0.5 shrink-0 text-storefront-primary"
                    />

                    <div>
                      <p className="text-base font-black text-storefront-text">
                        {
                          selectedPlan
                            .name
                        }
                      </p>

                      <p className="mt-1 text-xs leading-5 text-storefront-muted">
                        {getPlanSubtitle(
                          selectedPlan
                        )}
                      </p>
                    </div>
                  </div>

                  <ul className="mt-5 space-y-3 text-sm text-storefront-text">
                    {getPlanBenefits(
                      selectedPlan
                    ).map(
                      (
                        benefit
                      ) => (
                        <li
                          key={
                            benefit
                          }
                          className="flex items-start gap-2"
                        >
                          <Check
                            size={
                              16
                            }
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />

                          <span>
                            {
                              benefit
                            }
                          </span>
                        </li>
                      )
                    )}
                  </ul>

                  {selectedPlan
                    .termsAndConditions ? (
                    <div className="mt-5 border-t border-storefront pt-4">
                      <p className="text-xs font-black text-storefront-text">
                        Terms & conditions
                      </p>

                      <p className="mt-2 whitespace-pre-line text-xs leading-5 text-storefront-muted">
                        {
                          selectedPlan
                            .termsAndConditions
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {/* FOOTER */}

        <footer className="border-t border-storefront bg-white p-5">
          {selectedPlan ? (
            <>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-storefront-muted">
                    Protection total
                  </p>

                  <p className="text-2xl font-black text-storefront-text">
                    {money(
                      totalProtectionPrice,
                      displayCurrency
                    )}
                  </p>
                </div>

                <div className="text-right">
                  {selectedPlan.pricingMethod ===
                    "PERCENTAGE" &&
                  selectedPlan.percentage !==
                    null ? (
                    <p className="text-[11px] leading-4 text-storefront-muted">
                      {
                        selectedPlan
                          .percentage
                      }
                      % ×{" "}
                      {
                        safeQuantity
                      }{" "}
                      item(s)
                    </p>
                  ) : (
                    <p className="text-[11px] leading-4 text-storefront-muted">
                      {money(
                        resolvedUnitPrice,
                        displayCurrency
                      )}{" "}
                      ×{" "}
                      {
                        safeQuantity
                      }{" "}
                      item(s)
                    </p>
                  )}

                  <p className="mt-1 text-[10px] uppercase tracking-wide text-storefront-muted">
                    {
                      selectedPlan
                        .pricingSource
                    }{" "}
                    pricing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={
                  handleAddProtection
                }
                className="h-14 w-full rounded-xl bg-storefront-primary px-5 text-base font-black text-white transition hover:opacity-90"
              >
                Add protection & continue
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={
              onContinueWithoutWarranty
            }
            disabled={
              isLoading
            }
            className={[
              selectedPlan
                ? "mt-3"
                : "",
              "h-12 w-full rounded-xl border border-storefront bg-white text-sm font-black text-storefront-text transition hover:bg-storefront-secondary disabled:cursor-not-allowed disabled:opacity-50",
            ].join(
              " "
            )}
          >
            No thanks, continue to cart
          </button>
        </footer>
      </aside>
    </div>
  );
}