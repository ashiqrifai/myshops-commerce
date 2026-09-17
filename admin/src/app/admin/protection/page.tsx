"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Edit3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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
  useChangeProtectionAssignmentStatusMutation,
  useChangeProtectionSchemeStatusMutation,
  useCreateProtectionAssignmentMutation,
  useCreateProtectionSchemeMutation,
  useDeleteProtectionAssignmentMutation,
  useDeleteProtectionSchemeMutation,
  useGetProtectionAssignmentsQuery,
  useGetProtectionSchemesQuery,
  useGetProtectionSettingQuery,
  useUpdateProtectionAssignmentMutation,
  useUpdateProtectionSchemeMutation,
  useUpdateProtectionSettingMutation,
} from "@/store/api/protectionApi";

import type {
  ProtectionAssignment,
  ProtectionAssignmentFormValues,
  ProtectionPricingMethod,
  ProtectionScheme,
  ProtectionSchemeFormValues,
  ProtectionSchemeType,
  ProtectionScopeType,
} from "@/types/protection";

type Tab =
  | "SETTINGS"
  | "SCHEMES"
  | "ASSIGNMENTS";

const defaultSchemeForm:
  ProtectionSchemeFormValues = {
    code:
      "",

    name:
      "",

    description:
      "",

    schemeType:
      "EXTENDED_WARRANTY",

    durationMonths:
      12,

    pricingMethod:
      "PERCENTAGE",

    percentage:
      8,

    fixedAmount:
      null,

    minimumProductAmount:
      null,

    maximumProductAmount:
      null,

    currencyCode:
      "AED",

    coverageStartMode:
      "AFTER_MANUFACTURER_WARRANTY",

    termsAndConditions:
      "",

    sortOrder:
      10,

    isActive:
      true,
  };

const defaultAssignmentForm:
  ProtectionAssignmentFormValues = {
    schemeId:
      "",

    scopeType:
      "BRAND",

    scopeId:
      "",

    pricingMethod:
      null,

    percentage:
      null,

    fixedAmount:
      null,

    minimumProductAmount:
      null,

    maximumProductAmount:
      null,

    effectiveFrom:
      null,

    effectiveUntil:
      null,

    priority:
      10,

    isActive:
      true,
  };

