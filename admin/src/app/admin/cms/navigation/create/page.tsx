"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
} from "lucide-react";

import { toast } from "sonner";

import NavigationMenuForm from "@/components/admin/navigation/NavigationMenuForm";

import {
  useCreateNavigationMenuMutation,
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
      "Unable to create the navigation menu."
    );
  }

  return "Unable to create the navigation menu.";
};

export default function CreateNavigationMenuPage() {
  const router =
    useRouter();

  const [
    createNavigationMenu,
    {
      isLoading,
    },
  ] =
    useCreateNavigationMenuMutation();

  const handleSubmit =
    async (
      values:
        NavigationMenuFormValues
    ) => {
      try {
        const response =
          await createNavigationMenu(
            values
          ).unwrap();

        toast.success(
          "Navigation menu created successfully."
        );

        router.push(
          `/admin/cms/navigation/${response.data.id}`
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-6 md:px-8">
        <header>
          <Link
            href="/admin/cms/navigation"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
          >
            <ArrowLeft
              size={16}
            />

            Navigation menus
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
              Create
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Create navigation menu
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Create the menu first,
            then add its links,
            headings and promotional
            content.
          </p>
        </header>

        <div className="mt-6">
          <NavigationMenuForm
            isSubmitting={
              isLoading
            }
            submitLabel="Create menu"
            onSubmit={
              handleSubmit
            }
          />
        </div>
      </div>
    </main>
  );
}