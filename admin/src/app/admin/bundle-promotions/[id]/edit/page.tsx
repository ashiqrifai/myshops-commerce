"use client";

import { useMemo } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { toast } from "sonner";

import BundlePromotionForm, {
  type BundleFormValue,
} from "@/components/admin/bundle-promotions/BundlePromotionForm";

import {
  useCreateBundleItemMutation,
  useCreateBundleMutation,
  useDeleteBundleItemMutation,
  useDeleteBundleMutation,
  useGetBundleConfigQuery,
  useUpdateBundleConfigMutation,
  useUpdateBundleItemMutation,
  useUpdateBundleMutation,
} from "@/store/api/bundlePromotionApi";

import type {
  Bundle,
} from "@/types/bundlePromotion";

function getErrorMessage(
  error: unknown
) {
  const value =
    error as {
      data?: {
        error?: {
          message?: string;
        };
        message?: string;
      };
      message?: string;
    };

  return (
    value?.data?.error
      ?.message ||
    value?.data?.message ||
    value?.message ||
    "Unable to update bundle promotion."
  );
}

export default function EditBundlePromotionPage() {
  const router =
    useRouter();

  const params =
    useParams<{
      id: string;
    }>();

  const id =
    params?.id;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetBundleConfigQuery(
      id,
      {
        skip: !id,
      }
    );

  const [
    updateConfig,
    {
      isLoading:
        updatingConfig,
    },
  ] =
    useUpdateBundleConfigMutation();

  const [
    createBundle,
    {
      isLoading:
        creatingBundle,
    },
  ] =
    useCreateBundleMutation();

  const [
    updateBundle,
    {
      isLoading:
        updatingBundle,
    },
  ] =
    useUpdateBundleMutation();

  const [
    deleteBundle,
    {
      isLoading:
        deletingBundle,
    },
  ] =
    useDeleteBundleMutation();

  const [
    createItem,
    {
      isLoading:
        creatingItem,
    },
  ] =
    useCreateBundleItemMutation();

  const [
    updateItem,
    {
      isLoading:
        updatingItem,
    },
  ] =
    useUpdateBundleItemMutation();

  const [
    deleteItem,
    {
      isLoading:
        deletingItem,
    },
  ] =
    useDeleteBundleItemMutation();

  const config =
    data?.data;

  const initialValue =
    useMemo<
      BundleFormValue | undefined
    >(() => {
      if (!config) {
        return undefined;
      }

      return {
        ...config,

        productVariantId:
          config.productVariantId ||
          null,

        maxBundleSelectionsPerUnit:
          Number(
            config.maxBundleSelectionsPerUnit ||
              1
          ),

        maxBundlesDisplayed:
          Number(
            config.maxBundlesDisplayed ||
              4
          ),

        bundles:
          (
            config.bundles ||
            []
          ).map(
            bundle => ({
              ...bundle,

              priceAmount:
                bundle.priceAmount ==
                null
                  ? null
                  : Number(
                      bundle.priceAmount
                    ),

              sortOrder:
                Number(
                  bundle.sortOrder ||
                    0
                ),

              items:
                (
                  bundle.items ||
                  []
                ).map(
                  item => ({
                    ...item,

                    productId:
                      item.productId ||
                      null,

                    productVariantId:
                      item.productVariantId ||
                      null,

                    protectionSchemeId:
                      item.protectionSchemeId ||
                      null,

                    quantity:
                      Number(
                        item.quantity ||
                          1
                      ),

                    sortOrder:
                      Number(
                        item.sortOrder ||
                          0
                      ),
                  })
                ),
            })
          ),
      };
    }, [
      config,
    ]);

  const isSaving =
    updatingConfig ||
    creatingBundle ||
    updatingBundle ||
    deletingBundle ||
    creatingItem ||
    updatingItem ||
    deletingItem;

  const save =
    async (
      value:
        BundleFormValue
    ) => {
      if (
        !id ||
        !config
      ) {
        return;
      }

      try {
        /*
         * 1. Update parent configuration.
         */
        await updateConfig({
          id,
          value,
        }).unwrap();

        const existingBundles =
          config.bundles ||
          [];

        const submittedBundles =
          value.bundles ||
          [];

        const submittedBundleIds =
          new Set(
            submittedBundles
              .map(
                bundle =>
                  bundle.id
              )
              .filter(
                (
                  bundleId
                ): bundleId is string =>
                  Boolean(
                    bundleId
                  )
              )
          );

        /*
         * 2. Delete bundles removed from the edit form.
         *
         * This only happens when Save is pressed.
         */
        for (
          const existingBundle of
          existingBundles
        ) {
          if (
            existingBundle.id &&
            !submittedBundleIds.has(
              existingBundle.id
            )
          ) {
            await deleteBundle(
              existingBundle.id
            ).unwrap();
          }
        }

        /*
         * 3. Reconcile submitted bundles and their items.
         */
        for (
          const submittedBundle of
          submittedBundles
        ) {
          let bundleId =
            submittedBundle.id;

          let oldBundle:
            | Bundle
            | undefined;

          if (bundleId) {
            oldBundle =
              existingBundles.find(
                bundle =>
                  bundle.id ===
                  bundleId
              );

            await updateBundle({
              bundleId,
              value:
                submittedBundle,
            }).unwrap();
          } else {
            const created =
              await createBundle({
                configId:
                  id,
                value:
                  submittedBundle,
              }).unwrap();

            bundleId =
              created.data.id;
          }

          if (!bundleId) {
            throw new Error(
              "Bundle ID was not returned by the API."
            );
          }

          const existingItems =
            oldBundle?.items ||
            [];

          const submittedItems =
            submittedBundle.items ||
            [];

          const submittedItemIds =
            new Set(
              submittedItems
                .map(
                  item =>
                    item.id
                )
                .filter(
                  (
                    itemId
                  ): itemId is string =>
                    Boolean(
                      itemId
                    )
                )
            );

          /*
           * 4. Delete items removed from an existing bundle.
           */
          for (
            const existingItem of
            existingItems
          ) {
            if (
              existingItem.id &&
              !submittedItemIds.has(
                existingItem.id
              )
            ) {
              await deleteItem(
                existingItem.id
              ).unwrap();
            }
          }

          /*
           * 5. Update existing items and create new items.
           */
          for (
            const submittedItem of
            submittedItems
          ) {
            if (
              submittedItem.id
            ) {
              await updateItem({
                itemId:
                  submittedItem.id,
                value:
                  submittedItem,
              }).unwrap();
            } else {
              await createItem({
                bundleId,
                value:
                  submittedItem,
              }).unwrap();
            }
          }
        }

        toast.success(
          "Bundle promotion updated successfully."
        );

        await refetch();

        router.push(
          "/admin/bundle-promotions"
        );

        router.refresh();
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error
          )
        );

        throw error;
      }
    };

  if (
    !id
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-red-600">
        Invalid bundle promotion ID.
      </div>
    );
  }

  if (
    isLoading ||
    isFetching
  ) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-sm text-[#6d7175]">
        Loading bundle promotion...
      </div>
    );
  }

  if (
    isError ||
    !initialValue
  ) {
    return (
      <div className="mx-auto max-w-4xl rounded-xl border bg-white p-8 text-center">
        <h1 className="text-lg font-semibold">
          Unable to load bundle promotion
        </h1>

        <p className="mt-2 text-sm text-[#6d7175]">
          The bundle configuration could not be loaded.
        </p>

        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              refetch()
            }
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Retry
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin/bundle-promotions"
              )
            }
            className="rounded-lg bg-[#303030] px-4 py-2 text-sm font-semibold text-white"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <BundlePromotionForm
      title="Edit Bundle Promotion"
      subtitle="Update applicability, pricing, bundles and included products or protection plans."
      initialValue={
        initialValue
      }
      isSaving={
        isSaving
      }
      onCancel={() =>
        router.push(
          "/admin/bundle-promotions"
        )
      }
      onSubmit={
        save
      }
    />
  );
}
