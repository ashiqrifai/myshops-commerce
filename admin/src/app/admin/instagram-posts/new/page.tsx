"use client";

import {
  useRouter,
} from "next/navigation";

import {
  toast,
} from "sonner";

import InstagramPostForm from "@/components/admin/instagram-posts/InstagramPostForm";

import {
  useCreateInstagramPostMutation,
} from "@/store/api/instagramPostApi";

import type {
  InstagramPostFormValues,
} from "@/types/instagramPost";

export default function CreateInstagramPostPage() {
  const router =
    useRouter();

  const [
    createInstagramPost,
    {
      isLoading,
    },
  ] =
    useCreateInstagramPostMutation();

  /*
  |--------------------------------------------------------------------------
  | Submit
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      values:
        InstagramPostFormValues
    ) => {
      try {
        await createInstagramPost(
          values
        ).unwrap();

        toast.success(
          "Instagram post created successfully."
        );

        router.replace(
          "/admin/instagram-posts"
        );

        router.refresh();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to create Instagram post."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <InstagramPostForm
        isSaving={
          isLoading
        }
        submitLabel="Create Instagram post"
        onSubmit={
          handleSubmit
        }
      />
    </main>
  );
}

/*
|--------------------------------------------------------------------------
| API Error
|--------------------------------------------------------------------------
*/

function getApiErrorMessage(
  error:
    unknown,

  fallback:
    string
): string {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;
      };
    };

  return (
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}