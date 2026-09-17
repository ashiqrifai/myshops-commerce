"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import SupplierForm from "@/components/admin/suppliers/SupplierForm";
import { useDeleteSupplierMutation, useGetSupplierByIdQuery, useUpdateSupplierMutation } from "@/store/api/supplierApi";
import type { SupplierFormValues } from "@/types/supplier";

export default function SupplierDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useGetSupplierByIdQuery(id);
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier, { isLoading: isDeleting }] = useDeleteSupplierMutation();
  const supplier = data?.data;

  const submit = async (values: SupplierFormValues) => {
    try { await updateSupplier({ id, body: values }).unwrap(); toast.success("Supplier updated successfully."); void refetch(); }
    catch (error) { toast.error(apiError(error, "Unable to update supplier.")); }
  };

  const remove = async () => {
    if (!supplier || !window.confirm(`Delete "${supplier.name}"?`)) return;
    try { await deleteSupplier(id).unwrap(); toast.success("Supplier deleted successfully."); router.push("/admin/suppliers"); }
    catch (error) { toast.error(apiError(error, "Unable to delete supplier.")); }
  };

  if (isLoading) return <div className="flex min-h-[500px] items-center justify-center"><LoaderCircle className="animate-spin" size={18}/></div>;
  if (isError || !supplier) return <div className="p-8">Unable to load supplier.</div>;

  return <main className="min-h-screen bg-[#f6f6f7]"><div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8"><div className="flex items-center justify-between"><Link href="/admin/suppliers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#005bd3]"><ArrowLeft size={16}/>Back to suppliers</Link><button disabled={isDeleting} onClick={remove} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-sm font-semibold text-red-600"><Trash2 size={16}/>Delete supplier</button></div><header className="mt-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white"><Truck size={19}/></div><div><h1 className="text-2xl font-semibold">{supplier.name}</h1><p className="mt-1 text-sm text-[#6d7175]">{supplier.code}</p></div></header><div className="mt-6"><SupplierForm supplier={supplier} submitting={isUpdating} submitLabel="Save changes" onSubmit={submit}/></div></div></main>;
}
function apiError(error: unknown, fallback: string) { const x = error as { data?: { error?: { message?: string }; message?: string } }; return x?.data?.error?.message || x?.data?.message || fallback; }
