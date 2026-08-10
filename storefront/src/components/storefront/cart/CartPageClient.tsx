"use client";

import Link from "next/link";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import CartItemRow from "./CartItemRow";
import CartRecommendations from "./CartRecommendations";
import CartSummary from "./CartSummary";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearCart,
  selectCartHydrated,
  selectCartItemCount,
  selectCartItems,
  selectCartSubtotal,
} from "@/store/slices/cartSlice";

type FulfilmentMethod = "DELIVERY" | "PICKUP";

export default function CartPageClient() {
  const dispatch = useAppDispatch();
  const hydrated = useAppSelector(selectCartHydrated);
  const items = useAppSelector(selectCartItems);
  const itemCount = useAppSelector(selectCartItemCount);
  const subtotal = useAppSelector(selectCartSubtotal);

  const [fulfilmentMethod, setFulfilmentMethod] = useState<FulfilmentMethod>("DELIVERY");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [showOffers, setShowOffers] = useState(false);

  const discountAmount = useMemo(() => {
    if (appliedCoupon === "WELCOME50") return Math.min(50, subtotal);
    if (appliedCoupon === "MYSHOPS10") return Math.min(subtotal * 0.1, subtotal);
    return 0;
  }, [appliedCoupon, subtotal]);

  const shippingFee = fulfilmentMethod === "PICKUP" || appliedCoupon === "FREESHIP" ? 0 : 0;

  const applyCoupon = (code = couponCode) => {
    const normalized = code.trim().toUpperCase();
    if (!["WELCOME50", "MYSHOPS10", "FREESHIP"].includes(normalized)) {
      setAppliedCoupon(null);
      return;
    }
    setCouponCode(normalized);
    setAppliedCoupon(normalized);
    setShowOffers(false);
  };

  if (!hydrated) {
    return <div className="py-24 text-center text-sm text-storefront-muted">Loading cart…</div>;
  }

  if (!items.length) {
    return (
      <div className="py-20">
        <div className="mx-auto max-w-xl rounded-[22px] border border-storefront bg-storefront-surface p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
            <ShoppingBag size={28} />
          </div>
          <h1 className="mt-5 text-2xl font-black text-storefront-text">Your cart is empty</h1>
          <p className="mt-3 text-sm leading-6 text-storefront-muted">Browse products and add your favourite items to continue.</p>
          <Link href="/" className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white">Continue shopping</Link>
        </div>
      </div>
    );
  }

  const currencyCode = items[0]?.currencyCode || "AED";
  const mobileTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  return (
    <div className="pb-24 pt-5 md:pb-10">
      <section className="mb-5 overflow-hidden rounded-2xl bg-gradient-to-r from-[#EAF8F6] via-[#F7FBFA] to-[#E2F1EF] px-5 py-3">
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-2 text-center">
          <span className="text-2xl font-black lowercase text-storefront-text">tamara</span>
          <span className="text-base font-black text-storefront-text sm:text-xl">Pay in 6 months at <span className="text-emerald-600">0% interest</span></span>
          <span className="text-xs text-storefront-muted">Processing fee may apply</span>
        </div>
      </section>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-storefront-primary">Shopping cart</p>
          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">Your cart</h1>
          <p className="mt-2 text-sm text-storefront-muted">{itemCount} {itemCount === 1 ? "item" : "items"}</p>
        </div>
        <button type="button" onClick={() => dispatch(clearCart())} className="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-red-600 hover:bg-red-50">
          <Trash2 size={15} /> Clear cart
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <div className="space-y-5">
          {items.map((item) => <CartItemRow key={item.key} item={item} />)}

          <section className="rounded-[22px] border border-storefront bg-white p-5">
            <p className="text-base font-black text-storefront-text">Extra add-on services</p>
            <button type="button" className="mt-4 flex min-h-14 w-full items-center justify-between rounded-xl border border-storefront px-4 text-left">
              <span>
                <span className="block text-sm font-black text-storefront-text">Protect with extended warranty</span>
                <span className="mt-1 block text-xs text-storefront-muted">Add extra protection for your device.</span>
              </span>
              <span className="text-sm font-black text-storefront-primary">View plans</span>
            </button>
          </section>
        </div>

        <div className="space-y-5">
          <CartSummary
            fulfilmentMethod={fulfilmentMethod}
            onFulfilmentChange={setFulfilmentMethod}
            discountAmount={discountAmount}
            shippingFee={shippingFee}
          />

          <section className="rounded-[22px] border border-storefront bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-storefront-text">Got a coupon?</h2>
            <div className="mt-4 flex overflow-hidden rounded-xl bg-slate-100">
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon code" className="h-14 min-w-0 flex-1 bg-transparent px-4 text-sm font-bold uppercase outline-none" />
              <button type="button" onClick={() => applyCoupon()} className="px-5 text-sm font-black text-storefront-primary">APPLY</button>
            </div>

            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                <span className="text-xs font-black text-emerald-800">{appliedCoupon} applied</span>
                <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs font-black text-red-600">Remove</button>
              </div>
            ) : null}

            <button type="button" onClick={() => setShowOffers((v) => !v)} className="mt-5 flex w-full items-center justify-between text-left">
              <span className="text-sm font-black text-storefront-text">View available offers</span><span className="text-lg">›</span>
            </button>

            {showOffers ? (
              <div className="mt-4 space-y-2">
                {[
                  { code: "MYSHOPS10", text: "Extra 10% off" },
                  { code: "WELCOME50", text: "Extra AED 50 off" },
                  { code: "FREESHIP", text: "Free delivery" },
                ].map((offer) => (
                  <button key={offer.code} type="button" onClick={() => applyCoupon(offer.code)} className="flex w-full items-center justify-between rounded-xl border border-dashed border-storefront-primary px-4 py-3 text-left">
                    <span><span className="block text-xs font-black text-storefront-text">{offer.code}</span><span className="mt-1 block text-[11px] text-storefront-muted">{offer.text}</span></span>
                    <span className="text-xs font-black text-storefront-primary">Apply</span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#9DDCE0] to-[#6DBEC5] p-6 text-storefront-text">
            <p className="text-2xl font-black">15% cashback +</p>
            <p className="text-3xl font-black">Free Delivery</p>
            <p className="mt-3 text-sm">On selected express items on your first order.</p>
            <span className="mt-4 inline-flex rounded-full bg-storefront-text px-4 py-2 text-xs font-black text-white">Use code: FIRST15</span>
          </section>
        </div>
      </div>
      <CartRecommendations
        productSlug={
          items[0]
            ?.productSlug ||
          null
        }
      />

      <section className="mt-8 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#4BAAB4] to-[#B8EEF0] px-7 py-8 sm:px-10">
        <div className="max-w-xl">
          <h2 className="text-3xl font-black text-white sm:text-4xl">Upgrade Today</h2>
          <p className="mt-3 text-base leading-7 text-white/95 sm:text-xl">Get your new device delivered fast across the UAE.</p>
          <Link href="/" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border border-white px-5 text-sm font-black text-white">Shop now</Link>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-storefront bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div><p className="text-[10px] uppercase tracking-wide text-storefront-muted">Cart total</p><p className="text-base font-black text-storefront-text">{new Intl.NumberFormat("en-AE", { style: "currency", currency: currencyCode }).format(mobileTotal)}</p></div>
          <Link href="/checkout" className="flex h-12 min-w-40 items-center justify-center rounded-xl bg-storefront-primary px-5 text-sm font-black text-white">Checkout</Link>
        </div>
      </div>
    </div>
  );
}
