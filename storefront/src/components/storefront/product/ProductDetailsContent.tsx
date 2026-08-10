"use client";

import { BadgeCheck, RotateCcw, ShieldCheck, Truck, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";
import type { PublicProductData } from "@/types/publicProduct";

const renderList = (value: unknown[]) => value.map((item) => {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const record = item as Record<string, unknown>;
    return String(record.label || record.name || record.value || record.text || "");
  }
  return "";
}).filter(Boolean);

type TabCode = "DESCRIPTION" | "SPECIFICATIONS" | "REVIEWS" | "SHIPPING";

export default function ProductDetailsContent({ data }: { data: PublicProductData }) {
  const { product } = data;
  const [activeTab, setActiveTab] = useState<TabCode>("DESCRIPTION");
  const features = renderList(product.features);
  const boxItems = renderList(product.whatsInTheBox);
  const heroImage = useMemo(() => product.gallery[1]?.mediaAsset?.publicUrl || product.gallery[0]?.mediaAsset?.publicUrl || null, [product.gallery]);

  const tabs = [
    ["DESCRIPTION", "Description"],
    ["SPECIFICATIONS", "Specifications"],
    ["REVIEWS", "Reviews (1,250)"],
    ["SHIPPING", "Shipping & Returns"],
  ] as const;

  return (
    <div className="mt-10 space-y-10">
      <section className="grid gap-5 bg-storefront-secondary/70 px-6 py-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [Truck, "Same Day Delivery", "Order before 2PM"],
          [WalletCards, "Secure Payments", "100% Protected"],
          [BadgeCheck, "100% Genuine Products", "Authorized Retailer"],
          [ShieldCheck, "Official Warranty", "Peace of Mind"],
          [RotateCcw, "Easy Returns", "Hassle Free Returns"],
        ].map(([Icon, title, text]) => (
          <div key={String(title)} className="flex items-center gap-3">
            <Icon size={34} className="shrink-0 text-storefront-primary" />
            <div><p className="text-sm font-black text-storefront-text">{title}</p><p className="text-xs text-storefront-muted">{text}</p></div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-[22px] bg-gradient-to-r from-[#39B7C1] to-[#0B5F69] text-white">
        <div className="grid min-h-[330px] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-8 sm:p-10">
            <h2 className="text-3xl font-black sm:text-4xl">Next-Level Performance.</h2>
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
              {(features.length ? features.slice(0, 6) : ["Pro Camera", "Smart Features", "Premium Build", "All-day Battery", "Fast Performance", "Vivid Display"]).map((feature) => (
                <div key={feature}><div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/80 text-xl font-black">✓</div><p className="mt-3 text-sm font-black">{feature}</p></div>
              ))}
            </div>
          </div>
          <div className="relative min-h-[280px] bg-black/10">{heroImage ? <img src={heroImage} alt={product.name} className="absolute inset-0 h-full w-full object-contain object-bottom" /> : null}</div>
        </div>
      </section>

      <section className="rounded-[22px] border border-storefront bg-white p-5 sm:p-8">
        <div className="flex flex-wrap gap-x-8 gap-y-3 border-b border-storefront">
          {tabs.map(([code, label]) => (
            <button key={code} type="button" onClick={() => setActiveTab(code)} className={`border-b-4 px-1 pb-4 text-base font-black ${activeTab === code ? "border-storefront-primary text-storefront-primary" : "border-transparent text-storefront-text"}`}>{label}</button>
          ))}
        </div>

        {activeTab === "DESCRIPTION" ? (
          <div className="grid gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="whitespace-pre-line text-sm leading-8 text-storefront-text sm:text-base">{product.description || "Product description is not available."}</div>
              {features.length ? <ul className="mt-6 space-y-3">{features.map((feature) => <li key={feature} className="text-sm font-semibold text-storefront-text">• {feature}</li>)}</ul> : null}
            </div>
            <div className="overflow-hidden rounded-2xl bg-slate-100">{heroImage ? <img src={heroImage} alt={product.name} className="h-full min-h-[320px] w-full object-contain" /> : null}</div>
          </div>
        ) : null}

        {activeTab === "SPECIFICATIONS" ? <dl className="divide-y divide-storefront py-4">{product.specifications.map((specification) => <div key={specification.id} className="grid gap-2 py-4 sm:grid-cols-[220px_1fr]"><dt className="text-sm font-black text-storefront-text">{specification.attribute?.name}</dt><dd className="text-sm text-storefront-muted">{specification.displayValue}</dd></div>)}</dl> : null}

        {activeTab === "REVIEWS" ? <div className="py-10 text-center"><p className="text-2xl font-black">4.9 out of 5</p><p className="mt-2 text-amber-500">★★★★★</p><p className="mt-3 text-sm text-storefront-muted">Reviews integration can be connected after the demo.</p></div> : null}

        {activeTab === "SHIPPING" ? <div className="grid gap-6 py-8 md:grid-cols-2"><div className="rounded-2xl bg-storefront-secondary p-5"><h3 className="text-lg font-black">Shipping</h3><p className="mt-3 text-sm leading-7 text-storefront-muted">Delivery options and charges are confirmed at checkout.</p></div><div className="rounded-2xl bg-storefront-secondary p-5"><h3 className="text-lg font-black">Returns</h3><p className="mt-3 text-sm leading-7 text-storefront-muted">Return eligibility depends on category, condition and seller policy.</p></div></div> : null}
      </section>

      {boxItems.length || product.warrantyText ? <div className="grid gap-6 lg:grid-cols-2">{boxItems.length ? <section className="rounded-[22px] border border-storefront bg-white p-6 sm:p-8"><h2 className="text-xl font-black">What&apos;s in the box</h2><ul className="mt-4 space-y-2 text-sm text-storefront-muted">{boxItems.map((item) => <li key={item}>• {item}</li>)}</ul></section> : null}{product.warrantyText ? <section className="rounded-[22px] border border-storefront bg-white p-6 sm:p-8"><h2 className="text-xl font-black">Warranty</h2><p className="mt-4 text-sm leading-7 text-storefront-muted">{product.warrantyText}</p></section> : null}</div> : null}

      {data.relatedProducts.length ? <section id="related-products"><div className="mb-6 flex items-end justify-between gap-4"><h2 className="text-3xl font-black">You May Also Like</h2><button type="button" className="text-sm font-black">View All⌄</button></div><div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">{data.relatedProducts.slice(0, 5).map((related) => <StorefrontProductCard key={related.id} product={related} />)}</div></section> : null}
    </div>
  );
}
