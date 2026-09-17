"use client";

import { ArrowLeft, Save, TicketPercent } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import ProductAssignmentPicker from "./ProductAssignmentPicker";
import type { GiftVoucherPromotionFormValues } from "@/types/giftVoucherPromotion";

const DEFAULT_VALUES: GiftVoucherPromotionFormValues = {
  code: "", name: "", description: "", discountType: "FIXED_AMOUNT", discountValue: "",
  fundingType: "EXTERNAL", fundingSource: "", currencyCode: "AED", channelCode: "WEBSITE",
  validFrom: "", validUntil: "", priority: "100", isActive: true, items: [],
};

const toLocalInput = (value: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export default function GiftVoucherPromotionForm({ title, subtitle, initialValues, isSaving = false, onSubmit, onCancel }: {
  title: string;
  subtitle: string;
  initialValues?: GiftVoucherPromotionFormValues;
  isSaving?: boolean;
  onSubmit: (values: GiftVoucherPromotionFormValues) => Promise<void>;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<GiftVoucherPromotionFormValues>(initialValues || DEFAULT_VALUES);

  useEffect(() => {
    if (initialValues) setValues({ ...initialValues, validFrom: toLocalInput(initialValues.validFrom), validUntil: toLocalInput(initialValues.validUntil) });
  }, [initialValues]);

  const setField = <K extends keyof GiftVoucherPromotionFormValues>(key: K, value: GiftVoucherPromotionFormValues[K]) => setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!values.name.trim() || !values.code.trim()) return window.alert("Code and name are required.");
    if (!(Number(values.discountValue) > 0)) return window.alert("Discount value must be greater than zero.");
    if (!values.validFrom || !values.validUntil) return window.alert("Valid from and valid until are required.");
    await onSubmit(values);
  };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <form onSubmit={submit} className="mx-auto w-full max-w-[1200px] px-5 py-6 md:px-8">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white"><TicketPercent size={19} /></div><div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-[#6d7175]">{subtitle}</p></div></div>
          <div className="flex gap-2"><button type="button" onClick={onCancel} disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold"><ArrowLeft size={16} /> Cancel</button><button type="submit" disabled={isSaving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> {isSaving ? "Saving..." : "Save promotion"}</button></div>
        </header>

        <div className="space-y-5">
          <Card title="Promotion details"><div className="grid gap-4 md:grid-cols-2"><Field label="Code"><input className="admin-input" value={values.code} onChange={(e) => setField("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]+/g, "_"))} placeholder="MACBOOK_GV_300" /></Field><Field label="Name"><input className="admin-input" value={values.name} onChange={(e) => setField("name", e.target.value)} /></Field><div className="md:col-span-2"><Field label="Description"><textarea className="admin-input min-h-28 py-3" rows={4} value={values.description} onChange={(e) => setField("description", e.target.value)} /></Field></div></div></Card>

          <Card title="Gift voucher value"><div className="grid gap-4 md:grid-cols-3"><Field label="Discount type"><select className="admin-input" value={values.discountType} onChange={(e) => setField("discountType", e.target.value as GiftVoucherPromotionFormValues["discountType"])}><option value="FIXED_AMOUNT">Fixed amount</option><option value="PERCENTAGE">Percentage</option></select></Field><Field label="Discount value"><input type="number" min="0" step="0.01" className="admin-input" value={values.discountValue} onChange={(e) => setField("discountValue", e.target.value)} /></Field><Field label="Currency"><select className="admin-input" value={values.currencyCode} onChange={(e) => setField("currencyCode", e.target.value)}><option value="AED">AED</option></select></Field></div></Card>

          <Card title="Funding"><div className="grid gap-4 md:grid-cols-2"><Field label="Funding type"><select className="admin-input" value={values.fundingType} onChange={(e) => setField("fundingType", e.target.value as GiftVoucherPromotionFormValues["fundingType"])}><option value="EXTERNAL">External</option><option value="INTERNAL">Internal</option></select></Field><Field label="Funding source"><input className="admin-input" value={values.fundingSource} onChange={(e) => setField("fundingSource", e.target.value)} placeholder="Apple" /></Field></div></Card>

          <Card title="Availability"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><Field label="Channel"><select className="admin-input" value={values.channelCode} onChange={(e) => setField("channelCode", e.target.value as GiftVoucherPromotionFormValues["channelCode"])}><option value="WEBSITE">Website</option><option value="ALL">All</option></select></Field><Field label="Priority"><input type="number" className="admin-input" value={values.priority} onChange={(e) => setField("priority", e.target.value)} /></Field><Field label="Valid from"><input type="datetime-local" className="admin-input" value={values.validFrom} onChange={(e) => setField("validFrom", e.target.value)} /></Field><Field label="Valid until"><input type="datetime-local" className="admin-input" value={values.validUntil} onChange={(e) => setField("validUntil", e.target.value)} /></Field></div><label className="mt-4 flex items-center gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] px-4 py-3"><input type="checkbox" checked={values.isActive} onChange={(e) => setField("isActive", e.target.checked)} /><span><span className="block text-sm font-semibold">Active</span><span className="block text-xs text-[#6d7175]">Only active promotions inside the validity window are applied.</span></span></label></Card>

          <Card title=""><ProductAssignmentPicker value={values.items} onChange={(items) => setField("items", items)} disabled={isSaving} /></Card>
        </div>
      </form>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">{title ? <h2 className="mb-4 text-base font-semibold">{title}</h2> : null}{children}</section>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2"><span className="text-sm font-medium text-[#303030]">{label}</span>{children}</label>; }
