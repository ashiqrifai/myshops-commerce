"use client";

import { useMemo } from "react";

import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Layers3,
  Star,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import type { PriceList } from "@/types/priceList";

interface PriceListSummaryProps {
  priceLists: PriceList[];
  isLoading?: boolean;
  totalItems?: number;
}

interface SummaryItem {
  key: string;
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  valueClassName?: string;
}

export default function PriceListSummary({
  priceLists,
  isLoading = false,
  totalItems,
}: PriceListSummaryProps) {
  const summaryItems = useMemo<SummaryItem[]>(() => {
    const now = Date.now();

    const activeCount = priceLists.filter(
      (priceList) => priceList.isActive
    ).length;

    const scheduledCount = priceLists.filter((priceList) => {
      if (!priceList.validFrom) {
        return false;
      }

      const validFromTime = new Date(priceList.validFrom).getTime();

      return (
        Number.isFinite(validFromTime) &&
        validFromTime > now &&
        priceList.isActive
      );
    }).length;

    const defaultCount = priceLists.filter(
      (priceList) => priceList.isDefault
    ).length;

    const currencyCount = new Set(
      priceLists
        .map((priceList) => priceList.currencyCode)
        .filter(Boolean)
    ).size;

    return [
      {
        key: "total",
        label: "Total price lists",
        value: totalItems ?? priceLists.length,
        description: "All configured pricing lists",
        icon: Layers3,
      },
      {
        key: "active",
        label: "Active",
        value: activeCount,
        description: "Available to the pricing engine",
        icon: CheckCircle2,
        valueClassName: "text-emerald-700",
      },
      {
        key: "default",
        label: "Default",
        value: defaultCount,
        description: "Fallback pricing configuration",
        icon: Star,
        valueClassName: "text-amber-700",
      },
      {
        key: "scheduled",
        label: "Scheduled",
        value: scheduledCount,
        description: "Configured for a future date",
        icon: CalendarClock,
        valueClassName: "text-blue-700",
      },
      {
        key: "currencies",
        label: "Currencies",
        value: currencyCount,
        description: "Currencies currently configured",
        icon: CircleDollarSign,
      },
    ];
  }, [priceLists, totalItems]);

  return (
    <section
      aria-label="Price list summary"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
    >
      {summaryItems.map((item) => (
        <SummaryCard
          key={item.key}
          item={item}
          isLoading={isLoading}
        />
      ))}
    </section>
  );
}

function SummaryCard({
  item,
  isLoading,
}: {
  item: SummaryItem;
  isLoading: boolean;
}) {
  const Icon = item.icon;

  return (
    <article className="rounded-xl border border-[#e1e3e5] bg-white p-4 shadow-sm transition hover:border-[#c9cccf] hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#6d7175]">
            {item.label}
          </p>

          {isLoading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-[#e9eaeb]" />
          ) : (
            <p
              className={[
                "mt-1 text-2xl font-bold tracking-tight text-[#202223]",
                item.valueClassName || "",
              ].join(" ")}
            >
              {formatNumber(item.value)}
            </p>
          )}
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3] text-[#45484c]">
          <Icon size={19} aria-hidden="true" />
        </div>
      </div>

      <p className="mt-3 truncate text-xs text-[#8c9196]">
        {item.description}
      </p>
    </article>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}