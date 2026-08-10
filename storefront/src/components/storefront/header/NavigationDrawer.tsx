"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

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
  compareNavigationItems,
  getItemChildren,
  getItemLabel,
  getNavigationMenu,
  isVisibleItem,
} from "./navigationDrawer.utils";

interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;

  navigationSection?:
    | StorefrontSection
    | null;

  accountUrl?: string;
  accountLabel?: string;
}

export default function NavigationDrawer({
  open,
  onClose,
  navigationSection,
  accountUrl = "/account",
  accountLabel = "Hello, sign in",
}: NavigationDrawerProps) {
  const closeButtonRef =
    useRef<HTMLButtonElement | null>(
      null
    );

  const [
    levels,
    setLevels,
  ] = useState<DrawerLevel[]>([]);

  const navigationMenu =
    useMemo(
      () =>
        getNavigationMenu(
          navigationSection
        ),
      [navigationSection]
    );

  const rootItems =
    useMemo(() => {
      const items =
        Array.isArray(
          navigationMenu?.items
        )
          ? navigationMenu.items
          : Array.isArray(
                navigationMenu?.children
              )
            ? navigationMenu.children
            : [];

      return items
        .filter(isVisibleItem)
        .sort(compareNavigationItems);
    }, [navigationMenu]);

  const currentLevel =
    levels.length > 0
      ? levels[
          levels.length - 1
        ]
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

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
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

      window.clearTimeout(
        focusTimer
      );
    };
  }, [open, handleClose]);

  const handleOpenChildren = (
    item: NavigationItem
  ) => {
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
        aria-label="Close all menu"
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
        aria-label="All departments menu"
        className={[
          "absolute inset-y-0 left-0 flex w-[88vw] max-w-[390px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <DrawerHeader
          accountUrl={accountUrl}
          accountLabel={
            accountLabel
          }
          open={open}
          onClose={handleClose}
          closeButtonRef={
            closeButtonRef
          }
        />

        {currentLevel ? (
          <DrawerBackButton
            open={open}
            onBack={handleBack}
          />
        ) : null}

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {currentLevel ? (
            <>
              <div className="border-b border-slate-200 px-6 py-5">
                <h2 className="text-xl font-extrabold text-slate-950">
                  {currentLevel.title}
                </h2>
              </div>

              <nav
                aria-label={
                  currentLevel.title
                }
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
                      onNavigate={
                        handleClose
                      }
                    />
                  )
                )}
              </nav>
            </>
          ) : rootItems.length ? (
            <>
              {rootItems.map(
                (section) => (
                  <DrawerSection
                    key={section.id}
                    section={section}
                    open={open}
                    onOpenChildren={
                      handleOpenChildren
                    }
                    onNavigate={
                      handleClose
                    }
                  />
                )
              )}

              <DrawerFooter
                open={open}
                accountUrl={
                  accountUrl
                }
                onNavigate={
                  handleClose
                }
              />
            </>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-slate-800">
                No menu items are
                available.
              </p>

              <p className="mt-2 text-sm leading-5 text-slate-500">
                Add top-level groups
                and child links through
                the CMS Navigation
                module.
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
