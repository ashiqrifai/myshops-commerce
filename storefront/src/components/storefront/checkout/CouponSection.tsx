"use client";

import {
  CheckCircle2,
  TicketPercent,
  XCircle,
} from "lucide-react";

import {
  useState,
} from "react";

export type AppliedCoupon =
  | {
      code: "MYSHOPS10";
      type: "PERCENTAGE";
      value: 10;
      label: "10% off";
    }
  | {
      code: "WELCOME50";
      type: "FIXED";
      value: 50;
      label: "AED 50 off";
    }
  | {
      code: "FREESHIP";
      type: "FREE_SHIPPING";
      value: 0;
      label: "Free delivery";
    };

interface CouponSectionProps {
  appliedCoupon:
    | AppliedCoupon
    | null;

  onApply: (
    coupon:
      | AppliedCoupon
      | null
  ) => void;
}

const coupons:
  Record<
    string,
    AppliedCoupon
  > = {
    MYSHOPS10: {
      code:
        "MYSHOPS10",
      type:
        "PERCENTAGE",
      value: 10,
      label:
        "10% off",
    },

    WELCOME50: {
      code:
        "WELCOME50",
      type:
        "FIXED",
      value: 50,
      label:
        "AED 50 off",
    },

    FREESHIP: {
      code:
        "FREESHIP",
      type:
        "FREE_SHIPPING",
      value: 0,
      label:
        "Free delivery",
    },
  };

export default function CouponSection({
  appliedCoupon,
  onApply,
}: CouponSectionProps) {
  const [
    code,
    setCode,
  ] =
    useState(
      appliedCoupon?.code ||
        ""
    );

  const [
    message,
    setMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    isError,
    setIsError,
  ] =
    useState(false);

  const applyCoupon = () => {
    const normalized =
      code
        .trim()
        .toUpperCase();

    const coupon =
      coupons[
        normalized
      ];

    if (!coupon) {
      setIsError(true);

      setMessage(
        "This coupon code is not valid."
      );

      return;
    }

    onApply(coupon);

    setCode(
      coupon.code
    );

    setIsError(false);

    setMessage(
      `${coupon.code} applied successfully.`
    );
  };

  const removeCoupon =
    () => {
      onApply(null);

      setCode("");

      setMessage(
        "Coupon removed."
      );

      setIsError(false);
    };

  return (
    <section className="rounded-2xl border border-storefront bg-storefront-secondary/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-storefront-primary">
          <TicketPercent
            size={18}
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
              size={17}
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
                  appliedCoupon.label
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
            value={code}
            onChange={(
              event
            ) => {
              setCode(
                event.target.value
              );

              setMessage(
                null
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

                applyCoupon();
              }
            }}
            placeholder="Enter coupon code"
            className="h-11 min-w-0 flex-1 rounded-xl border border-storefront bg-white px-3 text-sm font-bold uppercase tracking-wide text-storefront-text outline-none focus:border-storefront-primary"
          />

          <button
            type="button"
            onClick={
              applyCoupon
            }
            className="h-11 rounded-xl bg-storefront-primary px-4 text-xs font-black text-white"
          >
            Apply
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
          ].join(" ")}
        >
          {isError ? (
            <XCircle
              size={14}
            />
          ) : (
            <CheckCircle2
              size={14}
            />
          )}

          {message}
        </div>
      ) : null}

      {!appliedCoupon ? (
        <p className="mt-3 text-[10px] leading-4 text-storefront-muted">
          Demo codes: MYSHOPS10, WELCOME50, FREESHIP
        </p>
      ) : null}
    </section>
  );
}
