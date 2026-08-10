"use client";

import {
  BadgeCheck,
  Check,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

export interface ExtendedWarrantySelection {
  code:
    | "EXTENDED_WARRANTY_1_YEAR"
    | "EXTENDED_WARRANTY_2_YEAR";

  periodYears:
    | 1
    | 2;

  percentage: number;
  unitPrice: number;
  totalPrice: number;
  currencyCode: string;
}

interface ExtendedWarrantyDrawerProps {
  open: boolean;
  onClose: () => void;

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

const money = (
  value: number,
  currencyCode: string
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style: "currency",
      currency:
        currencyCode ||
        "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(value);

export default function ExtendedWarrantyDrawer({
  open,
  onClose,
  onContinueWithoutWarranty,
  onWarrantyAdded,
  productName,
  imageUrl,
  productPrice,
  currencyCode,
  quantity,
}: ExtendedWarrantyDrawerProps) {
  const [
    selectedYears,
    setSelectedYears,
  ] =
    useState<1 | 2>(1);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedYears(1);

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [open]);

  const plans =
    useMemo(
      () => [
        {
          years: 1 as const,
          code:
            "EXTENDED_WARRANTY_1_YEAR" as const,
          percentage: 12,
          title:
            "1 Year Extended Warranty",
          subtitle:
            "Protection after the standard brand warranty",
        },
        {
          years: 2 as const,
          code:
            "EXTENDED_WARRANTY_2_YEAR" as const,
          percentage: 18,
          title:
            "2 Year Extended Warranty",
          subtitle:
            "Longer protection for extra peace of mind",
        },
      ],
      []
    );

  const selectedPlan =
    plans.find(
      (plan) =>
        plan.years ===
        selectedYears
    ) || plans[0];

  const unitWarrantyPrice =
    productPrice *
    (selectedPlan.percentage /
      100);

  const totalWarrantyPrice =
    unitWarrantyPrice *
    Math.max(1, quantity);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[110]">
      <button
        type="button"
        aria-label="Close warranty drawer"
        onClick={onClose}
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
      />

      <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[520px] flex-col bg-white shadow-2xl">
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
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-storefront-secondary"
          >
            <X size={21} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex gap-4 rounded-2xl bg-storefront-secondary/50 p-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={productName}
                  className="h-full w-full object-contain p-2"
                />
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="line-clamp-3 text-sm font-black leading-6 text-storefront-text">
                {productName}
              </p>

              <p className="mt-2 text-sm font-black text-storefront-primary">
                {money(
                  productPrice,
                  currencyCode
                )}
              </p>

              <p className="mt-1 text-xs text-storefront-muted">
                Quantity: {quantity}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-storefront-text">
                Extended warranty
              </h3>

              <p className="mt-1 text-xs text-storefront-muted">
                Genuine service and approved repair support.
              </p>
            </div>

            <ShieldCheck
              size={30}
              className="text-storefront-primary"
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const selected =
                selectedYears ===
                plan.years;

              const price =
                productPrice *
                (plan.percentage /
                  100);

              return (
                <button
                  key={plan.code}
                  type="button"
                  onClick={() =>
                    setSelectedYears(
                      plan.years
                    )
                  }
                  className={[
                    "relative rounded-2xl border p-4 text-left transition",
                    selected
                      ? "border-storefront-primary bg-storefront-secondary ring-1 ring-storefront-primary"
                      : "border-storefront bg-white hover:border-storefront-primary/60",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-md border",
                      selected
                        ? "border-storefront-primary bg-storefront-primary text-white"
                        : "border-storefront bg-white text-transparent",
                    ].join(" ")}
                  >
                    <Check size={15} />
                  </span>

                  <p className="pr-8 text-sm font-black text-storefront-text">
                    {plan.years} Year
                  </p>

                  <p className="mt-2 text-xl font-black text-storefront-text">
                    {money(
                      price,
                      currencyCode
                    )}
                  </p>

                  <p className="mt-1 text-[11px] font-bold text-storefront-primary">
                    {plan.percentage}% of product price
                  </p>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-2xl border border-storefront p-5">
            <div className="flex items-start gap-3">
              <BadgeCheck
                size={24}
                className="mt-0.5 shrink-0 text-storefront-primary"
              />

              <div>
                <p className="text-base font-black text-storefront-text">
                  {selectedPlan.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-storefront-muted">
                  {selectedPlan.subtitle}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-3 text-sm text-storefront-text">
              {[
                "Starts after the standard manufacturer warranty",
                "Electrical and mechanical failure protection",
                "Service support through approved channels",
                "Coverage is linked to the selected product variant",
              ].map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-start gap-2"
                >
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <footer className="border-t border-storefront bg-white p-5">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs text-storefront-muted">
                Warranty total
              </p>

              <p className="text-2xl font-black text-storefront-text">
                {money(
                  totalWarrantyPrice,
                  currencyCode
                )}
              </p>
            </div>

            <p className="text-right text-[11px] leading-4 text-storefront-muted">
              {selectedPlan.percentage}% × {quantity} item(s)
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onWarrantyAdded({
                code:
                  selectedPlan.code,
                periodYears:
                  selectedPlan.years,
                percentage:
                  selectedPlan.percentage,
                unitPrice:
                  unitWarrantyPrice,
                totalPrice:
                  totalWarrantyPrice,
                currencyCode,
              })
            }
            className="h-14 w-full rounded-xl bg-storefront-primary px-5 text-base font-black text-white"
          >
            Add warranty & continue
          </button>

          <button
            type="button"
            onClick={
              onContinueWithoutWarranty
            }
            className="mt-3 h-12 w-full rounded-xl border border-storefront bg-white text-sm font-black text-storefront-text"
          >
            No thanks, continue to cart
          </button>
        </footer>
      </aside>
    </div>
  );
}
