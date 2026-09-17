"use client";

import { Check, Gift, ShieldCheck } from "lucide-react";
import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";
import type {
  CartBundleSelection,
  PublicBundlePromotion,
  PublicBundleSelectionConfig,
} from "@/types/bundlePromotion";

const snapshot = (
  bundle: PublicBundlePromotion,
  selectionQuantity = 1
): CartBundleSelection => ({
  bundlePromotionId: bundle.id,
  selectionQuantity,
  code: bundle.code,
  name: bundle.name,
  description: bundle.description || null,
  priceMode: bundle.priceMode,
  priceAmount: bundle.priceAmount == null ? null : Number(bundle.priceAmount),
  currencyCode: bundle.currencyCode || "AED",
  badgeText: bundle.badgeText || null,
  items: (bundle.items || []).map((item) => ({
    id: item.id,
    itemType: item.itemType,
    label: item.label,
    description: item.description || null,
    quantity: Number(item.quantity || 1),
    productId: item.productId || null,
    productVariantId: item.productVariantId || null,
    protectionSchemeId: item.protectionSchemeId || null,
    protectionSchemeCode: item.protectionScheme?.code || null,
    protectionSchemeName: item.protectionScheme?.name || null,
  })),
});

export default function BundlePromotionSelector({
  config,
  quantity,
  value,
  onChange,
}: {
  config: PublicBundleSelectionConfig | null | undefined;
  quantity: number;
  value: CartBundleSelection[];
  onChange: (value: CartBundleSelection[]) => void;
}) {
  if (!config?.bundles?.length) return null;

  const selectedIds = new Set(value.map((x) => x.bundlePromotionId));

  const toggle = (bundle: PublicBundlePromotion) => {
    if (selectedIds.has(bundle.id)) {
      onChange(value.filter((x) => x.bundlePromotionId !== bundle.id));
      return;
    }

    if (bundle.priceMode === "FIXED_TOTAL") {
      onChange([snapshot(bundle, Math.max(1, quantity))]);
      return;
    }

    if (value.some((x) => x.priceMode === "FIXED_TOTAL")) {
      onChange([snapshot(bundle)]);
      return;
    }

    const max = Math.max(
      1,
      Number(config.maxBundleSelectionsPerUnit || 1) * Math.max(1, quantity)
    );
    const used = value.reduce((n, x) => n + Number(x.selectionQuantity || 1), 0);
    if (used >= max) return;

    onChange([...value, snapshot(bundle)]);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2">
        <Gift size={20} className="text-storefront-text" />
        <p className="text-base font-black text-storefront-text">Bundle offers</p>
      </div>
      <p className="mt-1 text-[12px] text-storefront-muted">
        {config.bundlesOptional
          ? "Choose an optional promotional bundle."
          : "Choose a promotional bundle."}
      </p>

      <div className="mt-4 space-y-2">
        {config.bundles
          .slice(0, Math.max(1, Number(config.maxBundlesDisplayed || config.bundles.length)))
          .map((bundle) => {
            const selected = selectedIds.has(bundle.id);
            return (
              <button
                key={bundle.id}
                type="button"
                onClick={() => toggle(bundle)}
                className={[
                  "w-full rounded-xl border px-3 py-3 text-left transition",
                  selected
                    ? "border-storefront-primary bg-storefront-secondary/45"
                    : "border-[#d9dde3] bg-white hover:border-[#c5cbd2]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={[
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-storefront-primary bg-storefront-primary text-white"
                        : "border-[#d9dde3] text-transparent",
                    ].join(" ")}
                  >
                    <Check size={12} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-storefront-text">{bundle.name}</p>
                      <span className="text-sm font-black text-storefront-text">
                        {bundle.priceMode === "FREE" ? (
                          "FREE"
                        ) : bundle.priceMode === "FIXED_TOTAL" &&
                          bundle.priceAmount != null ? (
                          <>
                            <StorefrontMoney
                              amount={Number(bundle.priceAmount)}
                              currencyCode={bundle.currencyCode || "AED"}
                            />{" "}
                            total
                          </>
                        ) : (
                          <>
                            +{" "}
                            <StorefrontMoney
                              amount={Number(bundle.priceAmount || 0)}
                              currencyCode={bundle.currencyCode || "AED"}
                            />
                          </>
                        )}
                      </span>
                    </div>

                    {bundle.description ? (
                      <p className="mt-1 text-xs text-storefront-muted">{bundle.description}</p>
                    ) : null}

                    <div className="mt-2 space-y-1">
                      {(bundle.items || []).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 text-xs text-storefront-muted"
                        >
                          {item.itemType === "PROTECTION_PLAN" ? (
                            <ShieldCheck size={14} />
                          ) : (
                            <Gift size={14} />
                          )}
                          <span>
                            {item.label}
                            {Number(item.quantity || 1) > 1
                              ? ` × ${Number(item.quantity)}`
                              : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
      </div>
    </div>
  );
}
