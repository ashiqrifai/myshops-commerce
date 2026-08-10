"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm";
import { useCreateProductMutation } from "@/store/api/productApi";

export default function NewProductPage() {
  const router = useRouter();
  const [createProduct, { isLoading }] = useCreateProductMutation();

  return (
    <ProductForm
      isSaving={isLoading}
      submitLabel="Create product"
      onSubmit={async (values) => {
        try {
          const response = await createProduct(values).unwrap();
          router.replace(`/admin/products/${response.data.id}`);
        } catch (error: any) {
          window.alert(error?.data?.message || "Unable to create product.");
        }
      }}
    />
  );
}