export default function ProtectionAdminPage() {
  const [
    tab,
    setTab,
  ] =
    useState<Tab>(
      "SETTINGS"
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-[#e1e3e5] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#6d7175]">
            <ShieldCheck
              size={
                18
              }
            />

            Protection
            Management
          </div>

          <h1 className="mt-1 text-2xl font-bold text-[#202223]">
            Extended Warranty
            & Damage
            Protection
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
            Configure global
            eligibility,
            protection schemes
            and product, brand
            or category
            overrides.
          </p>
        </div>
      </header>

      <div className="inline-flex rounded-xl border border-[#c9cccf] bg-white p-1 shadow-sm">
        <TabButton
          active={
            tab ===
            "SETTINGS"
          }
          onClick={() =>
            setTab(
              "SETTINGS"
            )
          }
        >
          Settings
        </TabButton>

        <TabButton
          active={
            tab ===
            "SCHEMES"
          }
          onClick={() =>
            setTab(
              "SCHEMES"
            )
          }
        >
          Schemes
        </TabButton>

        <TabButton
          active={
            tab ===
            "ASSIGNMENTS"
          }
          onClick={() =>
            setTab(
              "ASSIGNMENTS"
            )
          }
        >
          Assignments
        </TabButton>
      </div>

      {tab ===
      "SETTINGS" ? (
        <SettingsTab />
      ) : null}

      {tab ===
      "SCHEMES" ? (
        <SchemesTab />
      ) : null}

      {tab ===
      "ASSIGNMENTS" ? (
        <AssignmentsTab />
      ) : null}
    </div>
  );
}

function SettingsTab() {
  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetProtectionSettingQuery({
      channelCode:
        "WEBSITE",
    });

  const [
    updateSetting,
    {
      isLoading:
        saving,
    },
  ] =
    useUpdateProtectionSettingMutation();

  const [
    enabled,
    setEnabled,
  ] =
    useState(
      true
    );

  const [
    minimumAmount,
    setMinimumAmount,
  ] =
    useState(
      499
    );

  const [
    currencyCode,
    setCurrencyCode,
  ] =
    useState(
      "AED"
    );

  useEffect(
    () => {
      if (
        !data?.data
      ) {
        return;
      }

      setEnabled(
        data.data
          .isEnabled
      );

      setMinimumAmount(
        Number(
          data.data
            .minimumEligibleProductAmount ||
            0
        )
      );

      setCurrencyCode(
        data.data
          .currencyCode ||
          "AED"
      );
    },
    [
      data,
    ]
  );

  const save =
    async () => {
      try {
        await updateSetting({
          isEnabled:
            enabled,

          minimumEligibleProductAmount:
            Number(
              minimumAmount
            ),

          currencyCode:
            currencyCode
              .trim()
              .toUpperCase(),

          channelCode:
            "WEBSITE",
        }).unwrap();

        toast.success(
          "Protection settings saved."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to save protection settings."
          )
        );
      }
    };

  if (
    isLoading
  ) {
    return (
      <LoadingCard label="Loading protection settings…" />
    );
  }

  return (
    <section className="max-w-3xl rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <div className="flex items-center gap-3">
          <SlidersHorizontal
            size={
              20
            }
          />

          <div>
            <h2 className="font-bold text-[#202223]">
              Global
              protection
              settings
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              These rules
              apply before
              product, brand
              or category
              overrides are
              evaluated.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <ToggleRow
          title="Enable protection"
          description="Allow eligible products to offer extended warranty and damage protection."
          checked={
            enabled
          }
          onChange={
            setEnabled
          }
        />

        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Minimum eligible product amount"
            help="Products below this selling price will not receive protection plans."
          >
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6d7175]">
                AED
              </span>

              <input
                type="number"
                min={
                  0
                }
                step="0.01"
                value={
                  minimumAmount
                }
                onChange={(
                  event
                ) =>
                  setMinimumAmount(
                    Number(
                      event
                        .target
                        .value
                    )
                  )
                }
                className="admin-input pl-12"
              />
            </div>
          </Field>

          <Field label="Currency">
            <input
              value={
                currencyCode
              }
              maxLength={
                3
              }
              onChange={(
                event
              ) =>
                setCurrencyCode(
                  event
                    .target
                    .value
                    .toUpperCase()
                )
              }
              className="admin-input"
            />
          </Field>
        </div>

        <div className="rounded-xl bg-[#f6f6f7] p-4 text-sm leading-6 text-[#5c5f62]">
          Current channel:
          <strong className="ml-1 text-[#202223]">
            WEBSITE
          </strong>
        </div>

        <div className="flex items-center justify-end gap-3">
          {isFetching ? (
            <span className="text-xs text-[#8c9196]">
              Refreshing…
            </span>
          ) : null}

          <button
            type="button"
            onClick={() =>
              void save()
            }
            disabled={
              saving
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

            Save settings
          </button>
        </div>
      </div>
    </section>
  );
}

