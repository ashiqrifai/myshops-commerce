"use client";

import {
  CreditCard,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

interface NetworkInternationalCardProps {
  amount: number;
  currencyCode: string;
}

export default function NetworkInternationalCard({
  amount,
  currencyCode,
}: NetworkInternationalCardProps) {
  return (
    <div
      className={[
        "rounded-xl",
        "border",
        "border-storefront-border-light",
        "bg-[#FAFAFA]",
        "p-4",
        "sm:p-5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "flex",
            "h-10",
            "w-10",
            "shrink-0",
            "items-center",
            "justify-center",
            "rounded-full",
            "border",
            "border-storefront-border-light",
            "bg-white",
            "text-emerald-700",
          ].join(" ")}
        >
          <ShieldCheck
            size={18}
            strokeWidth={1.8}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold text-storefront-text">
              Secure card payment
            </p>

            <span
              className={[
                "inline-flex",
                "items-center",
                "gap-1",
                "rounded-full",
                "bg-emerald-50",
                "px-2",
                "py-1",
                "text-[10px]",
                "font-bold",
                "text-emerald-700",
              ].join(" ")}
            >
              <ShieldCheck
                size={11}
              />

              Secure
            </span>
          </div>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-storefront-muted">
            After you click Pay, you will be redirected to
            Network International&apos;s secure payment page
            to enter your card details and complete any
            required authentication.
          </p>

          <div
            className={[
              "mt-4",
              "flex",
              "flex-wrap",
              "items-center",
              "justify-between",
              "gap-3",
              "rounded-xl",
              "border",
              "border-storefront-border-light",
              "bg-white",
              "px-4",
              "py-3",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <CreditCard
                size={17}
                strokeWidth={1.8}
                className="text-storefront-muted"
              />

              <span className="text-xs font-medium text-storefront-muted">
                Amount to pay
              </span>
            </div>

            <StorefrontMoney
              amount={amount}
              currencyCode={
                currencyCode ||
                "AED"
              }
              className="text-sm font-bold text-storefront-text"
            />
          </div>

          <div className="mt-4 flex items-center gap-2 text-[11px] leading-5 text-storefront-muted">
            <ExternalLink
              size={13}
              strokeWidth={1.8}
              className="shrink-0"
            />

            <span>
              Payment details are entered directly on
              Network International&apos;s hosted page and
              are not entered or stored on MyShops.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}