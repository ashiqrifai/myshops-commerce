"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Truck } from "lucide-react";
import { toast } from "sonner";
import SupplierForm from "@/components/admin/suppliers/SupplierForm";
import { useCreateSupplierMutation } from "@/store/api/supplierApi";
import type { SupplierFormValues } from "@/types/supplier";

export default function NewSupplierPage() {
  const router = useRouter();
  const [createSupplier, { isLoading }] = useCreateSupplierMutation();
  const submit = async (values: SupplierFormValues) => {
    try { const result = await createSupplier(values).unwrap(); toast.success("Supplier created successfully."); router.push(`/admin/suppliers/${result.data.id}`); }
    catch (error) { toast.error(apiError(error, "Unable to create supplier.")); }
  };
  return <main className="min-h-screen bg-[#f6f6f7]"><div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8"><Link href="/admin/suppliers" className="inline-flex items-center gap-2 text-sm font-semibold text-[#005bd3]"><ArrowLeft size={16}/>Back to suppliers</Link><header className="mt-5 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-[#303030] text-white"><Truck size={19}/></div><div><h1 className="text-2xl font-semibold">Add supplier</h1><p className="mt-1 text-sm text-[#6d7175]">Create a supplier for direct-delivery products.</p></div></header><div className="mt-6"><SupplierForm submitting={isLoading} submitLabel="Create supplier" onSubmit={submit}/></div></div></main>;
}
function apiError(error: unknown, fallback: string) { const x = error as { data?: { error?: { message?: string }; message?: string } }; return x?.data?.error?.message || x?.data?.message || fallback; }
