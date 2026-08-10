"use client";

import Link from "next/link";

import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  Menu,
  RefreshCw,
} from "lucide-react";

import { useMemo } from "react";

import {
  useGetNavigationMenusQuery,
} from "@/store/api/navigationApi";

import type {
  NavigationMenu,
} from "@/types/navigation";

interface NavigationEditorProps {
  value: Record<string, unknown>;

  onChange: (
    value: Record<string, unknown>
  ) => void;
}

const getStringValue = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value
    : "";
};

const formatEnumValue = (
  value?: string | null
): string => {
  if (!value) {
    return "Not specified";
  }

  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
};

const getItemCount = (
  menu: NavigationMenu
): number => {
  if (
    typeof menu.itemCount ===
    "number"
  ) {
    return menu.itemCount;
  }

  return Array.isArray(menu.items)
    ? menu.items.length
    : 0;
};

export default function NavigationEditor({
  value,
  onChange,
}: NavigationEditorProps) {
  const selectedMenuId =
    getStringValue(
      value.menuId
    );

  const selectedMenuCode =
    getStringValue(
      value.menuCode
    );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } =
    useGetNavigationMenusQuery({
      page: 1,
      pageSize: 100,
      isActive: true,
    });

  const menus =
    useMemo<NavigationMenu[]>(
      () =>
        Array.isArray(data?.data)
          ? data.data
          : [],
      [data]
    );

  const selectedMenu =
    useMemo<
      NavigationMenu | undefined
    >(() => {
      if (selectedMenuId) {
        const menuById =
          menus.find(
            (menu) =>
              menu.id ===
              selectedMenuId
          );

        if (menuById) {
          return menuById;
        }
      }

      if (selectedMenuCode) {
        return menus.find(
          (menu) =>
            menu.code ===
            selectedMenuCode
        );
      }

      return undefined;
    }, [
      menus,
      selectedMenuId,
      selectedMenuCode,
    ]);

  const handleMenuChange = (
    menuId: string
  ) => {
    if (!menuId) {
      onChange({
        ...value,
        menuId: null,
        menuCode: null,
      });

      return;
    }

    const menu =
      menus.find(
        (candidate) =>
          candidate.id === menuId
      );

    if (!menu) {
      return;
    }

    onChange({
      ...value,

      menuId:
        menu.id,

      menuCode:
        menu.code,
    });
  };

  return (
    <section className="admin-card p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3]">
            <Menu size={19} />
          </div>

          <div>
            <h2 className="text-base font-semibold">
              Navigation content
            </h2>

            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              Select the navigation menu
              displayed by this section.
            </p>
          </div>
        </div>

        <Link
          href="/admin/cms/navigation"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#f6f6f7]"
        >
          <ExternalLink size={15} />

          Navigation builder
        </Link>
      </div>

      <div className="mt-6">
        <label
          htmlFor="navigation-menu"
          className="mb-1.5 block text-sm font-medium"
        >
          Navigation menu
        </label>

        {isLoading ? (
          <div className="flex h-[42px] items-center gap-2 rounded-lg border border-[#c9cccf] bg-[#f6f6f7] px-3 text-sm text-[#6d7175]">
            <LoaderCircle
              size={16}
              className="animate-spin"
            />

            Loading navigation
            menus...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">
                  Unable to load
                  navigation menus
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  Check that the backend
                  is running and your login
                  session is valid.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    void refetch()
                  }
                  className="mt-3 inline-flex h-8 items-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-xs font-medium text-red-800 hover:bg-red-100"
                >
                  <RefreshCw
                    size={14}
                  />

                  Try again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative">
              <select
                id="navigation-menu"
                value={
                  selectedMenu?.id ||
                  selectedMenuId ||
                  ""
                }
                onChange={(event) =>
                  handleMenuChange(
                    event.target.value
                  )
                }
                className="admin-input appearance-none pr-10"
              >
                <option value="">
                  Select a navigation
                  menu
                </option>

                {menus.map(
                  (menu) => (
                    <option
                      key={menu.id}
                      value={menu.id}
                    >
                      {menu.name} —{" "}
                      {menu.code}
                    </option>
                  )
                )}
              </select>

              {isFetching && (
                <LoaderCircle
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6d7175]"
                />
              )}
            </div>

            {menus.length === 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">
                  No active navigation
                  menus found.
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Create and enable a
                  navigation menu first.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {selectedMenu && (
        <div className="mt-5 overflow-hidden rounded-xl border border-[#e1e3e5]">
          <div className="flex items-center gap-2 border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-3">
            <CheckCircle2
              size={17}
              className="text-[#276749]"
            />

            <p className="text-sm font-semibold">
              Selected menu
            </p>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Name
              </p>

              <p className="mt-1 text-sm font-medium">
                {selectedMenu.name}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Code
              </p>

              <p className="mt-1 break-all font-mono text-xs font-medium">
                {selectedMenu.code}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Menu type
              </p>

              <p className="mt-1 text-sm font-medium">
                {formatEnumValue(
                  selectedMenu
                    .menuType
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Channel
              </p>

              <p className="mt-1 text-sm font-medium">
                {selectedMenu.channel ===
                "BOTH"
                  ? "Website & Kiosk"
                  : formatEnumValue(
                      selectedMenu
                        .channel
                    )}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Items
              </p>

              <p className="mt-1 text-sm font-medium">
                {getItemCount(
                  selectedMenu
                )}
              </p>
            </div>

            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                Status
              </p>

              <span className="mt-1 inline-flex rounded-full bg-[#e3f1df] px-2.5 py-1 text-xs font-medium text-[#276749]">
                Active
              </span>
            </div>
          </div>

          {selectedMenu.description && (
            <div className="border-t border-[#e1e3e5] px-4 py-3">
              <p className="text-xs leading-5 text-[#6d7175]">
                {
                  selectedMenu.description
                }
              </p>
            </div>
          )}
        </div>
      )}

      {!selectedMenu &&
        !isLoading &&
        !error &&
        menus.length > 0 && (
          <div className="mt-5 rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
            <p className="text-sm font-medium">
              No menu selected
            </p>

            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
              Select a menu above. The
              section will save both the
              menu ID and menu code.
            </p>
          </div>
        )}
    </section>
  );
}