"use client";

import Link from "next/link";

import {
  ChevronRight,
  LoaderCircle,
  Menu,
  Pencil,
  Plus,
  Search,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import {
  useChangeNavigationMenuActiveMutation,
  useGetNavigationMenusQuery,
} from "@/store/api/navigationApi";

import type {
  NavigationChannel,
  NavigationMenuType,
} from "@/types/navigation";

const getErrorMessage = (
  error: unknown,
  fallback: string
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
      fallback
    );
  }

  return fallback;
};

export default function NavigationMenusPage() {
  const [search, setSearch] =
    useState("");

  const [
    channel,
    setChannel,
  ] = useState<
    NavigationChannel | ""
  >("");

  const [
    menuType,
    setMenuType,
  ] = useState<
    NavigationMenuType | ""
  >("");

  const [
    activeFilter,
    setActiveFilter,
  ] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  const queryParams = useMemo(
    () => ({
      page: 1,
      pageSize: 100,

      search:
        search.trim() ||
        undefined,

      channel:
        channel ||
        undefined,

      menuType:
        menuType ||
        undefined,

      isActive:
        activeFilter ===
        "ALL"
          ? undefined
          : activeFilter ===
            "ACTIVE",
    }),
    [
      search,
      channel,
      menuType,
      activeFilter,
    ]
  );

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } =
    useGetNavigationMenusQuery(
      queryParams
    );

  const [
    changeActive,
    {
      isLoading:
        isChangingActive,
    },
  ] =
    useChangeNavigationMenuActiveMutation();

  const menus =
    data?.data || [];

  const handleActiveChange =
    async (
      id: string,
      currentValue: boolean
    ) => {
      try {
        await changeActive({
          id,
          isActive:
            !currentValue,
        }).unwrap();

        toast.success(
          currentValue
            ? "Navigation menu disabled."
            : "Navigation menu enabled."
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to update the navigation menu."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[#6d7175]">
              <span>CMS</span>

              <ChevronRight
                size={14}
              />

              <span>
                Navigation
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Navigation menus
            </h1>

            <p className="mt-1 text-sm text-[#6d7175]">
              Build website and kiosk
              menus, dropdowns and mega
              menus.
            </p>
          </div>

          <Link
            href="/admin/cms/navigation/create"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a]"
          >
            <Plus size={17} />

            Create menu
          </Link>
        </header>

        <section className="mt-6 rounded-2xl border border-[#e1e3e5] bg-white">
          <div className="border-b border-[#e1e3e5] p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_180px_180px_160px]">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                />

                <input
                  value={search}
                  onChange={(
                    event
                  ) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  className="admin-input pl-10"
                  placeholder="Search menus"
                />
              </div>

              <select
                value={channel}
                onChange={(
                  event
                ) =>
                  setChannel(
                    event.target
                      .value as
                      | NavigationChannel
                      | ""
                  )
                }
                className="admin-input"
              >
                <option value="">
                  All channels
                </option>

                <option value="WEBSITE">
                  Website
                </option>

                <option value="KIOSK">
                  Kiosk
                </option>

                <option value="BOTH">
                  Website and kiosk
                </option>
              </select>

              <select
                value={
                  menuType
                }
                onChange={(
                  event
                ) =>
                  setMenuType(
                    event.target
                      .value as
                      | NavigationMenuType
                      | ""
                  )
                }
                className="admin-input"
              >
                <option value="">
                  All menu types
                </option>

                <option value="SIMPLE">
                  Simple
                </option>

                <option value="DROPDOWN">
                  Dropdown
                </option>

                <option value="MEGA_MENU">
                  Mega menu
                </option>
              </select>

              <select
                value={
                  activeFilter
                }
                onChange={(
                  event
                ) =>
                  setActiveFilter(
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
            </div>
          </div>

          <div className="min-h-[360px]">
            {isLoading ? (
              <div className="flex min-h-[360px] items-center justify-center">
                <div className="text-center">
                  <LoaderCircle className="mx-auto animate-spin" />

                  <p className="mt-3 text-sm text-[#6d7175]">
                    Loading navigation
                    menus...
                  </p>
                </div>
              </div>
            ) : menus.length ===
              0 ? (
              <div className="flex min-h-[360px] items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
                    <Menu
                      size={26}
                    />
                  </div>

                  <h2 className="mt-4 text-base font-semibold">
                    No navigation
                    menus found
                  </h2>

                  <p className="mt-1 text-sm text-[#6d7175]">
                    Create your first
                    website or kiosk
                    navigation menu.
                  </p>

                  <Link
                    href="/admin/cms/navigation/create"
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                  >
                    <Plus
                      size={16}
                    />

                    Create menu
                  </Link>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] border-collapse">
                  <thead>
                    <tr className="border-b border-[#e1e3e5] bg-[#fafafa] text-left">
                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Menu
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Channel
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Type
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Items
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {menus.map(
                      (menu) => (
                        <tr
                          key={
                            menu.id
                          }
                          className="border-b border-[#e1e3e5] last:border-b-0 hover:bg-[#fafafa]"
                        >
                          <td className="px-5 py-4">
                            <Link
                              href={`/admin/cms/navigation/${menu.id}`}
                              className="font-medium hover:underline"
                            >
                              {
                                menu.name
                              }
                            </Link>

                            <p className="mt-1 font-mono text-xs text-[#6d7175]">
                              {
                                menu.code
                              }
                            </p>

                            {menu.description && (
                              <p className="mt-1 max-w-[420px] truncate text-xs text-[#8c9196]">
                                {
                                  menu.description
                                }
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                              {
                                menu.channel
                              }
                            </span>
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {
                              menu.menuType
                            }
                          </td>

                          <td className="px-5 py-4 text-sm">
                            {Number(
                              menu.itemCount ||
                                0
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={
                                isChangingActive
                              }
                              onClick={() =>
                                handleActiveChange(
                                  menu.id,
                                  menu.isActive
                                )
                              }
                              className="flex items-center gap-2 disabled:opacity-50"
                            >
                              <span
                                className={[
                                  "relative h-6 w-11 rounded-full transition",
                                  menu.isActive
                                    ? "bg-[#303030]"
                                    : "bg-[#c9cccf]",
                                ].join(
                                  " "
                                )}
                              >
                                <span
                                  className={[
                                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                                    menu.isActive
                                      ? "left-[22px]"
                                      : "left-0.5",
                                  ].join(
                                    " "
                                  )}
                                />
                              </span>

                              <span className="text-xs">
                                {menu.isActive
                                  ? "Active"
                                  : "Inactive"}
                              </span>
                            </button>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/admin/cms/navigation/${menu.id}`}
                                className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                              >
                                <Menu
                                  size={15}
                                />

                                Build
                              </Link>

                              <Link
                                href={`/admin/cms/navigation/${menu.id}/edit`}
                                className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                              >
                                <Pencil
                                  size={15}
                                />

                                Edit
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between border-t border-[#e1e3e5] px-5 py-4">
            <p className="text-sm text-[#6d7175]">
              {data?.pagination
                .totalItems ||
                menus.length}{" "}
              menus
            </p>

            {isFetching &&
              !isLoading && (
                <div className="flex items-center gap-2 text-xs text-[#6d7175]">
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />

                  Updating
                </div>
              )}

            <button
              type="button"
              onClick={() =>
                refetch()
              }
              className="text-sm font-medium hover:underline"
            >
              Refresh
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}