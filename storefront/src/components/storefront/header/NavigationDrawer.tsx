"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getPublicCategoryTree,
} from "@/lib/storefront/public-category-tree-api";

import DrawerBackButton from "./DrawerBackButton";
import DrawerFooter from "./DrawerFooter";
import DrawerHeader from "./DrawerHeader";
import DrawerMenuItem from "./DrawerMenuItem";
import DrawerSection from "./DrawerSection";

import type {
  DrawerLevel,
  NavigationItem,
} from "./NavigationDrawer.types";

import {
  categoryToNavigationItem,
  compareNavigationItems,
  getItemChildren,
  getItemLabel,
  isVisibleItem,
} from "./navigationDrawer.utils";

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  accountUrl?: string;
  accountLabel?: string;
}

export default function NavigationDrawer({
  open,
  onClose,
  accountUrl = "/account",
  accountLabel = "Hello, sign in",
}: NavigationDrawerProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const [categoryItems, setCategoryItems] =
    useState<NavigationItem[]>([]);

  const [categoryLoading, setCategoryLoading] =
    useState(false);

  const [categoryLoaded, setCategoryLoaded] =
    useState(false);

  const [categoryError, setCategoryError] =
    useState<string | null>(null);

  const [levels, setLevels] =
    useState<DrawerLevel[]>([]);

  const loadCategories =
    useCallback(async () => {
      setCategoryLoading(true);
      setCategoryError(null);

      try {
        const categories =
          await getPublicCategoryTree();

        const items = categories
          .map(categoryToNavigationItem)
          .filter(isVisibleItem)
          .sort(compareNavigationItems);

        setCategoryItems(items);
        setCategoryLoaded(true);
      } catch (error) {
        console.error(
          "[Category drawer error]",
          error
        );

        setCategoryItems([]);
        setCategoryError(
          error instanceof Error
            ? error.message
            : "Unable to load categories."
        );
      } finally {
        setCategoryLoading(false);
      }
    }, []);

    useEffect(
      () => {
        if (
          !open ||
          categoryLoaded ||
          categoryLoading ||
          categoryError
        ) {
          return;
        }
    
        void loadCategories();
      },
      [
        open,
        categoryLoaded,
        categoryLoading,
        categoryError,
        loadCategories,
      ]
    );

  const rootItems = useMemo(
    () =>
      categoryItems
        .filter(isVisibleItem)
        .sort(compareNavigationItems),
    [categoryItems]
  );

  const currentLevel =
    levels.length > 0
      ? levels[levels.length - 1]
      : null;

  const handleClose =
    useCallback(() => {
      onClose();
    }, [onClose]);

  useEffect(() => {
    if (!open) {
      setLevels([]);
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          handleClose();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    const focusTimer =
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.clearTimeout(focusTimer);
    };
  }, [open, handleClose]);

  const handleOpenChildren =
    (item: NavigationItem) => {
      const children =
        getItemChildren(item);

      if (!children.length) {
        return;
      }

      setLevels((current) => [
        ...current,
        {
          id: item.id,
          title: getItemLabel(item),
          items: children,
        },
      ]);
    };

  const handleBack = () => {
    setLevels((current) =>
      current.slice(0, -1)
    );
  };

  return (
    <div
      className={[
        "fixed inset-0 z-[100]",
        open
          ? "pointer-events-auto"
          : "pointer-events-none",
      ].join(" ")}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close categories menu"
        onClick={handleClose}
        tabIndex={open ? 0 : -1}
        className={[
          "absolute inset-0 bg-black/60 transition-opacity duration-300",
          open
            ? "opacity-100"
            : "opacity-0",
        ].join(" ")}
      />

      <aside
        id="storefront-all-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Shop categories"
        className={[
          "absolute inset-y-0 left-0 flex w-[88vw] max-w-[390px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <DrawerHeader
          accountUrl={accountUrl}
          accountLabel={accountLabel}
          open={open}
          onClose={handleClose}
          closeButtonRef={closeButtonRef}
        />

        {currentLevel ? (
          <DrawerBackButton
            open={open}
            onBack={handleBack}
          />
        ) : null}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {categoryLoading ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
              <div className="size-6 animate-spin rounded-full border-2 border-storefront-primary border-t-transparent" />

              <p className="mt-3 text-sm font-medium text-slate-500">
                Loading categories…
              </p>
            </div>
          ) : categoryError ? (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-slate-800">
                Unable to load categories.
              </p>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                {categoryError}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadCategories()
                }
                className="mt-5 rounded-lg bg-storefront-primary px-4 py-2 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : currentLevel ? (
            <>
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-bold text-slate-950">
                  {currentLevel.title}
                </h2>
              </div>

              <nav
                aria-label={currentLevel.title}
                className="py-2"
              >
                {currentLevel.items.map(
                  (item) => (
                    <DrawerMenuItem
                      key={item.id}
                      item={item}
                      open={open}
                      onOpenChildren={
                        handleOpenChildren
                      }
                      onNavigate={handleClose}
                    />
                  )
                )}
              </nav>
            </>
          ) : rootItems.length ? (
            <>
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-950">
                  Shop Categories
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Browse all MyShops categories
                </p>
              </div>

              {rootItems.map(
                (section) => (
                  <DrawerSection
                    key={section.id}
                    section={section}
                    open={open}
                    onOpenChildren={
                      handleOpenChildren
                    }
                    onNavigate={handleClose}
                  />
                )
              )}

              <DrawerFooter
                open={open}
                accountUrl={accountUrl}
                onNavigate={handleClose}
              />
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-slate-800">
                No categories are available.
              </p>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                Enable &quot;Show in Menu&quot; for the
                categories you want displayed here.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
