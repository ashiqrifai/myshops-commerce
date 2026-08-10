"use client";

import {
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import {
  CirclePlus,
  RefreshCw,
  Search,
  Shapes,
  Upload,
} from "lucide-react";

import {
  toast,
} from "sonner";

import AttributeList from "@/components/admin/attributes/AttributeList";

import AttributeImportDialog from "@/components/admin/attributes/AttributeImportDialog";

import {
  useChangeAttributeStatusMutation,
  useDeleteAttributeMutation,
  useGetAttributesQuery,
} from "@/store/api/attributeApi";

import type {
  Attribute,
  AttributeInputType,
} from "@/types/attribute";

export default function AttributesPage() {
  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    inputType,
    setInputType,
  ] =
    useState<
      "ALL" |
      AttributeInputType
    >(
      "ALL"
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<
      "ALL" |
      "ACTIVE" |
      "INACTIVE"
    >(
      "ALL"
    );

  const [
    behaviourFilter,
    setBehaviourFilter,
  ] =
    useState<
      "ALL" |
      "VARIANT" |
      "FILTERABLE"
    >(
      "ALL"
    );

  /*
  |--------------------------------------------------------------------------
  | Import Dialog
  |--------------------------------------------------------------------------
  */

  const [
    importOpen,
    setImportOpen,
  ] =
    useState(
      false
    );

  /*
  |--------------------------------------------------------------------------
  | Query
  |--------------------------------------------------------------------------
  */

  const queryParams =
    useMemo(
      () => ({
        page:
          1,

        pageSize:
          200,

        search:
          search.trim() ||
          undefined,

        inputType:
          inputType ===
          "ALL"
            ? undefined
            : inputType,

        isActive:
          statusFilter ===
          "ALL"
            ? undefined
            : statusFilter ===
              "ACTIVE",

        isVariantDefining:
          behaviourFilter ===
          "VARIANT"
            ? true
            : undefined,

        isFilterable:
          behaviourFilter ===
          "FILTERABLE"
            ? true
            : undefined,

        sortBy:
          "displayOrder" as const,

        sortDirection:
          "ASC" as const,
      }),
      [
        search,
        inputType,
        statusFilter,
        behaviourFilter,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Load Attributes
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetAttributesQuery(
      queryParams
    );

  /*
  |--------------------------------------------------------------------------
  | Mutations
  |--------------------------------------------------------------------------
  */

  const [
    changeAttributeStatus,
    {
      isLoading:
        isChangingStatus,
    },
  ] =
    useChangeAttributeStatusMutation();

  const [
    deleteAttribute,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteAttributeMutation();

  /*
  |--------------------------------------------------------------------------
  | Data
  |--------------------------------------------------------------------------
  */

  const attributes =
    data?.data ||
    [];

  const variantCount =
    attributes.filter(
      (
        attribute
      ) =>
        attribute
          .isVariantDefining
    ).length;

  const filterableCount =
    attributes.filter(
      (
        attribute
      ) =>
        attribute
          .isFilterable
    ).length;

  const activeCount =
    attributes.filter(
      (
        attribute
      ) =>
        attribute
          .isActive
    ).length;

  /*
  |--------------------------------------------------------------------------
  | Change Status
  |--------------------------------------------------------------------------
  */

  const handleStatusChange =
    async (
      attribute:
        Attribute
    ) => {
      try {
        await changeAttributeStatus({
          id:
            attribute.id,

          isActive:
            !attribute.isActive,
        }).unwrap();

        toast.success(
          attribute.isActive
            ? "Attribute deactivated successfully."
            : "Attribute activated successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to change attribute status."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      attribute:
        Attribute
    ) => {
      const confirmed =
        window.confirm(
          `Delete "${attribute.name}"?\n\nThis action is only safe before the attribute is used by products.`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteAttribute(
          attribute.id
        ).unwrap();

        toast.success(
          "Attribute deleted successfully."
        );
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete attribute."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Import Completed
  |--------------------------------------------------------------------------
  */

  const handleImported =
    async () => {
      /*
       * The RTK mutation already invalidates the Attributes LIST tag,
       * but explicitly refetching here makes the UI update immediately
       * while the import dialog is still open.
       */

      await refetch();
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <main className="min-h-screen bg-[#f6f6f7]">
        <div className="mx-auto w-full max-w-[1550px] px-5 py-6 md:px-8">
          {/*
          |--------------------------------------------------------------------------
          | Header
          |--------------------------------------------------------------------------
          */}

          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Shapes
                  size={
                    22
                  }
                />

                <h1 className="text-2xl font-semibold tracking-tight">
                  Attributes
                </h1>
              </div>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
                Manage product specifications, variant-generating options,
                comparison fields and storefront filters.
              </p>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Header Actions
            |--------------------------------------------------------------------------
            */}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setImportOpen(
                    true
                  )
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#202223] shadow-sm transition hover:bg-[#f6f6f7]"
              >
                <Upload
                  size={
                    17
                  }
                />

                Import CSV
              </button>

              <Link
                href="/admin/attributes/new"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
              >
                <CirclePlus
                  size={
                    17
                  }
                />

                Add attribute
              </Link>
            </div>
          </header>

          {/*
          |--------------------------------------------------------------------------
          | Summary
          |--------------------------------------------------------------------------
          */}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total attributes"
              value={
                data?.pagination
                  .totalItems ||
                attributes.length
              }
            />

            <SummaryCard
              label="Active"
              value={
                activeCount
              }
            />

            <SummaryCard
              label="Variant attributes"
              value={
                variantCount
              }
            />

            <SummaryCard
              label="Filterable"
              value={
                filterableCount
              }
            />
          </section>

          {/*
          |--------------------------------------------------------------------------
          | List Card
          |--------------------------------------------------------------------------
          */}

          <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
            {/*
            |--------------------------------------------------------------------------
            | Filters
            |--------------------------------------------------------------------------
            */}

            <div className="grid gap-3 border-b border-[#e1e3e5] p-4 lg:grid-cols-[minmax(260px,1fr)_190px_170px_190px_auto]">
              {/*
              |--------------------------------------------------------------------------
              | Search
              |--------------------------------------------------------------------------
              */}

              <div className="relative">
                <Search
                  size={
                    17
                  }
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                />

                <input
                  value={
                    search
                  }
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  className="admin-input pl-10"
                  placeholder="Search attributes..."
                />
              </div>

              {/*
              |--------------------------------------------------------------------------
              | Input Type
              |--------------------------------------------------------------------------
              */}

              <select
                value={
                  inputType
                }
                onChange={(
                  event
                ) =>
                  setInputType(
                    event.target
                      .value as
                      | "ALL"
                      | AttributeInputType
                  )
                }
                className="admin-input"
              >
                <option value="ALL">
                  All input types
                </option>

                <option value="TEXT">
                  Text
                </option>

                <option value="NUMBER">
                  Number
                </option>

                <option value="BOOLEAN">
                  Boolean
                </option>

                <option value="SINGLE_SELECT">
                  Single select
                </option>

                <option value="MULTI_SELECT">
                  Multi select
                </option>

                <option value="COLOR_SWATCH">
                  Color swatch
                </option>

                <option value="DATE">
                  Date
                </option>

                <option value="RICH_TEXT">
                  Rich text
                </option>
              </select>

              {/*
              |--------------------------------------------------------------------------
              | Status
              |--------------------------------------------------------------------------
              */}

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value as
                      | "ALL"
                      | "ACTIVE"
                      | "INACTIVE"
                  )
                }
                className="admin-input"
              >
                <option value="ALL">
                  All statuses
                </option>

                <option value="ACTIVE">
                  Active
                </option>

                <option value="INACTIVE">
                  Inactive
                </option>
              </select>

              {/*
              |--------------------------------------------------------------------------
              | Behaviour
              |--------------------------------------------------------------------------
              */}

              <select
                value={
                  behaviourFilter
                }
                onChange={(
                  event
                ) =>
                  setBehaviourFilter(
                    event.target
                      .value as
                      | "ALL"
                      | "VARIANT"
                      | "FILTERABLE"
                  )
                }
                className="admin-input"
              >
                <option value="ALL">
                  All behaviour
                </option>

                <option value="VARIANT">
                  Variant defining
                </option>

                <option value="FILTERABLE">
                  Filterable
                </option>
              </select>

              {/*
              |--------------------------------------------------------------------------
              | Refresh
              |--------------------------------------------------------------------------
              */}

              <button
                type="button"
                onClick={() =>
                  refetch()
                }
                disabled={
                  isFetching
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
              >
                <RefreshCw
                  size={
                    16
                  }
                  className={
                    isFetching
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Content
            |--------------------------------------------------------------------------
            */}

            {isLoading ? (
              <div className="flex min-h-[380px] items-center justify-center">
                <p className="text-sm text-[#6d7175]">
                  Loading attributes...
                </p>
              </div>
            ) : isError ? (
              <div className="flex min-h-[380px] items-center justify-center p-6 text-center">
                <div>
                  <h2 className="text-base font-semibold">
                    Unable to load attributes
                  </h2>

                  <p className="mt-2 text-sm text-[#6d7175]">
                    Check the backend route, model associations and API
                    configuration.
                  </p>
                </div>
              </div>
            ) : (
              <AttributeList
                attributes={
                  attributes
                }
                isChangingStatus={
                  isChangingStatus
                }
                isDeleting={
                  isDeleting
                }
                onStatusChange={
                  handleStatusChange
                }
                onDelete={
                  handleDelete
                }
              />
            )}
          </section>
        </div>
      </main>

      {/*
      |--------------------------------------------------------------------------
      | Import Dialog
      |--------------------------------------------------------------------------
      */}

      <AttributeImportDialog
        open={
          importOpen
        }
        onClose={() =>
          setImportOpen(
            false
          )
        }
        onImported={
          handleImported
        }
      />
    </>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6d7175]">
        {
          label
        }
      </p>

      <p className="mt-2 text-2xl font-semibold">
        {
          value
        }
      </p>
    </div>
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