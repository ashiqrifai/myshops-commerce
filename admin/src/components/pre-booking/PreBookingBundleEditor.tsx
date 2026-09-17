"use client";

import {
  LoaderCircle,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useCreatePreBookingBundleItemMutation,
  useCreatePreBookingBundleMutation,
  useDeletePreBookingBundleItemMutation,
  useDeletePreBookingBundleMutation,
  useUpdatePreBookingBundleItemMutation,
  useUpdatePreBookingBundleMutation,
} from "@/store/api/preBookingApi";

import {
  useGetProtectionSchemesQuery,
} from "@/store/api/protectionApi";

import PreBookingAllocationEditor from "./PreBookingAllocationEditor";

import type {
  PreBookingBundle,
  PreBookingBundleItem,
  PreBookingBundleItemType,
  PreBookingBundlePriceMode,
} from "@/types/preBooking";

import type {
  Product,
  ProductVariant,
} from "@/types/product";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface PreBookingBundleEditorProps {
  campaignProductId:
    string;

  parentProduct:
    Product;

  bundles:
    PreBookingBundle[];

  onChanged?:
    () => void;
}

/*
|--------------------------------------------------------------------------
| Bundle Form
|--------------------------------------------------------------------------
*/

interface BundleFormValues {
  code: string;

  name: string;

  description: string;

  priceMode:
    PreBookingBundlePriceMode;

  priceAmount:
    number | null;

  currencyCode:
    string;

  protectionSchemeId:
    string;

  protectionIncluded:
    boolean;

  badgeText:
    string;

  isDefault:
    boolean;

  isActive:
    boolean;

  sortOrder:
    number;
}

/*
|--------------------------------------------------------------------------
| Bundle Item Form
|--------------------------------------------------------------------------
*/

interface BundleItemFormValues {
  itemType:
    PreBookingBundleItemType;

  productId:
    string;

  productVariantId:
    string;

  label:
    string;

  description:
    string;

  quantity:
    number;

  isIncluded:
    boolean;

  isActive:
    boolean;

  sortOrder:
    number;
}

/*
|--------------------------------------------------------------------------
| Main
|--------------------------------------------------------------------------
*/

