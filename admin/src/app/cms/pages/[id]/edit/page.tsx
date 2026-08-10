"use client";

import { LoaderCircle } from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";
import CmsPageForm from "@/components/cms/CmsPageForm";

import {
  useGetCmsPageByIdQuery,
  useUpdateCmsPageMutation,
} from "@/store/api/cmsPagesApi";

import type {
  CmsPageFormValues,
} from "@/types/cms";

export default function EditCmsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const {
    data,
    isLoading,
    error,
  } = useGetCmsPageByIdQuery(id, {
    skip: !id,
  });

  const [
    updateCmsPage,
    { isLoading: isSaving },
  ] = useUpdateCmsPageMutation();

  const handleSubmit = async (
    values: CmsPageFormValues
  ) => {
    try {
      const response =
        await updateCmsPage({
          id,
          body: values,
        }).unwrap();

      toast.success(
        response.message ||
          "CMS page updated successfully."
      );

      router.push("/cms/pages");
    } catch (updateError: unknown) {
      const apiError = updateError as {
        data?: {
          error?: {
            message?: string;
            details?: Array<{
              message?: string;
            }>;
          };
        };
      };

      toast.error(
        apiError.data?.error?.details?.[0]
          ?.message ||
          apiError.data?.error?.message ||
          "Unable to update CMS page."
      );
    }
  };

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex min-h-[500px] items-center justify-center">
          <LoaderCircle className="animate-spin" />
        </div>
      </AdminShell>
    );
  }

  if (error || !data?.data) {
    return (
      <AdminShell>
        <div className="mx-auto max-w-[900px] px-5 py-10">
          <div className="admin-card p-8 text-center">
            <h1 className="text-lg font-semibold">
              CMS page not found
            </h1>

            <p className="mt-2 text-sm text-[#6d7175]">
              The page may have been removed or
              you may not have permission to view
              it.
            </p>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <CmsPageForm
        page={data.data}
        isSaving={isSaving}
        submitLabel="Save page"
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}