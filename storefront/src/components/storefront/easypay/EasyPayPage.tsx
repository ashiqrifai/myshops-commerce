"use client";

import {
  BadgeCheck,
  Banknote,
  CalendarDays,
  Landmark,
  LockKeyhole,
  Percent,
  ShoppingBag,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const stores = [
  ["My Shops Outlet Mall UAE", "Route 66 - Dubai Outlet Mall - Dubai"],
  ["My Shops Souq Al Jami' UAE", "Sheikh Zayed Grand Mosque Road, Abu Dhabi"],
  ["My Shops Wafi Mall UAE", "Wafi Mall at Wafi City - 1st Floor - Oud Metha"],
  ["My Shops City Centre Deira UAE", "8th St - Port Saeed - Deira - Dubai"],
  ["My Shops Crescent Mall Azerbaijan", "68 Neftchilar Ave, Azerbaijan"],
  ["My Shops Sumqayit Azerbaijan", "küçəsi 2 Uzeyir Hajibayov, Sumqayit, Azerbaijan"],
  ["My Shops Bülbül Street Azerbaijan", "38c Bulbul Ave, Baku, Azerbaijan"],
  ["My Shops Ganjlik Mall Azerbaijan", "38c Bulbul Ave, Baku, Azerbaijan"],
  ["My Shops Podium Mall Azerbaijan", "88q Cəmşid Naxçıvanski, Bakı, Azerbaijan"],
] as const;

function SectionCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#effbfc] text-[#1597A1]">{icon}</span>
        <h2 className="text-xl font-black text-[#171717] sm:text-2xl">{title}</h2>
      </div>
      <div className="mt-5 text-[15px] leading-7 text-[#555]">{children}</div>
    </section>
  );
}

export default function EasyPayPage() {
  return (
    <main className="bg-[#f6f7f8]">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <section className="overflow-hidden rounded-[24px] border border-[#e5e7eb] bg-white shadow-sm">
          <div className="grid items-stretch lg:grid-cols-[1.05fr_0.95fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#effbfc] px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-[#1597A1]">
                <Percent size={15} /> 0% interest
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight text-[#171717] sm:text-5xl">EasyPay Installments From MyShops</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[#666] sm:text-lg">The installment service is available for all My Shops products priced at AED 1,000 or more.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-black text-white transition hover:bg-[#252525]">SHOP NOW</Link>
                <span className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#d9dee3] bg-white px-4 text-sm font-bold text-[#333]"><CalendarDays size={17}/>Up to 12 months</span>
              </div>
            </div>
            <div className="relative min-h-[280px] bg-[#eef2f4] sm:min-h-[360px] lg:min-h-[430px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://myshops.ae/wp-content/uploads/2026/02/EEP-1.jpg.avif" alt="MyShops EasyPay" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-[#111] p-6 text-white sm:p-8">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8ee1e6]">EASYPAY Affordable</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-3xl font-black sm:text-4xl">Up To 12 months installments.</h2>
            <p className="max-w-xl text-sm leading-6 text-white/70 sm:text-right">Select up to 12 months plan as per your wish. Flexible installment options are subject to approval.</p>
          </div>
        </section>

        <section className="mt-7">
          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#1597A1]">MyShops Easy Installment Purchase Service</p>
          <h2 className="mt-2 text-2xl font-black text-[#171717] sm:text-3xl">Buy Now, Pay Later – Simple, Flexible & Transparent</h2>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <SectionCard icon={<UserRoundCheck size={20}/>} title="Eligibility Criteria">
              <ul className="space-y-2"><li>• UAE National</li><li>• Employed with UAE Government / Semi-Government entity</li><li>• Valid Emirates ID</li><li>• Latest salary certificate & proof of employment</li></ul>
            </SectionCard>
            <SectionCard icon={<Banknote size={20}/>} title="Installment Terms (Subject to Approval)">
              <ul className="space-y-2"><li>• Minimum product value: AED 1,000</li><li>• Discounted & promotional items excluded</li><li>• 25% down payment at product collection</li><li>• Down payment may be reduced or waived in select cases</li><li>• Balance payable in up to 11 equal monthly installments</li><li>• Final tenure confirmed upon approval</li></ul>
            </SectionCard>
            <SectionCard icon={<LockKeyhole size={20}/>} title="Payment & Security">
              <ul className="space-y-2"><li>• Post-dated cheques required (as per approved tenure)</li><li>• All cheques to be submitted before product collection</li></ul>
            </SectionCard>
            <SectionCard icon={<ShoppingBag size={20}/>} title="How It Works">
              <ol className="space-y-2"><li>1. Select your product at MyShops</li><li>2. Submit installment request with documents</li><li>3. Application review & approval</li><li>4. Sign agreement & submit cheques</li><li>5. Collect your product</li></ol>
            </SectionCard>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={22} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-lg font-black text-amber-950">Important Notes</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950/80"><li>• Approval subject to internal policies</li><li>• Missed payments remain payable as per agreement</li><li>• Repeated non-payment may lead to legal action (UAE law)</li><li>• Ownership transfers after full settlement</li><li>• Manufacturer warranty applies (where applicable)</li></ul>
              <p className="mt-4 text-sm font-semibold leading-6 text-amber-950">Terms & conditions apply. MyShops reserves the right to approve, reject, or modify installment terms without prior notice.</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-center gap-3"><Landmark size={22} className="text-[#1597A1]"/><h2 className="text-2xl font-black text-[#171717]">Visit a MyShops Store</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map(([name, address]) => (
              <article key={`${name}-${address}`} className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3"><BadgeCheck size={18} className="mt-1 shrink-0 text-[#1597A1]"/><div><h3 className="font-black text-[#222]">{name}</h3><p className="mt-2 text-sm leading-6 text-[#6b7280]">{address}</p></div></div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
