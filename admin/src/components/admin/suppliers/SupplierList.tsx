"use client";

import Link from "next/link";
import { ExternalLink, Pencil, Power, Trash2 } from "lucide-react";
import type { Supplier } from "@/types/supplier";

interface Props {
  suppliers: Supplier[];
  isChangingStatus: boolean;
  isDeleting: boolean;
  onStatusChange: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export default function SupplierList({ suppliers, isChangingStatus, isDeleting, onStatusChange, onDelete }: Props) {
  if (!suppliers.length) return <div className="flex min-h-[320px] items-center justify-center p-6 text-center"><div><h2 className="font-semibold">No suppliers found</h2><p className="mt-2 text-sm text-[#6d7175]">Create your first direct-delivery supplier.</p></div></div>;

  return <div className="overflow-x-auto"><table className="min-w-full divide-y divide-[#e1e3e5]"><thead className="bg-[#fafbfb]"><tr>
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">Supplier</th>
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">Contact</th>
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">Status</th>
    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">Sort</th>
    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">Actions</th>
  </tr></thead><tbody className="divide-y divide-[#e1e3e5] bg-white">
    {suppliers.map((supplier) => <tr key={supplier.id} className="hover:bg-[#fafbfb]">
      <td className="px-5 py-4"><Link href={`/admin/suppliers/${supplier.id}`} className="font-semibold hover:underline">{supplier.name}</Link><p className="mt-1 text-xs text-[#6d7175]">{supplier.code}</p>{supplier.websiteUrl ? <a href={supplier.websiteUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#005bd3]">Website <ExternalLink size={12}/></a> : null}</td>
      <td className="px-5 py-4 text-sm"><p>{supplier.contactPerson || "—"}</p><p className="mt-1 text-xs text-[#6d7175]">{supplier.email || supplier.phone || "No contact details"}</p></td>
      <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${supplier.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#f1f2f3] text-[#6d7175]"}`}>{supplier.isActive ? "Active" : "Inactive"}</span></td>
      <td className="px-5 py-4 text-sm text-[#6d7175]">{supplier.sortOrder}</td>
      <td className="px-5 py-4"><div className="flex justify-end gap-2"><Link href={`/admin/suppliers/${supplier.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white"><Pencil size={15}/></Link><button disabled={isChangingStatus} onClick={() => onStatusChange(supplier)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-white disabled:opacity-50"><Power size={15}/></button><button disabled={isDeleting} onClick={() => onDelete(supplier)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 disabled:opacity-50"><Trash2 size={15}/></button></div></td>
    </tr>)}
  </tbody></table></div>;
}
