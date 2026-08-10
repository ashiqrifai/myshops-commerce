"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";
import CmsPageForm from "@/components/cms/CmsPageForm";

import { useCreateCmsPageMutation } from "@/store/api/cmsPagesApi";
import { useAppSelector } from "@/store/hooks";

import type {
  CmsPageFormValues,
} from "@/types/cms";

export default function NewCmsPage() {
  const router = useRouter();

  const accessToken = useAppSelector(
    (state) => state.auth.accessToken
  );

  const [
    createCmsPage,
    { isLoading },
  ] = useCreateCmsPageMutation();

  const handleSubmit = async (
    values: CmsPageFormValues
  ) => {
    try {
      const response =
        await createCmsPage(
          values
        ).unwrap();

      toast.success(
        response.message ||
          "CMS page created successfully."
      );

      router.push("/cms/pages");
    } catch (error: unknown) {
      const apiError = error as {
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
          "Unable to create CMS page."
      );
    }
  };

  if (!accessToken) {
    return null;
  }

  return (
    <AdminShell>
      <CmsPageForm
        isSaving={isLoading}
        submitLabel="Create page"
        onSubmit={handleSubmit}
      />
    </AdminShell>
  );
}