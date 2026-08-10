"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { selectCartItems, selectCartSubtotal, selectCartTax } from "@/store/slices/cartSlice";

type FulfilmentMethod = "DELIVERY" | "PICKUP";

interface CartSummaryProps {
  fulfilmentMethod: FulfilmentMethod;
  onFulfilmentChange: (value: FulfilmentMethod) => void;
  discountAmount: number;
  shippingFee: number;
}

const money = (value: number, currencyCode: string) => new Intl.NumberFormat("en-AE", {
  style: "currency",
  currency: currencyCode || "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
}).format(value);

export default function CartSummary({ fulfilmentMethod, onFulfilmentChange, discountAmount, shippingFee }: CartSummaryProps) {
  const items = useAppSelector(selectCartItems);
  const subtotal = useAppSelector(selectCartSubtotal);
  const tax = useAppSelector(selectCartTax);
  const currencyCode = items[0]?.currencyCode || "AED";
  const total = Math.max(0, subtotal + shippingFee - discountAmount);

  return (
    <aside className="rounded-[22px] border border-storefront bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-black text-storefront-text">Order summary</h2>
        <span className="text-sm font-black text-storefront-muted">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>

      <dl className="mt-6 space-y-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-storefront-text">Subtotal</dt><dd className="font-black text-storefront-text">{money(subtotal, currencyCode)}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-storefront-text">Shipping fee</dt><dd className="font-black text-emerald-600">{shippingFee > 0 ? money(shippingFee, currencyCode) : "FREE"}</dd></div>
        {discountAmount > 0 ? <div className="flex justify-between gap-4"><dt className="text-emerald-700">Discount</dt><dd className="font-black text-emerald-700">-{money(discountAmount, currencyCode)}</dd></div> : null}
        <div className="flex justify-between gap-4"><dt className="text-storefront-muted">VAT</dt><dd className="font-bold text-storefront-text">{tax > 0 ? money(tax, currencyCode) : "Included"}</dd></div>
      </dl>

      <div className="my-6 border-t border-storefront" />
      <div className="flex items-end justify-between gap-4"><span className="text-xl font-black text-storefront-text">Total</span><span className="text-2xl font-black text-storefront-text">{money(total, currencyCode)}</span></div>

      <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-storefront">
        <button type="button" onClick={() => onFulfilmentChange("DELIVERY")} className={["h-16 text-base font-black transition", fulfilmentMethod === "DELIVERY" ? "bg-storefront-primary text-white" : "bg-white text-storefront-text"].join(" ")}>Delivery</button>
        <button type="button" onClick={() => onFulfilmentChange("PICKUP")} className={["h-16 text-base font-black transition", fulfilmentMethod === "PICKUP" ? "bg-storefront-primary text-white" : "bg-white text-storefront-text"].join(" ")}>Pick-up</button>
      </div>

      <Link href="/checkout" className="mt-5 hidden h-14 w-full items-center justify-center rounded-xl bg-storefront-primary px-5 text-lg font-black text-white transition hover:opacity-90 md:flex">Checkout</Link>
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-storefront-muted"><LockKeyhole size={14} />Secure checkout</div>
    </aside>
  );
}
