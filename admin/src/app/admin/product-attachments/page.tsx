"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Link2,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  toast,
} from "sonner";

import {
  useGetBrandsQuery,
} from "@/store/api/brandApi";

import {
  useGetCategoriesQuery,
} from "@/store/api/categoryApi";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import {
  useChangeProductAttachmentRuleStatusMutation,
  useCreateProductAttachmentRuleMutation,
  useDeleteProductAttachmentRuleMutation,
  useGetProductAttachmentRulesQuery,
  useUpdateProductAttachmentRuleMutation,
} from "@/store/api/productAttachmentApi";

import type {
  ProductAttachmentDisplayLocation,
  ProductAttachmentRelationshipType,
  ProductAttachmentRule,
  ProductAttachmentRuleFormValues,
  ProductAttachmentRuleItem,
  ProductAttachmentScopeType,
} from "@/types/productAttachment";

const emptyForm:
  ProductAttachmentRuleFormValues = {
    name:
      "",

    code:
      "",

    scopeType:
      "PRODUCT",

    scopeId:
      "",

    relationshipType:
      "ACCESSORY",

    displayLocation:
      "PRODUCT_DETAIL",

    priority:
      100,

    effectiveFrom:
      null,

    effectiveUntil:
      null,

    isActive:
      true,

    items:
      [],
  };

  function getExistingScopeName(
    rule:
      ProductAttachmentRule | null
  ) {
    if (
      !rule
    ) {
      return null;
    }
  
    if (
      rule.scopeType ===
      "PRODUCT"
    ) {
      return (
        rule.product
          ?.name ||
        null
      );
    }
  
    if (
      rule.scopeType ===
      "BRAND"
    ) {
      return (
        rule.brand
          ?.name ||
        null
      );
    }
  
    return (
      rule.category
        ?.name ||
      null
    );
  }

