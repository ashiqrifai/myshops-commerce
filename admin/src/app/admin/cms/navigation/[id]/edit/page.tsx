"use client";

import Link from "next/link";

import {
  useParams,
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import { toast } from "sonner";

import NavigationMenuForm from "@/components/admin/navigation/NavigationMenuForm";

import {
  useGetNavigationMenuByIdQuery,
  useUpdateNavigationMenuMutation,
} from "@/store/api/navigationApi";

import type {
  NavigationMenuFormValues,
} from "@/types/navigation";

const getErrorMessage = (
  error: unknown
): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error
  ) {
    const data = (
      error as {
        data?: {
          message?: string;
          error?: {
            message?: string;
          };
        };
      }
    ).data;

    return (
      data?.message ||
      data?.error?.message ||
      "Unable to update the navigation menu."
    );
  }

  return "Unable to update the navigation menu.";
};

export default function EditNavigationMenuPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const menuId =
    params.id;

  const {
    data,
    isLoading,
    isError,
  } =
    useGetNavigationMenuByIdQuery(
      menuId,
      {
        skip:
          !menuId,
      }
    );

  const [
    updateNavigationMenu,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateNavigationMenuMutation();

  const menu =
    data?.data;

  const handleSubmit =
    async (
      values:
        NavigationMenuFormValues
    ) => {
      try {
        await updateNavigationMenu({
          id: menuId,
          body: values,
        }).unwrap();

        toast.success(
          "Navigation menu updated successfully."
        );

        router.push(
          `/admin/cms/navigation/${menuId}`
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error
          )
        );
      }
    };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin" />

          <p className="mt-3 text-sm text-[#6d7175]">
            Loading navigation
            menu...
          </p>
        </div>
      </main>
    );
  }

  if (
    isError ||
    !menu
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="max-w-md rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center">
          <h1 className="text-lg font-semibold">
            Navigation menu not
            found
          </h1>

          <p className="mt-2 text-sm text-[#6d7175]">
            The requested menu may
            have been removed or you
            may not have access to
            it.
          </p>

          <Link
            href="/admin/cms/navigation"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            Return to navigation
          </Link>
        </div>
      </main>
    );
  }

  const initialValues:
    NavigationMenuFormValues = {
    name:
      menu.name,

    code:
      menu.code,

    channel:
      menu.channel,

    menuType:
      menu.menuType,

    description:
      menu.description,

    settings:
      menu.settings ||
      {},
  };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8">
        <header>
          <Link
            href={`/admin/cms/navigation/${menuId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
          >
            <ArrowLeft
              size={16}
            />

            Back to builder
          </Link>

          <div className="mt-5 flex items-center gap-2 text-sm text-[#6d7175]">
            <span>CMS</span>

            <ChevronRight
              size={14}
            />

            <span>
              Navigation
            </span>

            <ChevronRight
              size={14}
            />

            <span>
              {menu.name}
            </span>

            <ChevronRight
              size={14}
            />

            <span>
              Edit
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Edit navigation menu
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Update the menu identity,
            channel and display
            settings.
          </p>
        </header>

        <div className="mt-6">
          <NavigationMenuForm
            initialValues={
              initialValues
            }
            submitLabel="Save changes"
            isSubmitting={
              isUpdating
            }
            onSubmit={
              handleSubmit
            }
          />
        </div>
      </div>
    </main>
  );
}