export default function PreBookingBundleEditor({
  campaignProductId,
  parentProduct,
  bundles,
  onChanged,
}: PreBookingBundleEditorProps) {
  const [
    creatingBundle,
    setCreatingBundle,
  ] =
    useState(
      false
    );

  const [
    createBundle,
    {
      isLoading:
        creatingBundleRequest,
    },
  ] =
    useCreatePreBookingBundleMutation();

  const sortedBundles =
    useMemo(
      () =>
        [
          ...(bundles ||
            []),
        ].sort(
          (
            a,
            b
          ) =>
            Number(
              a.sortOrder ||
              0
            ) -
            Number(
              b.sortOrder ||
              0
            )
        ),
      [
        bundles,
      ]
    );

  const create =
    async (
      values:
        BundleFormValues
    ) => {
      try {
        await createBundle({
          campaignProductId,

          body: {
            code:
              values.code,

            name:
              values.name,

            description:
              values.description.trim() ||
              null,

            priceMode:
              values.priceMode,

            priceAmount:
              values.priceAmount,

            currencyCode:
              values.currencyCode,

            protectionSchemeId:
              values.protectionSchemeId ||
              null,

            protectionIncluded:
              values.protectionSchemeId
                ? values.protectionIncluded
                : false,

            badgeText:
              values.badgeText.trim() ||
              null,

            isDefault:
              values.isDefault,

            isActive:
              values.isActive,

            sortOrder:
              values.sortOrder,
          },
        }).unwrap();

        setCreatingBundle(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to create bundle."
        );
      }
    };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#202223]">
            Bundles
          </h3>

          <p className="mt-1 text-xs text-[#6d7175]">
            Optional. Add one or more bundle choices only when required.
          </p>
        </div>

        {!creatingBundle ? (
          <button
            type="button"
            onClick={() =>
              setCreatingBundle(
                true
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-xs font-semibold text-[#202223] hover:bg-[#f6f6f7]"
          >
            <Plus
              size={
                15
              }
            />

            Add bundle
          </button>
        ) : null}
      </div>

      {creatingBundle ? (
        <BundleForm
          isSaving={
            creatingBundleRequest
          }
          onCancel={() =>
            setCreatingBundle(
              false
            )
          }
          onSave={
            create
          }
        />
      ) : null}

      {sortedBundles.length ===
      0 ? (
        <div className="rounded-lg border border-dashed border-[#babfc3] bg-[#fafbfb] p-5 text-center text-xs text-[#6d7175]">
          No bundles configured. This product can use direct pre-booking allocation instead.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedBundles.map(
            (
              bundle
            ) => (
              <ExistingBundle
                key={
                  bundle.id
                }
                bundle={
                  bundle
                }
                parentProduct={
                  parentProduct
                }
                onChanged={
                  onChanged
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Existing Bundle
|--------------------------------------------------------------------------
*/

function ExistingBundle({
  bundle,
  parentProduct,
  onChanged,
}: {
  bundle:
    PreBookingBundle;

  parentProduct:
    Product;

  onChanged?:
    () => void;
}) {
  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  const [
    addingItem,
    setAddingItem,
  ] =
    useState(
      false
    );

  const [
    updateBundle,
    {
      isLoading:
        updatingBundle,
    },
  ] =
    useUpdatePreBookingBundleMutation();

  const [
    deleteBundle,
    {
      isLoading:
        deletingBundle,
    },
  ] =
    useDeletePreBookingBundleMutation();

  const [
    createItem,
    {
      isLoading:
        creatingItem,
    },
  ] =
    useCreatePreBookingBundleItemMutation();

  const update =
    async (
      values:
        BundleFormValues
    ) => {
      try {
        await updateBundle({
          bundleId:
            bundle.id,

          body: {
            code:
              values.code,

            name:
              values.name,

            description:
              values.description.trim() ||
              null,

            priceMode:
              values.priceMode,

            priceAmount:
              values.priceAmount,

            currencyCode:
              values.currencyCode,

            protectionSchemeId:
              values.protectionSchemeId ||
              null,

            protectionIncluded:
              values.protectionSchemeId
                ? values.protectionIncluded
                : false,

            badgeText:
              values.badgeText.trim() ||
              null,

            isDefault:
              values.isDefault,

            isActive:
              values.isActive,

            sortOrder:
              values.sortOrder,
          },
        }).unwrap();

        setEditing(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to update bundle."
        );
      }
    };

  const remove =
    async () => {
      const confirmed =
        window.confirm(
          `Delete bundle "${bundle.name}"?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteBundle(
          bundle.id
        ).unwrap();

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to delete bundle."
        );
      }
    };

  const addItem =
    async (
      values:
        BundleItemFormValues
    ) => {
      try {
        await createItem({
          bundleId:
            bundle.id,

          body: {
            itemType:
              values.itemType,

            productId:
              values.itemType ===
              "PRODUCT"
                ? values.productId ||
                  null
                : null,

            productVariantId:
              values.itemType ===
              "PRODUCT"
                ? values.productVariantId ||
                  null
                : null,

            label:
              values.label,

            description:
              values.description.trim() ||
              null,

            quantity:
              values.quantity,

            isIncluded:
              values.isIncluded,

            sortOrder:
              values.sortOrder,

            isActive:
              values.isActive,
          },
        }).unwrap();

        setAddingItem(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to add bundle item."
        );
      }
    };

  if (
    editing
  ) {
    return (
      <BundleForm
        initialValues={{
          code:
            bundle.code,

          name:
            bundle.name,

          description:
            bundle.description ||
            "",

          priceMode:
            bundle.priceMode,

          priceAmount:
            bundle.priceAmount ===
              null ||
            bundle.priceAmount ===
              undefined
              ? null
              : Number(
                  bundle.priceAmount
                ),

          currencyCode:
            bundle.currencyCode ||
            "AED",

          protectionSchemeId:
            bundle.protectionSchemeId ||
            "",

          protectionIncluded:
            bundle.protectionIncluded,

          badgeText:
            bundle.badgeText ||
            "",

          isDefault:
            bundle.isDefault,

          isActive:
            bundle.isActive,

          sortOrder:
            Number(
              bundle.sortOrder ||
              0
            ),
        }}
        isSaving={
          updatingBundle
        }
        onCancel={() =>
          setEditing(
            false
          )
        }
        onSave={
          update
        }
      />
    );
  }

  const items =
    [
      ...(
        bundle.items ||
        []
      ),
    ].sort(
      (
        a,
        b
      ) =>
        Number(
          a.sortOrder ||
          0
        ) -
        Number(
          b.sortOrder ||
          0
        )
    );

  return (
    <section className="overflow-hidden rounded-xl border border-[#d8dde3] bg-white">
      <div className="border-b border-[#e1e3e5] bg-[#fafbfb] p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-base font-semibold text-[#202223]">
                {
                  bundle.name
                }
              </h4>

              {bundle.isDefault ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                  Default
                </span>
              ) : null}

              {!bundle.isActive ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  Disabled
                </span>
              ) : null}
            </div>

            <p className="mt-1 font-mono text-xs text-[#6d7175]">
              {
                bundle.code
              }
            </p>

            {bundle.description ? (
              <p className="mt-2 text-xs leading-5 text-[#6d7175]">
                {
                  bundle.description
                }
              </p>
            ) : null}

            {bundle.protectionScheme ? (
              <div className="mt-3 inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Protection:{" "}
                <strong className="ml-1">
                  {
                    bundle
                      .protectionScheme
                      .name
                  }
                </strong>

                {bundle.protectionIncluded
                  ? " · Included"
                  : ""}
              </div>
            ) : null}
          </div>

          <div className="flex gap-1">
            <button
              type="button"
              onClick={() =>
                setEditing(
                  true
                )
              }
              className="h-9 rounded-lg border border-[#babfc3] bg-white px-3 text-xs font-semibold hover:bg-[#f6f6f7]"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={
                deletingBundle
              }
              onClick={
                remove
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {deletingBundle ? (
                <LoaderCircle
                  size={
                    15
                  }
                  className="animate-spin"
                />
              ) : (
                <Trash2
                  size={
                    15
                  }
                />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-4">
        {/* Bundle Items */}

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h5 className="text-sm font-semibold text-[#202223]">
                Included items
              </h5>

              <p className="mt-1 text-xs text-[#6d7175]">
                Accessories or descriptive items included in this bundle.
              </p>
            </div>

            {!addingItem ? (
              <button
                type="button"
                onClick={() =>
                  setAddingItem(
                    true
                  )
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-xs font-semibold hover:bg-[#f6f6f7]"
              >
                <Plus
                  size={
                    15
                  }
                />

                Add item
              </button>
            ) : null}
          </div>

          {addingItem ? (
            <div className="mt-4">
              <BundleItemForm
                isSaving={
                  creatingItem
                }
                onCancel={() =>
                  setAddingItem(
                    false
                  )
                }
                onSave={
                  addItem
                }
              />
            </div>
          ) : null}

          {items.length ===
          0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#babfc3] bg-[#fafbfb] p-4 text-center text-xs text-[#6d7175]">
              No bundle items added.
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map(
                (
                  item
                ) => (
                  <ExistingBundleItem
                    key={
                      item.id
                    }
                    item={
                      item
                    }
                    onChanged={
                      onChanged
                    }
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Allocation */}

        <div className="border-t border-[#e1e3e5] pt-5">
          <PreBookingAllocationEditor
            mode="BUNDLE"
            campaignProductId={
              bundle.campaignProductId
            }
            bundleId={
              bundle.id
            }
            variants={
              parentProduct.variants ||
              []
            }
            allocations={
              bundle.allocations ||
              []
            }
            onChanged={
              onChanged
            }
          />
        </div>
      </div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Bundle Form
|--------------------------------------------------------------------------
*/

function BundleForm({
  initialValues,
  isSaving = false,
  onSave,
  onCancel,
}: {
  initialValues?:
    BundleFormValues;

  isSaving?:
    boolean;

  onSave: (
    values:
      BundleFormValues
  ) => Promise<void>;

  onCancel:
    () => void;
}) {
  const {
    data:
      protectionData,
    isLoading:
      loadingProtection,
  } =
    useGetProtectionSchemesQuery({
      page:
        1,

      pageSize:
        200,

      schemeType:
        "DAMAGE_PROTECTION",

      isActive:
        true,

      sortBy:
        "sortOrder",

      sortDirection:
        "ASC",
    });

  const [
    values,
    setValues,
  ] =
    useState<BundleFormValues>(
      initialValues || {
        code:
          "",

        name:
          "",

        description:
          "",

        priceMode:
          "INHERIT_PRODUCT",

        priceAmount:
          null,

        currencyCode:
          "AED",

        protectionSchemeId:
          "",

        protectionIncluded:
          false,

        badgeText:
          "",

        isDefault:
          false,

        isActive:
          true,

        sortOrder:
          0,
      }
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const busy =
    saving ||
    isSaving;

  const schemes =
    protectionData?.data ||
    [];

  const set = <
    K extends keyof BundleFormValues,
  >(
    field: K,
    value:
      BundleFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const submit =
    async () => {
      if (
        !values.name.trim()
      ) {
        window.alert(
          "Bundle name is required."
        );

        return;
      }

      if (
        !values.code.trim()
      ) {
        window.alert(
          "Bundle code is required."
        );

        return;
      }

      if (
        values.priceMode !==
          "INHERIT_PRODUCT" &&
        (
          values.priceAmount ===
            null ||
          values.priceAmount <
            0
        )
      ) {
        window.alert(
          "Enter a valid bundle price amount."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        await onSave({
          ...values,

          code:
            values.code
              .trim()
              .toUpperCase()
              .replace(
                /[^A-Z0-9]+/g,
                "_"
              )
              .replace(
                /^_+|_+$/g,
                ""
              ),

          name:
            values.name.trim(),
        });
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <div className="rounded-xl border border-[#d8dde3] bg-[#fafbfb] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            Bundle name
          </FieldLabel>

          <input
            value={
              values.name
            }
            onChange={(
              event
            ) =>
              set(
                "name",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            placeholder="Blue Pebble Bundle"
          />
        </div>

        <div>
          <FieldLabel>
            Bundle code
          </FieldLabel>

          <input
            value={
              values.code
            }
            onChange={(
              event
            ) =>
              set(
                "code",
                event
                  .target
                  .value
              )
            }
            className="admin-input font-mono"
            placeholder="BLUE_PEBBLE"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Description
          </FieldLabel>

          <textarea
            rows={
              3
            }
            value={
              values.description
            }
            onChange={(
              event
            ) =>
              set(
                "description",
                event
                  .target
                  .value
              )
            }
            className="admin-input min-h-[90px]"
          />
        </div>

        <div>
          <FieldLabel>
            Price mode
          </FieldLabel>

          <select
            value={
              values.priceMode
            }
            onChange={(
              event
            ) =>
              set(
                "priceMode",
                event
                  .target
                  .value as
                  PreBookingBundlePriceMode
              )
            }
            className="admin-input"
          >
            <option value="INHERIT_PRODUCT">
              Use product price
            </option>

            <option value="FIXED_TOTAL">
              Fixed bundle total
            </option>

            <option value="ADD_ON">
              Add-on amount
            </option>
          </select>
        </div>

        <div>
          <FieldLabel>
            Price amount
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            step="0.01"
            disabled={
              values.priceMode ===
              "INHERIT_PRODUCT"
            }
            value={
              values.priceAmount ??
              ""
            }
            onChange={(
              event
            ) =>
              set(
                "priceAmount",
                event
                  .target
                  .value ===
                  ""
                  ? null
                  : Number(
                      event
                        .target
                        .value
                    )
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Currency
          </FieldLabel>

          <input
            value={
              values.currencyCode
            }
            maxLength={
              3
            }
            onChange={(
              event
            ) =>
              set(
                "currencyCode",
                event
                  .target
                  .value
                  .toUpperCase()
              )
            }
            className="admin-input"
          />
        </div>

        <div>
          <FieldLabel>
            Badge
          </FieldLabel>

          <input
            value={
              values.badgeText
            }
            onChange={(
              event
            ) =>
              set(
                "badgeText",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            placeholder="Popular"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Damage protection
          </FieldLabel>

          <select
            value={
              values
                .protectionSchemeId
            }
            disabled={
              loadingProtection
            }
            onChange={(
              event
            ) => {
              const schemeId =
                event
                  .target
                  .value;

              setValues(
                (
                  current
                ) => ({
                  ...current,

                  protectionSchemeId:
                    schemeId,

                  protectionIncluded:
                    schemeId
                      ? current.protectionIncluded
                      : false,
                })
              );
            }}
            className="admin-input"
          >
            <option value="">
              No protection
            </option>

            {schemes.map(
              (
                scheme
              ) => (
                <option
                  key={
                    scheme.id
                  }
                  value={
                    scheme.id
                  }
                >
                  {
                    scheme.name
                  }
                  {scheme.durationMonths
                    ? ` · ${scheme.durationMonths} months`
                    : ""}
                </option>
              )
            )}
          </select>

          <p className="mt-1 text-xs text-[#6d7175]">
            Optional. Only active damage-protection schemes are shown.
          </p>
        </div>

        {values.protectionSchemeId ? (
          <div className="md:col-span-2">
            <label className="flex items-start gap-3 rounded-lg border border-[#d8dde3] bg-white p-4">
              <input
                type="checkbox"
                checked={
                  values
                    .protectionIncluded
                }
                onChange={(
                  event
                ) =>
                  set(
                    "protectionIncluded",
                    event
                      .target
                      .checked
                  )
                }
                className="mt-1"
              />

              <span>
                <span className="block text-sm font-semibold text-[#202223]">
                  Protection included in bundle
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                  Enable this when the selected plan is part of the bundle rather than an optional customer add-on.
                </span>
              </span>
            </label>
          </div>
        ) : null}

        <div>
          <FieldLabel>
            Sort order
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            value={
              values.sortOrder
            }
            onChange={(
              event
            ) =>
              set(
                "sortOrder",
                Math.max(
                  0,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    0
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex h-11 items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
            <input
              type="checkbox"
              checked={
                values.isDefault
              }
              onChange={(
                event
              ) =>
                set(
                  "isDefault",
                  event
                    .target
                    .checked
                )
              }
            />

            <span className="text-sm font-medium">
              Default
            </span>
          </label>

          <label className="flex h-11 items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
            <input
              type="checkbox"
              checked={
                values.isActive
              }
              onChange={(
                event
              ) =>
                set(
                  "isActive",
                  event
                    .target
                    .checked
                )
              }
            />

            <span className="text-sm font-medium">
              Active
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            onCancel
          }
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            submit
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle
              size={
                16
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                16
              }
            />
          )}

          Save bundle
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Existing Bundle Item
|--------------------------------------------------------------------------
*/

function ExistingBundleItem({
  item,
  onChanged,
}: {
  item:
    PreBookingBundleItem;

  onChanged?:
    () => void;
}) {
  const [
    editing,
    setEditing,
  ] =
    useState(
      false
    );

  const [
    updateItem,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdatePreBookingBundleItemMutation();

  const [
    deleteItem,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeletePreBookingBundleItemMutation();

  const update =
    async (
      values:
        BundleItemFormValues
    ) => {
      try {
        await updateItem({
          bundleItemId:
            item.id,

          body: {
            itemType:
              values.itemType,

            productId:
              values.itemType ===
              "PRODUCT"
                ? values.productId ||
                  null
                : null,

            productVariantId:
              values.itemType ===
              "PRODUCT"
                ? values.productVariantId ||
                  null
                : null,

            label:
              values.label,

            description:
              values.description.trim() ||
              null,

            quantity:
              values.quantity,

            isIncluded:
              values.isIncluded,

            isActive:
              values.isActive,

            sortOrder:
              values.sortOrder,
          },
        }).unwrap();

        setEditing(
          false
        );

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to update bundle item."
        );
      }
    };

  const remove =
    async () => {
      const confirmed =
        window.confirm(
          `Remove "${item.label}" from this bundle?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      try {
        await deleteItem(
          item.id
        ).unwrap();

        onChanged?.();
      } catch (
        error: any
      ) {
        window.alert(
          error?.data
            ?.error
            ?.message ||
            error?.data
              ?.message ||
            "Unable to delete bundle item."
        );
      }
    };

  if (
    editing
  ) {
    return (
      <BundleItemForm
        initialValues={{
          itemType:
            item.itemType,

          productId:
            item.productId ||
            "",

          productVariantId:
            item.productVariantId ||
            "",

          label:
            item.label,

          description:
            item.description ||
            "",

          quantity:
            Number(
              item.quantity ||
              1
            ),

          isIncluded:
            item.isIncluded,

          isActive:
            item.isActive,

          sortOrder:
            Number(
              item.sortOrder ||
              0
            ),
        }}
        isSaving={
          updating
        }
        onCancel={() =>
          setEditing(
            false
          )
        }
        onSave={
          update
        }
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e1e3e5] bg-white px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-[#202223]">
          {
            item.label
          }
        </p>

        <p className="mt-1 text-xs text-[#6d7175]">
          Qty{" "}
          {
            item.quantity
          }

          {" · "}

          {
            item.itemType
          }

          {!item.isIncluded
            ? " · Not included"
            : ""}
        </p>
      </div>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={() =>
            setEditing(
              true
            )
          }
          className="h-8 rounded-lg border border-[#babfc3] px-3 text-xs font-semibold hover:bg-[#f6f6f7]"
        >
          Edit
        </button>

        <button
          type="button"
          disabled={
            deleting
          }
          onClick={
            remove
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle
              size={
                14
              }
              className="animate-spin"
            />
          ) : (
            <Trash2
              size={
                14
              }
            />
          )}
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Bundle Item Form
|--------------------------------------------------------------------------
*/

function BundleItemForm({
  initialValues,
  isSaving = false,
  onSave,
  onCancel,
}: {
  initialValues?:
    BundleItemFormValues;

  isSaving?:
    boolean;

  onSave: (
    values:
      BundleItemFormValues
  ) => Promise<void>;

  onCancel:
    () => void;
}) {
  const [
    values,
    setValues,
  ] =
    useState<BundleItemFormValues>(
      initialValues || {
        itemType:
          "TEXT",

        productId:
          "",

        productVariantId:
          "",

        label:
          "",

        description:
          "",

        quantity:
          1,

        isIncluded:
          true,

        isActive:
          true,

        sortOrder:
          0,
      }
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false
    );

  const busy =
    saving ||
    isSaving;

  const set = <
    K extends keyof BundleItemFormValues,
  >(
    field: K,
    value:
      BundleItemFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,
        [field]:
          value,
      })
    );
  };

  const submit =
    async () => {
      if (
        !values.label.trim()
      ) {
        window.alert(
          "Bundle item label is required."
        );

        return;
      }

      if (
        values.itemType ===
          "PRODUCT" &&
        !values.productId
      ) {
        window.alert(
          "Select a product for this bundle item."
        );

        return;
      }

      try {
        setSaving(
          true
        );

        await onSave({
          ...values,

          label:
            values.label.trim(),
        });
      } finally {
        setSaving(
          false
        );
      }
    };

  return (
    <div className="rounded-xl border border-[#d8dde3] bg-[#fafbfb] p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>
            Item type
          </FieldLabel>

          <select
            value={
              values.itemType
            }
            onChange={(
              event
            ) =>
              setValues(
                (
                  current
                ) => ({
                  ...current,

                  itemType:
                    event
                      .target
                      .value as
                      PreBookingBundleItemType,

                  productId:
                    event
                      .target
                      .value ===
                    "TEXT"
                      ? ""
                      : current.productId,

                  productVariantId:
                    event
                      .target
                      .value ===
                    "TEXT"
                      ? ""
                      : current.productVariantId,
                })
              )
            }
            className="admin-input"
          >
            <option value="TEXT">
              Descriptive item
            </option>

            <option value="PRODUCT">
              Catalogue product
            </option>
          </select>
        </div>

        <div>
          <FieldLabel>
            Quantity
          </FieldLabel>

          <input
            type="number"
            min={
              1
            }
            value={
              values.quantity
            }
            onChange={(
              event
            ) =>
              set(
                "quantity",
                Math.max(
                  1,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    1
                )
              )
            }
            className="admin-input"
          />
        </div>

        {values.itemType ===
        "PRODUCT" ? (
          <>
            <div>
              <FieldLabel>
                Product ID
              </FieldLabel>

              <input
                value={
                  values.productId
                }
                onChange={(
                  event
                ) =>
                  set(
                    "productId",
                    event
                      .target
                      .value
                  )
                }
                className="admin-input font-mono"
                placeholder="Product UUID"
              />

              <p className="mt-1 text-xs text-[#6d7175]">
                We will replace this with a searchable catalogue selector in the product editor phase.
              </p>
            </div>

            <div>
              <FieldLabel>
                Variant ID
              </FieldLabel>

              <input
                value={
                  values
                    .productVariantId
                }
                onChange={(
                  event
                ) =>
                  set(
                    "productVariantId",
                    event
                      .target
                      .value
                  )
                }
                className="admin-input font-mono"
                placeholder="Optional variant UUID"
              />
            </div>
          </>
        ) : null}

        <div className="md:col-span-2">
          <FieldLabel>
            Label
          </FieldLabel>

          <input
            value={
              values.label
            }
            onChange={(
              event
            ) =>
              set(
                "label",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            placeholder="1 Adapter"
          />
        </div>

        <div className="md:col-span-2">
          <FieldLabel>
            Description
          </FieldLabel>

          <textarea
            rows={
              2
            }
            value={
              values.description
            }
            onChange={(
              event
            ) =>
              set(
                "description",
                event
                  .target
                  .value
              )
            }
            className="admin-input min-h-[70px]"
          />
        </div>

        <div>
          <FieldLabel>
            Sort order
          </FieldLabel>

          <input
            type="number"
            min={
              0
            }
            value={
              values.sortOrder
            }
            onChange={(
              event
            ) =>
              set(
                "sortOrder",
                Math.max(
                  0,
                  Number(
                    event
                      .target
                      .value
                  ) ||
                    0
                )
              )
            }
            className="admin-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex h-11 items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
            <input
              type="checkbox"
              checked={
                values.isIncluded
              }
              onChange={(
                event
              ) =>
                set(
                  "isIncluded",
                  event
                    .target
                    .checked
                )
              }
            />

            <span className="text-sm font-medium">
              Included
            </span>
          </label>

          <label className="flex h-11 items-center gap-3 rounded-lg border border-[#babfc3] bg-white px-4">
            <input
              type="checkbox"
              checked={
                values.isActive
              }
              onChange={(
                event
              ) =>
                set(
                  "isActive",
                  event
                    .target
                    .checked
                )
              }
            />

            <span className="text-sm font-medium">
              Active
            </span>
          </label>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            onCancel
          }
          className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          disabled={
            busy
          }
          onClick={
            submit
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? (
            <LoaderCircle
              size={
                16
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                16
              }
            />
          )}

          Save item
        </button>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Field Label
|--------------------------------------------------------------------------
*/

function FieldLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-[#202223]">
      {
        children
      }
    </label>
  );
}