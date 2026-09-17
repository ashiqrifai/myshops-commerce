"use client";

import {
  use,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  LoaderCircle,
} from "lucide-react";

import {
  toast,
} from "sonner";

import InstagramPostForm from "@/components/admin/instagram-posts/InstagramPostForm";

import {
  useGetInstagramPostByIdQuery,
  useUpdateInstagramPostMutation,
} from "@/store/api/instagramPostApi";

import type {
  InstagramPostFormValues,
} from "@/types/instagramPost";

interface EditInstagramPostPageProps {
  params:
    Promise<{
      id:
        string;
    }>;
}

export default function EditInstagramPostPage({
  params,
}: EditInstagramPostPageProps) {
  const {
    id,
  } =
    use(
      params
    );

  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | Load Post
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetInstagramPostByIdQuery(
      id
    );

  /*
  |--------------------------------------------------------------------------
  | Update
  |--------------------------------------------------------------------------
  */

  const [
    updateInstagramPost,
    {
      isLoading:
        isSaving,
    },
  ] =
    useUpdateInstagramPostMutation();

  const post =
    data?.data;

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
        await updateInstagramPost({
          id,

          body:
            values,
        }).unwrap();

        toast.success(
          "Instagram post updated successfully."
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
            "Unable to update Instagram post."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    isLoading ||
    isFetching
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <LoaderCircle
            size={
              28
            }
            className="mx-auto animate-spin text-[#6d7175]"
          />

          <p className="mt-3 text-sm text-[#6d7175]">
            Loading Instagram post...
          </p>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    isError ||
    !post
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="max-w-md rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-[#202223]">
            Unable to load Instagram post
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6d7175]">
            The Instagram gallery item could not be loaded.
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() =>
                void refetch()
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] hover:bg-[#f6f6f7]"
            >
              Try again
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/instagram-posts"
                )
              }
              className="h-10 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
            >
              Back to gallery
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Initial Values
  |--------------------------------------------------------------------------
  */

  const initialValues:
    InstagramPostFormValues = {
    mediaAssetId:
      post.mediaAssetId,

    instagramUrl:
      post.instagramUrl,

    caption:
      post.caption ||
      null,

    altText:
      post.altText ||
      null,

    sortOrder:
      Number(
        post.sortOrder ||
          0
      ),

    isActive:
      post.isActive,
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <InstagramPostForm
        initialValues={
          initialValues
        }
        isSaving={
          isSaving
        }
        submitLabel="Save changes"
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