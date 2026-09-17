"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CirclePlus, RefreshCw, Search, Truck } from "lucide-react";
import { toast } from "sonner";
import SupplierList from "@/components/admin/suppliers/SupplierList";
import { useChangeSupplierStatusMutation, useDeleteSupplierMutation, useGetSuppliersQuery } from "@/store/api/supplierApi";
import type { Supplier } from "@/types/supplier";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const queryParams = useMemo(() => ({ page: 1, pageSize: 200, search: search.trim() || undefined, isActive: statusFilter === "ALL" ? undefined : statusFilter === "ACTIVE", sortBy: "sortOrder" as const, sortDirection: "ASC" as const }), [search, statusFilter]);
  const { data, isLoading, isFetching, isError, refetch } = useGetSuppliersQuery(queryParams);
  const [changeSupplierStatus, { isLoading: isChangingStatus }] = useChangeSupplierStatusMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
  const suppliers = data?.data || [];
  const activeCount = suppliers.filter((x) => x.isActive).length;

  const handleStatusChange = async (supplier: Supplier) => {
    try { await changeSupplierStatus({ id: supplier.id, isActive: !supplier.isActive }).unwrap(); toast.success(supplier.isActive ? "Supplier deactivated successfully." : "Supplier activated successfully."); }
    catch (error) { toast.error(apiError(error, "Unable to change supplier status.")); }
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Delete "${supplier.name}"?\n\nSuppliers assigned to direct-delivery products cannot be deleted.`)) return;
    try { await deleteSupplier(supplier.id).unwrap(); toast.success("Supplier deleted successfully."); }
    catch (error) { toast.error(apiError(error, "Unable to delete supplier.")); }
  };

  return <main className="min-h-screen bg-[#f6f6f7]"><div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white"><Truck size={19}/></div><h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1></div><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d7175]">Manage suppliers used for direct-delivery products.</p></div><Link href="/admin/suppliers/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"><CirclePlus size={17}/>Add supplier</Link></header>

    <section className="mt-6 grid gap-4 sm:grid-cols-3"><Summary label="Total suppliers" value={data?.pagination?.total || suppliers.length}/><Summary label="Active" value={activeCount}/><Summary label="Inactive" value={suppliers.length - activeCount}/></section>

    <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm"><div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"/><input value={search} onChange={(e) => setSearch(e.target.value)} className="admin-input pl-10" placeholder="Search suppliers..."/></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="admin-input lg:w-44"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><button onClick={() => void refetch()} disabled={isFetching} className="inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-4 text-sm"><RefreshCw size={16} className={isFetching ? "animate-spin" : ""}/>Refresh</button></div>
    {isLoading ? <div className="flex min-h-[360px] items-center justify-center text-sm text-[#6d7175]">Loading suppliers...</div> : isError ? <div className="flex min-h-[360px] items-center justify-center">Unable to load suppliers.</div> : <SupplierList suppliers={suppliers} isChangingStatus={isChangingStatus} isDeleting={isDeleting} onStatusChange={handleStatusChange} onDelete={handleDelete}/>}</section>
  </div></main>;
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm"><p className="text-sm text-[#6d7175]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
function apiError(error: unknown, fallback: string) { const x = error as { data?: { error?: { message?: string }; message?: string } }; return x?.data?.error?.message || x?.data?.message || fallback; }
