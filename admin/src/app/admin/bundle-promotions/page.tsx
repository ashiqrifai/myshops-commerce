"use client";

import Link from "next/link";
import {
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  useChangeBundleConfigStatusMutation,
  useDeleteBundleConfigMutation,
  useGetBundleConfigsQuery,
} from "@/store/api/bundlePromotionApi";

export default function BundlePromotionsPage() {
  const {
    data,
    isFetching,
    refetch,
  } = useGetBundleConfigsQuery({
    page: 1,
    pageSize: 100,
  });

  const [
    changeStatus,
    {
      isLoading: isChangingStatus,
    },
  ] = useChangeBundleConfigStatusMutation();

  const [
    deleteConfig,
    {
      isLoading: isDeleting,
    },
  ] = useDeleteBundleConfigMutation();

  const rows =
    data?.data || [];

  const handleStatusChange =
    async (
      id: string,
      isActive: boolean
    ) => {
      try {
        await changeStatus({
          id,
          isActive,
        }).unwrap();

        toast.success(
          "Status updated"
        );

        refetch();
      } catch {
        toast.error(
          "Unable to update status."
        );
      }
    };

  const handleDelete =
    async (
      id: string
    ) => {
      if (
        !window.confirm(
          "Delete this bundle configuration?"
        )
      ) {
        return;
      }

      try {
        await deleteConfig(
          id
        ).unwrap();

        toast.success(
          "Bundle promotion deleted."
        );

        refetch();
      } catch {
        toast.error(
          "Unable to delete bundle promotion."
        );
      }
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Bundle Promotions
          </h1>

          <p className="mt-1 text-sm text-[#6d7175]">
            Manage product and variant bundle offers.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              refetch()
            }
            className="rounded-lg border px-3 py-2"
            title="Refresh"
          >
            <RefreshCw
              size={16}
            />
          </button>

          <Link
            href="/admin/bundle-promotions/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#303030] px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus
              size={16}
            />

            New bundle promotion
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="min-w-full">
          <thead className="bg-[#f6f6f7] text-left text-xs uppercase text-[#6d7175]">
            <tr>
              <th className="px-4 py-3">
                Product
              </th>

              <th className="px-4 py-3">
                Variant
              </th>

              <th className="px-4 py-3">
                Channel
              </th>

              <th className="px-4 py-3">
                Limits
              </th>

              <th className="px-4 py-3">
                Status
              </th>

              <th className="px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {isFetching &&
            !rows.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : !rows.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="p-8 text-center text-[#6d7175]"
                >
                  No bundle configurations yet.
                </td>
              </tr>
            ) : (
              rows.map(
                (config) => (
                  <tr
                    key={
                      config.id
                    }
                  >
                    <td className="px-4 py-4 font-medium">
                      {config.product
                        ?.name ||
                        config.productId}
                    </td>

                    <td className="px-4 py-4 text-sm text-[#6d7175]">
                      {config.productVariant
                        ? `${config.productVariant.sku} — ${config.productVariant.name}`
                        : "All variants"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {
                        config.channelCode
                      }
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {
                        config.maxBundleSelectionsPerUnit
                      }
                      /unit · show{" "}
                      {
                        config.maxBundlesDisplayed
                      }
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        disabled={
                          isChangingStatus
                        }
                        onClick={() =>
                          void handleStatusChange(
                            config.id!,
                            !config.isActive
                          )
                        }
                        className={[
                          "rounded-full px-2 py-1 text-xs font-semibold disabled:opacity-50",
                          config.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600",
                        ].join(
                          " "
                        )}
                      >
                        {config.isActive
                          ? "Active"
                          : "Inactive"}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/bundle-promotions/${config.id}/edit`}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#d8d8d8] bg-white px-3 text-xs font-semibold text-[#303030] hover:bg-[#f6f6f7]"
                          title="Edit bundle promotion"
                        >
                          <Edit3
                            size={15}
                          />

                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={
                            isDeleting
                          }
                          onClick={() =>
                            void handleDelete(
                              config.id!
                            )
                          }
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Delete bundle promotion"
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
