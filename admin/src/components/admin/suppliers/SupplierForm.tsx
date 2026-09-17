"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import type { Supplier, SupplierFormValues } from "@/types/supplier";

interface Props {
  supplier?: Supplier | null;
  submitting: boolean;
  submitLabel?: string;
  onSubmit: (values: SupplierFormValues) => Promise<void>;
}

export default function SupplierForm({ supplier, submitting, submitLabel = "Save supplier", onSubmit }: Props) {
  const [values, setValues] = useState<SupplierFormValues>({
    name: "", code: "", contactPerson: "", email: "", phone: "", websiteUrl: "", notes: "", isActive: true, sortOrder: 0,
  });

  useEffect(() => {
    if (!supplier) return;
    setValues({
      name: supplier.name,
      code: supplier.code,
      contactPerson: supplier.contactPerson || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      websiteUrl: supplier.websiteUrl || "",
      notes: supplier.notes || "",
      isActive: supplier.isActive,
      sortOrder: supplier.sortOrder,
    });
  }, [supplier]);

  const set = <K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      ...values,
      name: values.name.trim(),
      code: values.code?.trim() || undefined,
      contactPerson: values.contactPerson?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      websiteUrl: values.websiteUrl?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
      sortOrder: Number(values.sortOrder || 0),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#202223]">Supplier details</h2>
        <p className="mt-1 text-sm text-[#6d7175]">Use this supplier for products delivered directly to customers.</p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Supplier name" required><input className="admin-input" required value={values.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Supplier code" hint="Leave blank to auto-generate."><input className="admin-input" value={values.code || ""} onChange={(e) => set("code", e.target.value)} /></Field>
          <Field label="Contact person"><input className="admin-input" value={values.contactPerson || ""} onChange={(e) => set("contactPerson", e.target.value)} /></Field>
          <Field label="Phone"><input className="admin-input" value={values.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><input type="email" className="admin-input" value={values.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Website"><input type="url" className="admin-input" placeholder="https://..." value={values.websiteUrl || ""} onChange={(e) => set("websiteUrl", e.target.value)} /></Field>
          <Field label="Sort order"><input type="number" min={0} className="admin-input" value={values.sortOrder ?? 0} onChange={(e) => set("sortOrder", Number(e.target.value || 0))} /></Field>
          <Field label="Status"><label className="flex h-10 items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-3"><input type="checkbox" checked={values.isActive !== false} onChange={(e) => set("isActive", e.target.checked)} /><span className="text-sm font-medium">Active supplier</span></label></Field>
        </div>

        <div className="mt-5"><Field label="Notes"><textarea className="admin-input min-h-28 resize-y py-3" value={values.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field></div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting || !values.name.trim()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50">
          {submitting ? <LoaderCircle size={17} className="animate-spin" /> : <Save size={17} />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-semibold text-[#202223]">{label}{required ? <span className="text-red-600"> *</span> : null}</span>{hint ? <span className="mt-1 block text-xs text-[#6d7175]">{hint}</span> : null}<div className="mt-2">{children}</div></label>;
}