export default function ProductAttachmentRulesPage() {
  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    scopeFilter,
    setScopeFilter,
  ] =
    useState<
      ProductAttachmentScopeType |
      ""
    >(
      ""
    );

  const [
    locationFilter,
    setLocationFilter,
  ] =
    useState<
      ProductAttachmentDisplayLocation |
      ""
    >(
      ""
    );

  const [
    drawerOpen,
    setDrawerOpen,
  ] =
    useState(
      false
    );

  const [
    editing,
    setEditing,
  ] =
    useState<
      ProductAttachmentRule | null
    >(
      null
    );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetProductAttachmentRulesQuery({
      page,
      pageSize:
        30,

      search:
        search.trim() ||
        undefined,

      scopeType:
        scopeFilter ||
        undefined,

      displayLocation:
        locationFilter ||
        undefined,

      sortBy:
        "priority",

      sortDirection:
        "ASC",
    });

  const [
    changeStatus,
    {
      isLoading:
        changingStatus,
    },
  ] =
    useChangeProductAttachmentRuleStatusMutation();

  const [
    deleteRule,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeleteProductAttachmentRuleMutation();

  const rules =
    data?.data ||
    [];

  const pagination =
    data?.pagination;

  const openCreate =
    () => {
      setEditing(
        null
      );

      setDrawerOpen(
        true
      );
    };

  const openEdit =
    (
      rule:
        ProductAttachmentRule
    ) => {
      setEditing(
        rule
      );

      setDrawerOpen(
        true
      );
    };

  const toggleStatus =
    async (
      rule:
        ProductAttachmentRule
    ) => {
      try {
        await changeStatus({
          id:
            rule.id,

          isActive:
            !rule
              .isActive,
        }).unwrap();

        toast.success(
          rule.isActive
            ? "Attachment rule deactivated."
            : "Attachment rule activated."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update attachment rule status."
          )
        );
      }
    };

  const remove =
    async (
      rule:
        ProductAttachmentRule
    ) => {
      if (
        !window.confirm(
          `Delete "${rule.name}"?`
        )
      ) {
        return;
      }

      try {
        await deleteRule(
          rule.id
        ).unwrap();

        toast.success(
          "Attachment rule deleted."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete attachment rule."
          )
        );
      }
    };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-[#e1e3e5] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6d7175]">
            <Link2
              size={
                18
              }
            />

            Product
            merchandising
          </div>

          <h1 className="mt-1 text-2xl font-bold text-[#202223]">
            Attachment &
            Upsell Rules
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Suggest
            accessories,
            add-ons,
            compatible
            products and
            cross-sells based
            on product, brand
            or category.
          </p>
        </div>

        <button
          type="button"
          onClick={
            openCreate
          }
          className="admin-primary-button"
        >
          <Plus
            size={
              16
            }
          />

          New rule
        </button>
      </header>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#e1e3e5] p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={
                16
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
            />

            <input
              value={
                search
              }
              onChange={(
                event
              ) => {
                setPage(
                  1
                );

                setSearch(
                  event
                    .target
                    .value
                );
              }}
              placeholder="Search rule name or code"
              className="admin-input pl-9"
            />
          </div>

          <select
            value={
              scopeFilter
            }
            onChange={(
              event
            ) => {
              setPage(
                1
              );

              setScopeFilter(
                event
                  .target
                  .value as
                  ProductAttachmentScopeType |
                  ""
              );
            }}
            className="admin-input lg:w-44"
          >
            <option value="">
              All scopes
            </option>

            <option value="PRODUCT">
              Product
            </option>

            <option value="BRAND">
              Brand
            </option>

            <option value="CATEGORY">
              Category
            </option>
          </select>

          <select
            value={
              locationFilter
            }
            onChange={(
              event
            ) => {
              setPage(
                1
              );

              setLocationFilter(
                event
                  .target
                  .value as
                  ProductAttachmentDisplayLocation |
                  ""
              );
            }}
            className="admin-input lg:w-52"
          >
            <option value="">
              All placements
            </option>

            <option value="PRODUCT_DETAIL">
              Product detail
            </option>

            <option value="ADD_TO_CART">
              Add to cart
            </option>

            <option value="CART">
              Cart
            </option>

            <option value="CHECKOUT">
              Checkout
            </option>

            <option value="ALL">
              All
            </option>
          </select>

          <button
            type="button"
            onClick={() =>
              void refetch()
            }
            className="admin-secondary-button"
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

        {isLoading ? (
          <LoadingState />
        ) : rules.length ===
          0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e1e3e5] text-sm">
              <thead className="bg-[#f6f6f7] text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                <tr>
                  <th className="px-5 py-3">
                    Rule
                  </th>

                  <th className="px-5 py-3">
                    Scope
                  </th>

                  <th className="px-5 py-3">
                    Placement
                  </th>

                  <th className="px-5 py-3">
                    Relationship
                  </th>

                  <th className="px-5 py-3">
                    Suggestions
                  </th>

                  <th className="px-5 py-3">
                    Priority
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e1e3e5]">
                {rules.map(
                  (
                    rule
                  ) => (
                    <tr
                      key={
                        rule.id
                      }
                      className="hover:bg-[#fafbfb]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#202223]">
                          {
                            rule.name
                          }
                        </p>

                        <p className="mt-1 font-mono text-xs text-[#8c9196]">
                          {
                            rule.code
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <ScopeBadge
                          scope={
                            rule.scopeType
                          }
                        />

                        <p className="mt-2 max-w-[220px] truncate text-xs text-[#6d7175]">
                          {
                            getScopeTargetName(
                              rule
                            )
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {humanize(
                          rule
                            .displayLocation
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {humanize(
                          rule
                            .relationshipType
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-semibold text-[#202223]">
                          {
                            rule.items
                              ?.length ||
                            0
                          }
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {
                          rule.priority
                        }
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={
                            rule.isActive
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                rule
                              )
                            }
                            className="icon-button"
                            title="Edit rule"
                          >
                            <Edit3
                              size={
                                15
                              }
                            />
                          </button>

                          <button
                            type="button"
                            disabled={
                              changingStatus
                            }
                            onClick={() =>
                              void toggleStatus(
                                rule
                              )
                            }
                            className="admin-secondary-button !h-9 !px-3"
                          >
                            {rule.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            disabled={
                              deleting
                            }
                            onClick={() =>
                              void remove(
                                rule
                              )
                            }
                            className="icon-button text-[#d72c0d]"
                            title="Delete rule"
                          >
                            <Trash2
                              size={
                                15
                              }
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination &&
        pagination.totalPages >
          1 ? (
          <div className="flex items-center justify-between border-t border-[#e1e3e5] px-5 py-4">
            <p className="text-sm text-[#6d7175]">
              Page{" "}
              {
                pagination.page
              }{" "}
              of{" "}
              {
                pagination.totalPages
              }
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  page <=
                  1
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
                          1
                      )
                  )
                }
                className="icon-button"
              >
                <ChevronLeft
                  size={
                    16
                  }
                />
              </button>

              <button
                type="button"
                disabled={
                  page >=
                  pagination.totalPages
                }
                onClick={() =>
                  setPage(
                    (
                      current
                    ) =>
                      current +
                      1
                  )
                }
                className="icon-button"
              >
                <ChevronRight
                  size={
                    16
                  }
                />
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {drawerOpen ? (
        <AttachmentRuleDrawer
          rule={
            editing
          }
          onClose={() =>
            setDrawerOpen(
              false
            )
          }
          onSaved={async () => {
            setDrawerOpen(
              false
            );

            await refetch();
          }}
        />
      ) : null}
    </div>
  );
}

function AttachmentRuleDrawer({
  rule,
  onClose,
  onSaved,
}: {
  rule:
    ProductAttachmentRule | null;

  onClose: () => void;

  onSaved: () =>
    Promise<void> |
    void;
}) {
  const [
    values,
    setValues,
  ] =
    useState<
      ProductAttachmentRuleFormValues
    >(
      rule
        ? {
            name:
              rule.name,

            code:
              rule.code,

            scopeType:
              rule.scopeType,

            scopeId:
              rule.scopeId,

            relationshipType:
              rule.relationshipType,

            displayLocation:
              rule.displayLocation,

            priority:
              rule.priority,

            effectiveFrom:
              toDateInput(
                rule.effectiveFrom
              ),

            effectiveUntil:
              toDateInput(
                rule.effectiveUntil
              ),

            isActive:
              rule.isActive,

            items:
              (
                rule.items ||
                []
              ).map(
                (
                  item,
                  index
                ) => ({
                  id:
                    item.id,

                  attachmentProductId:
                    item
                      .attachmentProductId,

                  sortOrder:
                    item.sortOrder ??
                    index,

                  minimumQuantity:
                    item.minimumQuantity ||
                    1,

                  maximumQuantity:
                    item.maximumQuantity ??
                    null,

                  isActive:
                    item.isActive !==
                    false,

                  attachmentProduct:
                    item
                      .attachmentProduct ||
                    null,
                })
              ),
          }
        : emptyForm
    );

  const [
    targetSearch,
    setTargetSearch,
  ] =
    useState(
      ""
    );

  const [
    attachmentSearch,
    setAttachmentSearch,
  ] =
    useState(
      ""
    );

  const [
    createRule,
    {
      isLoading:
        creating,
    },
  ] =
    useCreateProductAttachmentRuleMutation();

  const [
    updateRule,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdateProductAttachmentRuleMutation();

  const saving =
    creating ||
    updating;

  const {
    data:
      brandsResponse,
  } =
    useGetBrandsQuery(
      {
        page:
          1,

        pageSize:
          200,

        search:
          targetSearch.trim() ||
          undefined,

        isActive:
          true,

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          values.scopeType !==
          "BRAND",
      }
    );

  const {
    data:
      categoriesResponse,
  } =
    useGetCategoriesQuery(
      {
        page:
          1,

        pageSize:
          200,

        search:
          targetSearch.trim() ||
          undefined,

        isActive:
          true,
      },
      {
        skip:
          values.scopeType !==
          "CATEGORY",
      }
    );

  const {
    data:
      productsResponse,
  } =
    useGetProductsQuery(
      {
        page:
          1,

        pageSize:
          200,

        search:
          targetSearch.trim() ||
          undefined,

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          values.scopeType !==
          "PRODUCT",
      }
    );

  const {
    data:
      attachmentProductsResponse,
    isFetching:
      attachmentProductsFetching,
  } =
    useGetProductsQuery({
      page:
        1,

      pageSize:
        200,

      search:
        attachmentSearch.trim() ||
        undefined,

      sortBy:
        "name",

      sortDirection:
        "ASC",
    });

  const targetOptions =
    useMemo(
      () => {
        if (
          values.scopeType ===
          "BRAND"
        ) {
          return (
            brandsResponse?.data ||
            []
          ).map(
            (
              item
            ) => ({
              id:
                item.id,

              name:
                item.name,
            })
          );
        }

        if (
          values.scopeType ===
          "CATEGORY"
        ) {
          return (
            categoriesResponse
              ?.data
              ?.categories ||
            []
          ).map(
            (
              item
            ) => ({
              id:
                item.id,

              name:
                item.name,
            })
          );
        }

        return (
          productsResponse?.data ||
          []
        ).map(
          (
            item
          ) => ({
            id:
              item.id,

            name:
              item.name,
          })
        );
      },
      [
        brandsResponse,
        categoriesResponse,
        productsResponse,
        values.scopeType,
      ]
    );

  const attachmentOptions =
    useMemo(
      () =>
        (
          attachmentProductsResponse
            ?.data ||
          []
        )
          .filter(
            (
              product
            ) =>
              !values.items
                .some(
                  (
                    item
                  ) =>
                    item
                      .attachmentProductId ===
                    product.id
                )
          )
          .filter(
            (
              product
            ) =>
              !(
                values.scopeType ===
                  "PRODUCT" &&
                values.scopeId ===
                  product.id
              )
          ),
      [
        attachmentProductsResponse,
        values.items,
        values.scopeId,
        values.scopeType,
      ]
    );

  const setField = <
    K extends keyof ProductAttachmentRuleFormValues,
  >(
    key:
      K,

    value:
      ProductAttachmentRuleFormValues[K]
  ) => {
    setValues(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  };

  const addAttachment =
    (
      product: {
        id: string;
        name: string;
      }
    ) => {
      setValues(
        (
          current
        ) => ({
          ...current,

          items: [
            ...current.items,

            {
              attachmentProductId:
                product.id,

              sortOrder:
                current.items
                  .length *
                  10 +
                10,

              minimumQuantity:
                1,

              maximumQuantity:
                1,

              isActive:
                true,

              attachmentProduct: {
                id:
                  product.id,

                name:
                  product.name,
              },
            },
          ],
        })
      );
    };

  const removeAttachment =
    (
      index:
        number
    ) => {
      setValues(
        (
          current
        ) => ({
          ...current,

          items:
            current.items
              .filter(
                (
                  _item,
                  itemIndex
                ) =>
                  itemIndex !==
                  index
              )
              .map(
                (
                  item,
                  itemIndex
                ) => ({
                  ...item,

                  sortOrder:
                    (
                      itemIndex +
                      1
                    ) *
                    10,
                })
              ),
        })
      );
    };

  const updateAttachment =
    (
      index:
        number,

      patch:
        Partial<ProductAttachmentRuleItem>
    ) => {
      setValues(
        (
          current
        ) => ({
          ...current,

          items:
            current.items
              .map(
                (
                  item,
                  itemIndex
                ) =>
                  itemIndex ===
                  index
                    ? {
                        ...item,
                        ...patch,
                      }
                    : item
              ),
        })
      );
    };

  const moveAttachment =
    (
      index:
        number,

      direction:
        -1 |
        1
    ) => {
      const nextIndex =
        index +
        direction;

      if (
        nextIndex <
          0 ||
        nextIndex >=
          values.items
            .length
      ) {
        return;
      }

      setValues(
        (
          current
        ) => {
          const items = [
            ...current.items,
          ];

          [
            items[index],
            items[nextIndex],
          ] = [
            items[nextIndex],
            items[index],
          ];

          return {
            ...current,

            items:
              items.map(
                (
                  item,
                  itemIndex
                ) => ({
                  ...item,

                  sortOrder:
                    (
                      itemIndex +
                      1
                    ) *
                    10,
                })
              ),
          };
        }
      );
    };

  const save =
    async () => {
      if (
        !values.name
          .trim()
      ) {
        toast.error(
          "Rule name is required."
        );

        return;
      }

      if (
        !values.scopeId
      ) {
        toast.error(
          `Select a ${values.scopeType.toLowerCase()}.`
        );

        return;
      }

      if (
        values.items.length ===
        0
      ) {
        toast.error(
          "Add at least one suggested product."
        );

        return;
      }

      try {
        const payload:
          ProductAttachmentRuleFormValues = {
            ...values,

            code:
              values.code
                ?.trim() ||
              null,

            effectiveFrom:
              values.effectiveFrom ||
              null,

            effectiveUntil:
              values.effectiveUntil ||
              null,

            items:
              values.items.map(
                (
                  item,
                  index
                ) => ({
                  attachmentProductId:
                    item
                      .attachmentProductId,

                  sortOrder:
                    (
                      index +
                      1
                    ) *
                    10,

                  minimumQuantity:
                    Math.max(
                      1,
                      Number(
                        item
                          .minimumQuantity ||
                          1
                      )
                    ),

                  maximumQuantity:
                    item.maximumQuantity ===
                      null ||
                    item.maximumQuantity ===
                      undefined
                      ? null
                      : Math.max(
                          1,
                          Number(
                            item
                              .maximumQuantity
                          )
                        ),

                  isActive:
                    item.isActive !==
                    false,
                })
              ),
          };

        if (
          rule
        ) {
          await updateRule({
            id:
              rule.id,

            values:
              payload,
          }).unwrap();

          toast.success(
            "Attachment rule updated."
          );
        } else {
          await createRule(
            payload
          ).unwrap();

          toast.success(
            "Attachment rule created."
          );
        }

        await onSaved();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to save attachment rule."
          )
        );
      }
    };

  return (
    <Drawer
      title={
        rule
          ? "Edit attachment rule"
          : "New attachment rule"
      }
      onClose={
        onClose
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Rule name">
            <input
              value={
                values.name
              }
              onChange={(
                event
              ) =>
                setField(
                  "name",
                  event
                    .target
                    .value
                )
              }
              className="admin-input"
              placeholder="iPhone Essentials"
            />
          </Field>

          <Field label="Code">
            <input
              value={
                values.code ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "code",
                  event
                    .target
                    .value
                    .toUpperCase()
                )
              }
              className="admin-input"
              placeholder="IPHONE_ESSENTIALS"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Scope">
            <select
              value={
                values.scopeType
              }
              onChange={(
                event
              ) => {
                setField(
                  "scopeType",
                  event
                    .target
                    .value as ProductAttachmentScopeType
                );

                setField(
                  "scopeId",
                  ""
                );

                setTargetSearch(
                  ""
                );
              }}
              className="admin-input"
            >
              <option value="PRODUCT">
                Product
              </option>

              <option value="BRAND">
                Brand
              </option>

              <option value="CATEGORY">
                Category
              </option>
            </select>
          </Field>

          <Field label="Priority">
            <input
              type="number"
              min={
                0
              }
              value={
                values.priority
              }
              onChange={(
                event
              ) =>
                setField(
                  "priority",
                  Number(
                    event
                      .target
                      .value
                  )
                )
              }
              className="admin-input"
            />
          </Field>
        </div>

        <Field
  label={`Select ${values.scopeType.toLowerCase()}`}
  help="Search and click the product, brand or category that should trigger these suggestions."
>
  <div className="relative">
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
    />

    <input
      value={targetSearch}
      onChange={(event) => {
        setTargetSearch(
          event.target.value
        );
      }}
      placeholder={`Search ${values.scopeType.toLowerCase()}…`}
      className="admin-input pl-9"
    />
  </div>

  {values.scopeId ? (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-[#008060] bg-[#f0fdf8] px-4 py-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#008060]">
          Selected {values.scopeType.toLowerCase()}
        </p>

        <p className="mt-1 text-sm font-semibold text-[#202223]">
          {targetOptions.find(
            (target) =>
              target.id ===
              values.scopeId
          )?.name ||
            getExistingScopeName(
              rule
            ) ||
            values.scopeId}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setField(
            "scopeId",
            ""
          );

          setTargetSearch(
            ""
          );
        }}
        className="icon-button"
        title="Remove selection"
      >
        <X
          size={16}
        />
      </button>
    </div>
  ) : null}

  {targetSearch.trim() ? (
    <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-[#e1e3e5] bg-white shadow-sm">
      {targetOptions.length > 0 ? (
        targetOptions
          .slice(
            0,
            50
          )
          .map(
            (target) => (
              <button
                key={
                  target.id
                }
                type="button"
                onClick={() => {
                  setField(
                    "scopeId",
                    target.id
                  );

                  setTargetSearch(
                    target.name
                  );
                }}
                className={[
                  "flex w-full items-center justify-between border-b border-[#f1f2f3] px-4 py-3 text-left transition last:border-b-0 hover:bg-[#f6f6f7]",
                  values.scopeId ===
                  target.id
                    ? "bg-[#f0fdf8]"
                    : "",
                ].join(
                  " "
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202223]">
                    {
                      target.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-[#8c9196]">
                    {humanize(
                      values.scopeType
                    )}
                  </p>
                </div>

                {values.scopeId ===
                target.id ? (
                  <span className="rounded-full bg-[#008060] px-2.5 py-1 text-xs font-semibold text-white">
                    Selected
                  </span>
                ) : (
                  <Plus
                    size={16}
                    className="shrink-0 text-[#008060]"
                  />
                )}
              </button>
            )
          )
      ) : (
        <div className="px-4 py-6 text-center">
          <p className="text-sm font-semibold text-[#5c5f62]">
            No matching{" "}
            {values.scopeType.toLowerCase()}s
            found.
          </p>

          <p className="mt-1 text-xs text-[#8c9196]">
            Try another search
            term.
          </p>
        </div>
      )}
    </div>
  ) : (
    <p className="mt-2 text-xs text-[#8c9196]">
      Start typing to search.
    </p>
  )}
</Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Relationship">
            <select
              value={
                values.relationshipType
              }
              onChange={(
                event
              ) =>
                setField(
                  "relationshipType",
                  event
                    .target
                    .value as ProductAttachmentRelationshipType
                )
              }
              className="admin-input"
            >
              <option value="ACCESSORY">
                Accessory
              </option>

              <option value="UPSELL">
                Upsell
              </option>

              <option value="CROSS_SELL">
                Cross sell
              </option>

              <option value="ADD_ON">
                Add on
              </option>

              <option value="BUNDLE_SUGGESTION">
                Bundle suggestion
              </option>

              <option value="COMPATIBLE_PRODUCT">
                Compatible product
              </option>
            </select>
          </Field>

          <Field label="Placement">
            <select
              value={
                values.displayLocation
              }
              onChange={(
                event
              ) =>
                setField(
                  "displayLocation",
                  event
                    .target
                    .value as ProductAttachmentDisplayLocation
                )
              }
              className="admin-input"
            >
              <option value="PRODUCT_DETAIL">
                Product detail
              </option>

              <option value="ADD_TO_CART">
                Add to cart
              </option>

              <option value="CART">
                Cart
              </option>

              <option value="CHECKOUT">
                Checkout
              </option>

              <option value="ALL">
                All
              </option>
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Effective from">
            <input
              type="date"
              value={
                values.effectiveFrom ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "effectiveFrom",
                  event
                    .target
                    .value ||
                  null
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Effective until">
            <input
              type="date"
              value={
                values.effectiveUntil ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "effectiveUntil",
                  event
                    .target
                    .value ||
                  null
                )
              }
              className="admin-input"
            />
          </Field>
        </div>

        <ToggleRow
          title="Active"
          description="Inactive rules are ignored by the storefront resolver."
          checked={
            values.isActive
          }
          onChange={(
            checked
          ) =>
            setField(
              "isActive",
              checked
            )
          }
        />

        <div className="border-t border-[#e1e3e5] pt-6">
          <div>
            <h3 className="font-bold text-[#202223]">
              Suggested
              products
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              Search your
              catalogue and add
              the products that
              should be shown to
              the customer.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
            <div className="relative">
              <Search
                size={
                  16
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                value={
                  attachmentSearch
                }
                onChange={(
                  event
                ) =>
                  setAttachmentSearch(
                    event
                      .target
                      .value
                  )
                }
                placeholder="Search products to attach…"
                className="admin-input pl-9"
              />
            </div>

            {attachmentProductsFetching ? (
              <p className="mt-3 text-xs text-[#8c9196]">
                Loading
                products…
              </p>
            ) : null}

            {attachmentSearch.trim() &&
            attachmentOptions.length >
              0 ? (
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-[#e1e3e5] bg-white">
                {attachmentOptions
                  .slice(
                    0,
                    30
                  )
                  .map(
                    (
                      product
                    ) => (
                      <button
                        key={
                          product.id
                        }
                        type="button"
                        onClick={() => {
                          addAttachment(
                            product
                          );

                          setAttachmentSearch(
                            ""
                          );
                        }}
                        className="flex w-full items-center justify-between border-b border-[#f1f2f3] px-4 py-3 text-left last:border-b-0 hover:bg-[#fafbfb]"
                      >
                        <span className="text-sm font-semibold text-[#202223]">
                          {
                            product.name
                          }
                        </span>

                        <Plus
                          size={
                            16
                          }
                          className="text-[#008060]"
                        />
                      </button>
                    )
                  )}
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {values.items.length ===
            0 ? (
              <div className="rounded-xl border border-dashed border-[#c9cccf] p-6 text-center text-sm text-[#6d7175]">
                No suggested
                products added
                yet.
              </div>
            ) : (
              values.items.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item
                        .attachmentProductId
                    }
                    className="rounded-xl border border-[#e1e3e5] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#202223]">
                          {item
                            .attachmentProduct
                            ?.name ||
                            item
                              .attachmentProductId}
                        </p>

                        <p className="mt-1 text-xs text-[#8c9196]">
                          Position{" "}
                          {
                            index +
                            1
                          }
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeAttachment(
                            index
                          )
                        }
                        className="icon-button text-[#d72c0d]"
                      >
                        <Trash2
                          size={
                            15
                          }
                        />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-4">
                      <Field label="Min qty">
                        <input
                          type="number"
                          min={
                            1
                          }
                          value={
                            item.minimumQuantity
                          }
                          onChange={(
                            event
                          ) =>
                            updateAttachment(
                              index,
                              {
                                minimumQuantity:
                                  Number(
                                    event
                                      .target
                                      .value
                                  ),
                              }
                            )
                          }
                          className="admin-input"
                        />
                      </Field>

                      <Field label="Max qty">
                        <input
                          type="number"
                          min={
                            1
                          }
                          value={
                            item.maximumQuantity ??
                            ""
                          }
                          onChange={(
                            event
                          ) =>
                            updateAttachment(
                              index,
                              {
                                maximumQuantity:
                                  event
                                    .target
                                    .value ===
                                  ""
                                    ? null
                                    : Number(
                                        event
                                          .target
                                          .value
                                      ),
                              }
                            )
                          }
                          className="admin-input"
                          placeholder="No limit"
                        />
                      </Field>

                      <div className="flex items-end gap-2">
                        <button
                          type="button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            moveAttachment(
                              index,
                              -1
                            )
                          }
                          className="admin-secondary-button !h-10 !px-3"
                        >
                          Up
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            values.items
                              .length -
                              1
                          }
                          onClick={() =>
                            moveAttachment(
                              index,
                              1
                            )
                          }
                          className="admin-secondary-button !h-10 !px-3"
                        >
                          Down
                        </button>
                      </div>

                      <div className="flex items-end">
                        <ToggleCompact
                          checked={
                            item.isActive
                          }
                          onChange={(
                            checked
                          ) =>
                            updateAttachment(
                              index,
                              {
                                isActive:
                                  checked,
                              }
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#e1e3e5] pt-5">
          <button
            type="button"
            onClick={
              onClose
            }
            className="admin-secondary-button"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={() =>
              void save()
            }
            className="admin-primary-button"
          >
            {saving ? (
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

            Save rule
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function Drawer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[90] flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close"
        onClick={
          onClose
        }
        className="absolute inset-0"
      />

      <div className="relative z-10 h-full w-full max-w-3xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e1e3e5] bg-white px-6 py-5">
          <h2 className="text-lg font-bold text-[#202223]">
            {
              title
            }
          </h2>

          <button
            type="button"
            onClick={
              onClose
            }
            className="icon-button"
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>

        <div className="p-6">
          {
            children
          }
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-[#202223]">
        {
          label
        }
      </span>

      {
        children
      }

      {help ? (
        <span className="mt-1.5 block text-xs leading-5 text-[#8c9196]">
          {
            help
          }
        </span>
      ) : null}
    </label>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 rounded-xl border border-[#e1e3e5] p-4">
      <div>
        <p className="font-semibold text-[#202223]">
          {
            title
          }
        </p>

        <p className="mt-1 text-sm leading-5 text-[#6d7175]">
          {
            description
          }
        </p>
      </div>

      <ToggleCompact
        checked={
          checked
        }
        onChange={
          onChange
        }
      />
    </div>
  );
}

function ToggleCompact({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }
      onClick={() =>
        onChange(
          !checked
        )
      }
      className={[
        "relative h-6 w-11 shrink-0 rounded-full transition",
        checked
          ? "bg-[#008060]"
          : "bg-[#babfc3]",
      ].join(
        " "
      )}
    >
      <span
        className={[
          "absolute top-1 h-4 w-4 rounded-full bg-white shadow transition",
          checked
            ? "left-6"
            : "left-1",
        ].join(
          " "
        )}
      />
    </button>
  );
}

function ScopeBadge({
  scope,
}: {
  scope:
    ProductAttachmentScopeType;
}) {
  const className =
    scope ===
    "PRODUCT"
      ? "bg-[#e4f2ff] text-[#004299]"
      : scope ===
          "BRAND"
        ? "bg-[#f4e7ff] text-[#5c1f87]"
        : "bg-[#fff4c2] text-[#6f4e00]";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {
        humanize(
          scope
        )
      }
    </span>
  );
}

function StatusBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        active
          ? "bg-[#aee9d1] text-[#0c5132]"
          : "bg-[#e4e5e7] text-[#5c5f62]",
      ].join(
        " "
      )}
    >
      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#6d7175]">
      <LoaderCircle
        size={
          18
        }
        className="animate-spin"
      />

      Loading attachment
      rules…
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 text-center">
      <Link2
        size={
          30
        }
        className="mx-auto text-[#8c9196]"
      />

      <h3 className="mt-3 font-bold text-[#202223]">
        No attachment
        rules
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6d7175]">
        Create your first
        rule to suggest
        accessories,
        add-ons or
        compatible products.
      </p>
    </div>
  );
}

function getScopeTargetName(
  rule:
    ProductAttachmentRule
) {
  if (
    rule.scopeType ===
    "PRODUCT"
  ) {
    return (
      rule.product
        ?.name ||
      rule.scopeId
    );
  }

  if (
    rule.scopeType ===
    "BRAND"
  ) {
    return (
      rule.brand
        ?.name ||
      rule.scopeId
    );
  }

  return (
    rule.category
      ?.name ||
    rule.scopeId
  );
}

function humanize(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function toDateInput(
  value?:
    | string
    | null
) {
  if (
    !value
  ) {
    return null;
  }

  const parsed =
    new Date(
      value
    );

  if (
    Number.isNaN(
      parsed.getTime()
    )
  ) {
    return null;
  }

  return parsed
    .toISOString()
    .slice(
      0,
      10
    );
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
) {
  const normalized =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;
      };

      message?:
        string;
    };

  return (
    normalized
      ?.data
      ?.error
      ?.message ||
    normalized
      ?.data
      ?.message ||
    normalized
      ?.message ||
    fallback
  );
}
