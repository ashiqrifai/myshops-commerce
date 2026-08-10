"use client";

import Link from "next/link";
import { BadgeCheck, Clock3, ImageIcon, Minus, Plus, Trash2, Truck } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { decrementItem, incrementItem, removeItem, setItemQuantity } from "@/store/slices/cartSlice";
import type { CartItem } from "@/store/slices/cartSlice";

const money = (value: number, currencyCode: string) => new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: currencyCode || "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function CartItemRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const compareAtTotal = item.compareAtPrice ? item.compareAtPrice * item.quantity : null;
  const discountPercent = item.compareAtPrice && item.compareAtPrice > item.unitPrice
    ? Math.round(((item.compareAtPrice - item.unitPrice) / item.compareAtPrice) * 100)
    : null;

  return (
    <article className="rounded-[22px] border border-storefront bg-white p-5 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[170px_minmax(0,1fr)_180px]">
        <div>
          <Link href={`/products/${item.productSlug}`} className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-storefront-secondary/35">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-contain p-4" /> : <ImageIcon size={34} className="text-storefront-muted" />}
          </Link>
          <div className="mt-4 flex h-11 items-center rounded-xl border border-storefront bg-white">
            <button type="button" onClick={() => dispatch(decrementItem(item.key))} className="flex h-full w-11 items-center justify-center" aria-label="Decrease quantity"><Minus size={15} /></button>
            <input type="number" min={1} max={999} value={item.quantity} onChange={(e) => dispatch(setItemQuantity({ key: item.key, quantity: Number(e.target.value) }))} className="min-w-0 flex-1 border-0 bg-transparent text-center text-sm font-black outline-none" />
            <button type="button" onClick={() => dispatch(incrementItem(item.key))} className="flex h-full w-11 items-center justify-center" aria-label="Increase quantity"><Plus size={15} /></button>
          </div>
        </div>

        <div className="min-w-0">
          <Link href={`/products/${item.productSlug}`} className="text-lg font-black leading-7 text-storefront-text hover:text-storefront-primary">{item.productName}</Link>
          {item.selectedAttributes.length ? (
            <div className="mt-3 inline-flex flex-wrap gap-x-2 gap-y-1 rounded-lg bg-storefront-secondary px-3 py-2 text-xs font-bold text-storefront-text">
              {item.selectedAttributes.map((attribute, index) => (
                <span key={attribute.attributeId}>{index > 0 ? <span className="mr-2 text-storefront-muted">•</span> : null}{attribute.attributeName}: {attribute.optionLabel}</span>
              ))}
            </div>
          ) : null}

          {item.extendedWarranty ? (
            <div className="mt-4 rounded-xl border border-storefront-primary/40 bg-storefront-secondary/55 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <BadgeCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-storefront-primary"
                  />

                  <div className="min-w-0">
                    <p className="text-sm font-black text-storefront-text">
                      {item.extendedWarranty
                        .periodYears}{" "}
                      Year Extended Warranty
                    </p>

                    <p className="mt-1 text-xs leading-5 text-storefront-muted">
                      {item.extendedWarranty
                        .percentage}
                      % of product price ×{" "}
                      {item.quantity}{" "}
                      {item.quantity === 1
                        ? "item"
                        : "items"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-black text-storefront-text">
                    {money(
                      item.extendedWarranty
                        .unitPrice *
                        item.quantity,
                      item.extendedWarranty
                        .currencyCode ||
                        item.currencyCode
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      dispatch(
                        setItemExtendedWarranty({
                          key:
                            item.key,

                          warranty:
                            null,
                        })
                      )
                    }
                    className="mt-1 text-[11px] font-black text-red-600"
                  >
                    Remove warranty
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-storefront-muted"><Truck size={17} className="text-storefront-primary" />Free shipping</div>
            <div className="flex items-center gap-2 text-sm font-bold text-storefront-muted"><BadgeCheck size={17} className="text-storefront-primary" />Warranty information available</div>
            <div className="flex items-center gap-2 text-sm font-bold text-storefront-muted"><Clock3 size={17} className="text-storefront-primary" />Delivery estimate confirmed at checkout</div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {["Extra AED 200 OFF", "Extra 15% off", "Extra 10% off"].map((offer) => <span key={offer} className="rounded-xl border border-dashed border-storefront-primary px-3 py-2 text-xs font-black text-storefront-text">{offer}</span>)}
          </div>

          <button type="button" onClick={() => dispatch(removeItem(item.key))} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={15} />Remove</button>
        </div>

        <div className="text-left lg:text-right">
          <p className="text-2xl font-black text-storefront-text">{money(item.unitPrice * item.quantity, item.currencyCode)}</p>
          {discountPercent ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="text-sm font-black text-emerald-600">{discountPercent}% OFF</span>
              {compareAtTotal ? <span className="text-sm text-storefront-muted line-through">{money(compareAtTotal, item.currencyCode)}</span> : null}
            </div>
          ) : null}
          <p className="mt-2 text-xs text-storefront-muted">{money(item.unitPrice, item.currencyCode)} each</p>
        </div>
      </div>
    </article>
  );
}
