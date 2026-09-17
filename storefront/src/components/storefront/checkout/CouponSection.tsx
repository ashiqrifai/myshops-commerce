"use client";

import {
  CheckCircle2,
  Loader2,
  TicketPercent,
  XCircle,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  clearAppliedCoupon,
  selectAppliedCoupon,
  setAppliedCoupon,
} from "@/store/slices/cartSlice";

import {
  selectCustomer,
  selectCustomerAccessToken,
} from "@/store/slices/customerAuthSlice";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export interface ValidatedCoupon {
  code: string;

  name: string;

  discountType:
    | "PERCENTAGE"
    | "FIXED"
    | "FREE_SHIPPING";

  discountValue: number;

  merchandiseDiscount: number;

  deliveryDiscount: number;

  discountAmount: number;

  finalDeliveryAmount: number;
}

interface CouponValidateEnvelope {
  success: boolean;

  data?: {
    coupon:
      ValidatedCoupon;
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

interface CouponSectionProps {
  merchandiseTotal:
    number;

  deliveryAmount:
    number;

  currencyCode:
    string;
}

export default function CouponSection({
  merchandiseTotal,
  deliveryAmount,
  currencyCode,
}: CouponSectionProps) {
  const dispatch =
    useAppDispatch();

  const appliedCoupon =
    useAppSelector(
      selectAppliedCoupon
    );

  const customer =
    useAppSelector(
      selectCustomer
    );

  const accessToken =
    useAppSelector(
      selectCustomerAccessToken
    );

  const [
    code,
    setCode,
  ] =
    useState(
      appliedCoupon
        ?.code ||
        ""
    );

  const [
    message,
    setMessage,
  ] =
    useState<
      string | null
    >(
      null
    );

  const [
    isError,
    setIsError,
  ] =
    useState(
      false
    );

  const [
    isLoading,
    setIsLoading,
  ] =
    useState(
      false
    );

  useEffect(
    () => {
      setCode(
        appliedCoupon
          ?.code ||
          ""
      );
    },
    [
      appliedCoupon,
    ]
  );

  const applyCoupon =
    async () => {
      const normalized =
        code
          .trim()
          .toUpperCase();

      if (
        !normalized
      ) {
        setIsError(
          true
        );

        setMessage(
          "Enter a coupon code."
        );

        return;
      }

      try {
        setIsLoading(
          true
        );

        setIsError(
          false
        );

        setMessage(
          null
        );

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

        if (
          accessToken
        ) {
          headers.Authorization =
            `Bearer ${accessToken}`;
        }

        const response =
          await fetch(
            `${API_URL}/public/coupons/validate`,
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

                  code:
                    normalized,

                  currencyCode:
                    currencyCode ||
                    "AED",

                  merchandiseTotal,

                  deliveryAmount,

                  customerEmail:
                    customer
                      ?.email ||
                    null,
                }),
            }
          );

        let payload:
          CouponValidateEnvelope
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
          throw new Error(
            payload
              ?.error
              ?.message ||
              payload
                ?.message ||
              `Coupon validation failed. HTTP ${response.status}`
          );
        }

        if (
          !payload
            ?.success ||
          !payload
            .data
            ?.coupon
        ) {
          throw new Error(
            "The coupon API returned an invalid response."
          );
        }

        const coupon =
          payload
            .data
            .coupon;

        dispatch(
          setAppliedCoupon(
            coupon
          )
        );

        setCode(
          coupon.code
        );

        setIsError(
          false
        );

        setMessage(
          `${coupon.code} applied successfully.`
        );
      } catch (
        error
      ) {
        dispatch(
          clearAppliedCoupon()
        );

        setIsError(
          true
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : "Unable to apply coupon."
        );
      } finally {
        setIsLoading(
          false
        );
      }
    };

  const removeCoupon =
    () => {
      dispatch(
        clearAppliedCoupon()
      );

      setCode(
        ""
      );

      setMessage(
        "Coupon removed."
      );

      setIsError(
        false
      );
    };

  const label =
    appliedCoupon
      ? getCouponLabel(
          appliedCoupon,
          currencyCode
        )
      : "";

  return (
    <section>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
          <TicketPercent
            size={
              17
            }
          />
        </div>

        <div>
          <h3 className="text-sm font-black text-storefront-text">
            Coupon
          </h3>

          <p className="text-[11px] text-storefront-muted">
            Apply a promotional code.
          </p>
        </div>
      </div>

      {appliedCoupon ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2
              size={
                17
              }
              className="shrink-0 text-emerald-700"
            />

            <div className="min-w-0">
              <p className="truncate text-xs font-black text-emerald-900">
                {
                  appliedCoupon.code
                }
              </p>

              <p className="text-[11px] text-emerald-700">
                {
                  label
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={
              removeCoupon
            }
            className="text-xs font-black text-red-600"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <input
            value={
              code
            }
            onChange={(
              event
            ) => {
              setCode(
                event
                  .target
                  .value
              );

              setMessage(
                null
              );

              setIsError(
                false
              );
            }}
            onKeyDown={(
              event
            ) => {
              if (
                event.key ===
                "Enter"
              ) {
                event.preventDefault();

                void applyCoupon();
              }
            }}
            disabled={
              isLoading
            }
            placeholder="Enter coupon code"
            className="h-11 min-w-0 flex-1 rounded-xl border border-storefront bg-white px-3 text-sm font-bold uppercase tracking-wide text-storefront-text outline-none focus:border-storefront-primary disabled:cursor-wait disabled:opacity-60"
          />

          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={() =>
              void applyCoupon()
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-storefront-primary px-4 text-xs font-black text-white disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2
                  size={
                    14
                  }
                  className="animate-spin"
                />

                Checking
              </>
            ) : (
              "Apply"
            )}
          </button>
        </div>
      )}

      {message ? (
        <div
          className={[
            "mt-3 flex items-center gap-2 text-xs font-semibold",

            isError
              ? "text-red-600"
              : "text-emerald-700",
          ].join(
            " "
          )}
        >
          {isError ? (
            <XCircle
              size={
                14
              }
            />
          ) : (
            <CheckCircle2
              size={
                14
              }
            />
          )}

          {
            message
          }
        </div>
      ) : null}
    </section>
  );
}

function getCouponLabel(
  coupon:
    ValidatedCoupon,
  currencyCode:
    string
) {
  switch (
    coupon.discountType
  ) {
    case "PERCENTAGE":
      return `${coupon.discountValue}% off`;

    case "FIXED":
      return `${formatMoney(
        coupon.discountValue,
        currencyCode
      )} off`;

    case "FREE_SHIPPING":
      return "Free delivery";

    default:
      return coupon.name ||
        coupon.code;
  }
}

function formatMoney(
  value:
    number,
  currencyCode:
    string
) {
  return new Intl.NumberFormat(
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
    value
  );
}