function SchemesTab() {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    status,
    setStatus,
  ] =
    useState<
      | ""
      | "ACTIVE"
      | "INACTIVE"
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
      ProtectionScheme | null
    >(
      null
    );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetProtectionSchemesQuery({
      page:
        1,

      pageSize:
        200,

      search:
        search.trim() ||
        undefined,

      isActive:
        status ===
        ""
          ? undefined
          : status ===
            "ACTIVE",

      sortBy:
        "sortOrder",

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
    useChangeProtectionSchemeStatusMutation();

  const [
    deleteScheme,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeleteProtectionSchemeMutation();

  const schemes =
    data?.data ||
    [];

  const edit =
    (
      scheme:
        ProtectionScheme
    ) => {
      setEditing(
        scheme
      );

      setDrawerOpen(
        true
      );
    };

  const create =
    () => {
      setEditing(
        null
      );

      setDrawerOpen(
        true
      );
    };

  const toggleStatus =
    async (
      scheme:
        ProtectionScheme
    ) => {
      try {
        await changeStatus({
          id:
            scheme.id,

          isActive:
            !scheme
              .isActive,
        }).unwrap();

        toast.success(
          scheme.isActive
            ? "Scheme deactivated."
            : "Scheme activated."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update scheme status."
          )
        );
      }
    };

  const remove =
    async (
      scheme:
        ProtectionScheme
    ) => {
      if (
        !window.confirm(
          `Delete "${scheme.name}"?`
        )
      ) {
        return;
      }

      try {
        await deleteScheme(
          scheme.id
        ).unwrap();

        toast.success(
          "Protection scheme deleted."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete protection scheme."
          )
        );
      }
    };

  return (
    <>
      <section className="rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e1e3e5] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-[#202223]">
              Protection
              schemes
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Define the
              default price and
              duration for every
              protection
              product.
            </p>
          </div>

          <button
            type="button"
            onClick={
              create
            }
            className="admin-primary-button"
          >
            <Plus
              size={
                16
              }
            />

            New scheme
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#e1e3e5] p-4 md:flex-row">
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
              ) =>
                setSearch(
                  event
                    .target
                    .value
                )
              }
              placeholder="Search scheme name or code"
              className="admin-input pl-9"
            />
          </div>

          <select
            value={
              status
            }
            onChange={(
              event
            ) =>
              setStatus(
                event
                  .target
                  .value as
                  | ""
                  | "ACTIVE"
                  | "INACTIVE"
              )
            }
            className="admin-input md:w-44"
          >
            <option value="">
              All statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
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
          <LoadingCard label="Loading schemes…" />
        ) : schemes.length ===
          0 ? (
          <EmptyState
            title="No protection schemes"
            description="Create a scheme such as 1 Year Extended Warranty or Damage Protection."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e1e3e5] text-sm">
              <thead className="bg-[#f6f6f7] text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                <tr>
                  <th className="px-5 py-3">
                    Scheme
                  </th>

                  <th className="px-5 py-3">
                    Type
                  </th>

                  <th className="px-5 py-3">
                    Duration
                  </th>

                  <th className="px-5 py-3">
                    Pricing
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
                {schemes.map(
                  (
                    scheme
                  ) => (
                    <tr
                      key={
                        scheme.id
                      }
                      className="hover:bg-[#fafbfb]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#202223]">
                          {
                            scheme.name
                          }
                        </p>

                        <p className="mt-1 font-mono text-xs text-[#8c9196]">
                          {
                            scheme.code
                          }
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {humanize(
                          scheme
                            .schemeType
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {scheme.durationMonths
                          ? `${scheme.durationMonths} months`
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        {scheme.pricingMethod ===
                        "PERCENTAGE"
                          ? `${Number(
                              scheme.percentage ||
                                0
                            )}%`
                          : money(
                              Number(
                                scheme.fixedAmount ||
                                  0
                              ),
                              scheme.currencyCode
                            )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={
                            scheme
                              .isActive
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              edit(
                                scheme
                              )
                            }
                            className="icon-button"
                            title="Edit scheme"
                          >
                            <Edit3
                              size={
                                15
                              }
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void toggleStatus(
                                scheme
                              )
                            }
                            disabled={
                              changingStatus
                            }
                            className="admin-secondary-button !h-9 !px-3"
                          >
                            {scheme.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void remove(
                                scheme
                              )
                            }
                            disabled={
                              deleting
                            }
                            className="icon-button text-[#d72c0d]"
                            title="Delete scheme"
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
      </section>

      {drawerOpen ? (
        <SchemeDrawer
          scheme={
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
    </>
  );
}

function AssignmentsTab() {
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
    scopeType,
    setScopeType,
  ] =
    useState<
      ProtectionScopeType | ""
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
      ProtectionAssignment | null
    >(
      null
    );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetProtectionAssignmentsQuery({
      page,
      pageSize:
        30,

      search:
        search.trim() ||
        undefined,

      scopeType:
        scopeType ||
        undefined,
    });

  const [
    changeStatus,
    {
      isLoading:
        changingStatus,
    },
  ] =
    useChangeProtectionAssignmentStatusMutation();

  const [
    deleteAssignment,
    {
      isLoading:
        deleting,
    },
  ] =
    useDeleteProtectionAssignmentMutation();

  const assignments =
    data?.data ||
    [];

  const pagination =
    data?.pagination;

  const toggleStatus =
    async (
      assignment:
        ProtectionAssignment
    ) => {
      try {
        await changeStatus({
          id:
            assignment.id,

          isActive:
            !assignment
              .isActive,
        }).unwrap();

        toast.success(
          assignment.isActive
            ? "Assignment deactivated."
            : "Assignment activated."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to update assignment status."
          )
        );
      }
    };

  const remove =
    async (
      assignment:
        ProtectionAssignment
    ) => {
      if (
        !window.confirm(
          "Delete this protection assignment?"
        )
      ) {
        return;
      }

      try {
        await deleteAssignment(
          assignment.id
        ).unwrap();

        toast.success(
          "Protection assignment deleted."
        );

        await refetch();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to delete protection assignment."
          )
        );
      }
    };

  return (
    <>
      <section className="rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#e1e3e5] p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-[#202223]">
              Protection
              assignments
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Override scheme
              pricing at product,
              brand or category
              level.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditing(
                null
              );

              setDrawerOpen(
                true
              );
            }}
            className="admin-primary-button"
          >
            <Plus
              size={
                16
              }
            />

            New assignment
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-[#e1e3e5] p-4 md:flex-row">
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
              placeholder="Search scheme or assigned target"
              className="admin-input pl-9"
            />
          </div>

          <select
            value={
              scopeType
            }
            onChange={(
              event
            ) => {
              setPage(
                1
              );

              setScopeType(
                event
                  .target
                  .value as
                  ProtectionScopeType |
                  ""
              );
            }}
            className="admin-input md:w-48"
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
          <LoadingCard label="Loading assignments…" />
        ) : assignments.length ===
          0 ? (
          <EmptyState
            title="No protection assignments"
            description="Create an assignment when a product, brand or category needs a different price from the scheme default."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e1e3e5] text-sm">
              <thead className="bg-[#f6f6f7] text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                <tr>
                  <th className="px-5 py-3">
                    Scheme
                  </th>

                  <th className="px-5 py-3">
                    Scope
                  </th>

                  <th className="px-5 py-3">
                    Target
                  </th>

                  <th className="px-5 py-3">
                    Override
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
                {assignments.map(
                  (
                    assignment
                  ) => (
                    <tr
                      key={
                        assignment.id
                      }
                      className="hover:bg-[#fafbfb]"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#202223]">
                          {assignment
                            .scheme
                            ?.name ||
                            assignment
                              .schemeId}
                        </p>

                        <p className="mt-1 font-mono text-xs text-[#8c9196]">
                          {assignment
                            .scheme
                            ?.code ||
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <ScopeBadge
                          scope={
                            assignment
                              .scopeType
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#202223]">
                          {assignment
                            .target
                            ?.name ||
                            assignment
                              .scopeId}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        {assignment.pricingMethod ===
                        "PERCENTAGE"
                          ? `${Number(
                              assignment.percentage ||
                                0
                            )}%`
                          : assignment.pricingMethod ===
                              "FIXED"
                            ? money(
                                Number(
                                  assignment.fixedAmount ||
                                    0
                                ),
                                assignment
                                  .scheme
                                  ?.currencyCode ||
                                  "AED"
                              )
                            : "Scheme default"}
                      </td>

                      <td className="px-5 py-4">
                        {
                          assignment.priority
                        }
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge
                          active={
                            assignment
                              .isActive
                          }
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(
                                assignment
                              );

                              setDrawerOpen(
                                true
                              );
                            }}
                            className="icon-button"
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
                                assignment
                              )
                            }
                            className="admin-secondary-button !h-9 !px-3"
                          >
                            {assignment.isActive
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
                                assignment
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
        <AssignmentDrawer
          assignment={
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
    </>
  );
}

function SchemeDrawer({
  scheme,
  onClose,
  onSaved,
}: {
  scheme:
    ProtectionScheme | null;

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
      ProtectionSchemeFormValues
    >(
      scheme
        ? {
            code:
              scheme.code,

            name:
              scheme.name,

            description:
              scheme.description,

            schemeType:
              scheme.schemeType,

            durationMonths:
              scheme.durationMonths,

            pricingMethod:
              scheme.pricingMethod,

            percentage:
              scheme.percentage,

            fixedAmount:
              scheme.fixedAmount,

            minimumProductAmount:
              scheme.minimumProductAmount,

            maximumProductAmount:
              scheme.maximumProductAmount,

            currencyCode:
              scheme.currencyCode,

            coverageStartMode:
              scheme.coverageStartMode,

            termsAndConditions:
              scheme.termsAndConditions,

            sortOrder:
              scheme.sortOrder,

            isActive:
              scheme.isActive,
          }
        : defaultSchemeForm
    );

  const [
    createScheme,
    {
      isLoading:
        creating,
    },
  ] =
    useCreateProtectionSchemeMutation();

  const [
    updateScheme,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdateProtectionSchemeMutation();

  const saving =
    creating ||
    updating;

  const setField = <
    K extends keyof ProtectionSchemeFormValues,
  >(
    key:
      K,

    value:
      ProtectionSchemeFormValues[K]
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

  const save =
    async () => {
      if (
        !values.name
          .trim()
      ) {
        toast.error(
          "Scheme name is required."
        );

        return;
      }

      if (
        values.pricingMethod ===
          "PERCENTAGE" &&
        (
          !values.percentage ||
          Number(
            values.percentage
          ) <=
            0
        )
      ) {
        toast.error(
          "Enter a valid percentage."
        );

        return;
      }

      try {
        const payload:
          ProtectionSchemeFormValues = {
            ...values,

            code:
              values.code
                ?.trim() ||
              null,

            description:
              values.description
                ?.trim() ||
              null,

            termsAndConditions:
              values.termsAndConditions
                ?.trim() ||
              null,

            percentage:
              values.pricingMethod ===
              "PERCENTAGE"
                ? Number(
                    values.percentage
                  )
                : null,

            fixedAmount:
              values.pricingMethod ===
              "FIXED"
                ? Number(
                    values.fixedAmount ||
                      0
                  )
                : null,
          };

        if (
          scheme
        ) {
          await updateScheme({
            id:
              scheme.id,

            values:
              payload,
          }).unwrap();

          toast.success(
            "Protection scheme updated."
          );
        } else {
          await createScheme(
            payload
          ).unwrap();

          toast.success(
            "Protection scheme created."
          );
        }

        await onSaved();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to save protection scheme."
          )
        );
      }
    };

  return (
    <Drawer
      title={
        scheme
          ? "Edit protection scheme"
          : "New protection scheme"
      }
      onClose={
        onClose
      }
    >
      <div className="space-y-5">
        <Field label="Scheme name">
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
            placeholder="1 Year Extended Warranty"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
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
              placeholder="EW_1_YEAR"
            />
          </Field>

          <Field label="Scheme type">
            <select
              value={
                values.schemeType
              }
              onChange={(
                event
              ) =>
                setField(
                  "schemeType",
                  event
                    .target
                    .value as ProtectionSchemeType
                )
              }
              className="admin-input"
            >
              <option value="EXTENDED_WARRANTY">
                Extended
                warranty
              </option>

              <option value="DAMAGE_PROTECTION">
                Damage
                protection
              </option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea
            value={
              values.description ||
              ""
            }
            onChange={(
              event
            ) =>
              setField(
                "description",
                event
                  .target
                  .value
              )
            }
            rows={
              3
            }
            className="admin-input min-h-24 py-2"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration months">
            <input
              type="number"
              min={
                1
              }
              value={
                values.durationMonths ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "durationMonths",
                  event
                    .target
                    .value
                    ? Number(
                        event
                          .target
                          .value
                      )
                    : null
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Pricing method">
            <select
              value={
                values.pricingMethod
              }
              onChange={(
                event
              ) =>
                setField(
                  "pricingMethod",
                  event
                    .target
                    .value as ProtectionPricingMethod
                )
              }
              className="admin-input"
            >
              <option value="PERCENTAGE">
                Percentage
              </option>

              <option value="FIXED">
                Fixed amount
              </option>
            </select>
          </Field>
        </div>

        {values.pricingMethod ===
        "PERCENTAGE" ? (
          <Field label="Default percentage">
            <input
              type="number"
              min={
                0.01
              }
              max={
                100
              }
              step="0.01"
              value={
                values.percentage ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "percentage",
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
        ) : (
          <Field label="Default fixed amount">
            <input
              type="number"
              min={
                0
              }
              step="0.01"
              value={
                values.fixedAmount ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "fixedAmount",
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
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Minimum product amount"
            help="Optional scheme-specific price floor."
          >
            <NullableNumberInput
              value={
                values.minimumProductAmount
              }
              onChange={(
                value
              ) =>
                setField(
                  "minimumProductAmount",
                  value
                )
              }
            />
          </Field>

          <Field
            label="Maximum product amount"
            help="Optional scheme-specific price ceiling."
          >
            <NullableNumberInput
              value={
                values.maximumProductAmount
              }
              onChange={(
                value
              ) =>
                setField(
                  "maximumProductAmount",
                  value
                )
              }
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency">
            <input
              maxLength={
                3
              }
              value={
                values.currencyCode
              }
              onChange={(
                event
              ) =>
                setField(
                  "currencyCode",
                  event
                    .target
                    .value
                    .toUpperCase()
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Sort order">
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
                setField(
                  "sortOrder",
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

        <Field label="Coverage start mode">
          <select
            value={
              values.coverageStartMode
            }
            onChange={(
              event
            ) =>
              setField(
                "coverageStartMode",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          >
            <option value="AFTER_MANUFACTURER_WARRANTY">
              After
              manufacturer
              warranty
            </option>

            <option value="PURCHASE_DATE">
              Purchase date
            </option>
          </select>
        </Field>

        <Field label="Terms and conditions">
          <textarea
            rows={
              5
            }
            value={
              values.termsAndConditions ||
              ""
            }
            onChange={(
              event
            ) =>
              setField(
                "termsAndConditions",
                event
                  .target
                  .value
              )
            }
            className="admin-input min-h-32 py-2"
          />
        </Field>

        <ToggleRow
          title="Active"
          description="Inactive schemes are not offered to customers."
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
            onClick={() =>
              void save()
            }
            disabled={
              saving
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

            Save scheme
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function AssignmentDrawer({
  assignment,
  onClose,
  onSaved,
}: {
  assignment:
    ProtectionAssignment | null;

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
      ProtectionAssignmentFormValues
    >(
      assignment
        ? {
            schemeId:
              assignment.schemeId,

            scopeType:
              assignment.scopeType,

            scopeId:
              assignment.scopeId,

            pricingMethod:
              assignment.pricingMethod,

            percentage:
              assignment.percentage,

            fixedAmount:
              assignment.fixedAmount,

            minimumProductAmount:
              assignment.minimumProductAmount,

            maximumProductAmount:
              assignment.maximumProductAmount,

            effectiveFrom:
              toDateInput(
                assignment.effectiveFrom
              ),

            effectiveUntil:
              toDateInput(
                assignment.effectiveUntil
              ),

            priority:
              assignment.priority,

            isActive:
              assignment.isActive,
          }
        : defaultAssignmentForm
    );

  const [
    targetSearch,
    setTargetSearch,
  ] =
    useState(
      ""
    );

  const {
    data:
      schemesResponse,
  } =
    useGetProtectionSchemesQuery({
      page:
        1,

      pageSize:
        200,

      isActive:
        true,

      sortBy:
        "sortOrder",

      sortDirection:
        "ASC",
    });

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

  const [
    createAssignment,
    {
      isLoading:
        creating,
    },
  ] =
    useCreateProtectionAssignmentMutation();

  const [
    updateAssignment,
    {
      isLoading:
        updating,
    },
  ] =
    useUpdateProtectionAssignmentMutation();

  const saving =
    creating ||
    updating;

  const schemes =
    schemesResponse?.data ||
    [];

  const targets =
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

  const setField = <
    K extends keyof ProtectionAssignmentFormValues,
  >(
    key:
      K,

    value:
      ProtectionAssignmentFormValues[K]
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

  const save =
    async () => {
      if (
        !values.schemeId
      ) {
        toast.error(
          "Select a protection scheme."
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
        values.pricingMethod ===
          "PERCENTAGE" &&
        (
          !values.percentage ||
          Number(
            values.percentage
          ) <=
            0
        )
      ) {
        toast.error(
          "Enter a valid override percentage."
        );

        return;
      }

      try {
        const payload:
          ProtectionAssignmentFormValues = {
            ...values,

            percentage:
              values.pricingMethod ===
              "PERCENTAGE"
                ? Number(
                    values.percentage
                  )
                : null,

            fixedAmount:
              values.pricingMethod ===
              "FIXED"
                ? Number(
                    values.fixedAmount ||
                      0
                  )
                : null,

            effectiveFrom:
              values.effectiveFrom ||
              null,

            effectiveUntil:
              values.effectiveUntil ||
              null,
          };

        if (
          assignment
        ) {
          await updateAssignment({
            id:
              assignment.id,

            values:
              payload,
          }).unwrap();

          toast.success(
            "Protection assignment updated."
          );
        } else {
          await createAssignment(
            payload
          ).unwrap();

          toast.success(
            "Protection assignment created."
          );
        }

        await onSaved();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to save protection assignment."
          )
        );
      }
    };

  return (
    <Drawer
      title={
        assignment
          ? "Edit protection assignment"
          : "New protection assignment"
      }
      onClose={
        onClose
      }
    >
      <div className="space-y-5">
        <Field label="Protection scheme">
          <select
            value={
              values.schemeId
            }
            onChange={(
              event
            ) =>
              setField(
                "schemeId",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
          >
            <option value="">
              Select scheme
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
                  {scheme.name} (
                  {
                    scheme.code
                  }
                  )
                </option>
              )
            )}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Assignment level">
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
                    .value as ProtectionScopeType
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
          help="Search and select the target that should receive this override."
        >
          <input
            value={
              targetSearch
            }
            onChange={(
              event
            ) =>
              setTargetSearch(
                event
                  .target
                  .value
              )
            }
            placeholder={`Search ${values.scopeType.toLowerCase()}…`}
            className="admin-input mb-2"
          />

          <select
            value={
              values.scopeId
            }
            onChange={(
              event
            ) =>
              setField(
                "scopeId",
                event
                  .target
                  .value
              )
            }
            className="admin-input"
            size={
              Math.min(
                Math.max(
                  targets.length,
                  3
                ),
                8
              )
            }
          >
            <option value="">
              Select target
            </option>

            {targets.map(
              (
                target
              ) => (
                <option
                  key={
                    target.id
                  }
                  value={
                    target.id
                  }
                >
                  {
                    target.name
                  }
                </option>
              )
            )}
          </select>
        </Field>

        <Field
          label="Pricing override"
          help="Choose Scheme default to inherit the scheme's own percentage or fixed amount."
        >
          <select
            value={
              values.pricingMethod ||
              ""
            }
            onChange={(
              event
            ) =>
              setField(
                "pricingMethod",
                event
                  .target
                  .value
                  ? event
                      .target
                      .value as ProtectionPricingMethod
                  : null
              )
            }
            className="admin-input"
          >
            <option value="">
              Scheme default
            </option>

            <option value="PERCENTAGE">
              Percentage
              override
            </option>

            <option value="FIXED">
              Fixed amount
              override
            </option>
          </select>
        </Field>

        {values.pricingMethod ===
        "PERCENTAGE" ? (
          <Field label="Override percentage">
            <input
              type="number"
              min={
                0.01
              }
              max={
                100
              }
              step="0.01"
              value={
                values.percentage ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "percentage",
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
        ) : null}

        {values.pricingMethod ===
        "FIXED" ? (
          <Field label="Override fixed amount">
            <input
              type="number"
              min={
                0
              }
              step="0.01"
              value={
                values.fixedAmount ||
                ""
              }
              onChange={(
                event
              ) =>
                setField(
                  "fixedAmount",
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
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum product amount">
            <NullableNumberInput
              value={
                values.minimumProductAmount
              }
              onChange={(
                value
              ) =>
                setField(
                  "minimumProductAmount",
                  value
                )
              }
            />
          </Field>

          <Field label="Maximum product amount">
            <NullableNumberInput
              value={
                values.maximumProductAmount
              }
              onChange={(
                value
              ) =>
                setField(
                  "maximumProductAmount",
                  value
                )
              }
            />
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
          description="Inactive assignments are ignored by the protection resolver."
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

        <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4 text-xs leading-5 text-[#5c5f62]">
          Resolution order:
          <strong className="ml-1">
            Product → Brand
            → Category →
            Scheme default
          </strong>
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
            onClick={() =>
              void save()
            }
            disabled={
              saving
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

            Save
            assignment
          </button>
        </div>
      </div>
    </Drawer>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={[
        "rounded-lg px-4 py-2 text-sm font-semibold transition",
        active
          ? "bg-[#202223] text-white shadow-sm"
          : "text-[#5c5f62] hover:bg-[#f1f2f3]",
      ].join(
        " "
      )}
    >
      {
        children
      }
    </button>
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
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/30">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={
          onClose
        }
        className="absolute inset-0"
      />

      <div className="relative z-10 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
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
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
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
    </div>
  );
}

function NullableNumberInput({
  value,
  onChange,
}: {
  value:
    | number
    | null
    | undefined;

  onChange: (
    value:
      | number
      | null
  ) => void;
}) {
  return (
    <input
      type="number"
      min={
        0
      }
      step="0.01"
      value={
        value ??
        ""
      }
      onChange={(
        event
      ) =>
        onChange(
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
      placeholder="Optional"
    />
  );
}

function LoadingCard({
  label,
}: {
  label: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#6d7175]">
      <LoaderCircle
        size={
          18
        }
        className="animate-spin"
      />

      {
        label
      }
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-12 text-center">
      <ShieldCheck
        size={
          30
        }
        className="mx-auto text-[#8c9196]"
      />

      <h3 className="mt-3 font-bold text-[#202223]">
        {
          title
        }
      </h3>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6d7175]">
        {
          description
        }
      </p>
    </div>
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        active
          ? "bg-[#aee9d1] text-[#0c5132]"
          : "bg-[#e4e5e7] text-[#5c5f62]",
      ].join(
        " "
      )}
    >
      <BadgeCheck
        size={
          13
        }
      />

      {active
        ? "Active"
        : "Inactive"}
    </span>
  );
}

function ScopeBadge({
  scope,
}: {
  scope:
    ProtectionScopeType;
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

function money(
  amount: number,
  currency:
    string
) {
  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency:
        currency ||
        "AED",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    amount
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
