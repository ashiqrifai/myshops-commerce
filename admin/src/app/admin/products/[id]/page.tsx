"use client";

import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm";
import {
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/store/api/productApi";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, isFetching, refetch } = useGetProductByIdQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });

  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8">
        <p className="text-sm text-[#6d7175]">Loading product...</p>
      </main>
    );
  }

  if (!data?.data) {
    return (
      <main className="mx-auto w-full max-w-[1500px] px-5 py-8 md:px-8">
        <p className="text-sm text-[#a23b2a]">Product not found.</p>
      </main>
    );
  }

  return (
    <ProductForm
      product={data.data}
      isSaving={saving || isFetching}
      submitLabel="Save changes"
      onRefresh={() => void refetch()}
      onSubmit={async (values) => {
        try {
          await updateProduct({ id, values }).unwrap();
          await refetch();
        } catch (error: any) {
          window.alert(error?.data?.message || "Unable to update product.");
        }
      }}
    />
  );
}
