"use client";

import {
  ArrowLeft,
  ChevronRight,
  CircleUserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { StorefrontSection } from "@/types/storefront";

interface NavigationItem {
  id: string;
  label?: string | null;
  name?: string | null;
  title?: string | null;
  url?: string | null;
  linkUrl?: string | null;
  href?: string | null;
  slug?: string | null;
  itemType?: string | null;
  type?: string | null;
  referenceId?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  productId?: string | null;
  cmsPageId?: string | null;
  description?: string | null;
  badgeText?: string | null;
  isActive?: boolean;
  desktopVisible?: boolean;
  mobileVisible?: boolean;
  displayOrder?: number | null;
  sortOrder?: number | null;
  children?: NavigationItem[] | null;
  items?: NavigationItem[] | null;
}

interface NavigationMenu {
  id?: string;
  name?: string;
  code?: string;
  menuType?: string;
  items?: NavigationItem[] | null;
  children?: NavigationItem[] | null;
}

interface DrawerLevel {
  id: string;
  title: string;
  items: NavigationItem[];
}

interface AllMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  navigationSection?: StorefrontSection | null;
  accountUrl?: string;
  accountLabel?: string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function asNavigationMenu(value: unknown): NavigationMenu | null {
  return isObject(value) ? (value as NavigationMenu) : null;
}

function getNavigationMenu(
  section?: StorefrontSection | null
): NavigationMenu | null {
  if (!section || !isObject(section.content)) {
    return null;
  }

  const content = section.content as Record<string, unknown>;

  return (
    asNavigationMenu(content.menuResolved) ||
    asNavigationMenu(content.navigationResolved) ||
    asNavigationMenu(content.menu) ||
    null
  );
}

function getItemLabel(item: NavigationItem) {
  return (
    item.label?.trim() ||
    item.name?.trim() ||
    item.title?.trim() ||
    "Menu item"
  );
}

function isVisibleItem(item: NavigationItem) {
  return item.isActive !== false && item.mobileVisible !== false;
}

function compareNavigationItems(
  first: NavigationItem,
  second: NavigationItem
) {
  const firstOrder = first.displayOrder ?? first.sortOrder ?? 0;
  const secondOrder = second.displayOrder ?? second.sortOrder ?? 0;
  return firstOrder - secondOrder;
}

function getItemChildren(item: NavigationItem) {
  const children = Array.isArray(item.children)
    ? item.children
    : Array.isArray(item.items)
      ? item.items
      : [];

  return children.filter(isVisibleItem).sort(compareNavigationItems);
}

function normalizeUrl(value?: string | null) {
  const url = value?.trim();
  return url || null;
}

function getItemUrl(item: NavigationItem) {
  const directUrl =
    normalizeUrl(item.url) ||
    normalizeUrl(item.linkUrl) ||
    normalizeUrl(item.href);

  if (directUrl) return directUrl;

  const itemType = String(item.itemType || item.type || "")
    .trim()
    .toUpperCase();
  const slug = item.slug?.trim() || null;

  if (itemType.includes("CATEGORY")) {
    return `/categories/${slug || item.categoryId || item.referenceId || ""}`;
  }

  if (itemType.includes("BRAND")) {
    return `/brands/${slug || item.brandId || item.referenceId || ""}`;
  }

  if (itemType.includes("PRODUCT")) {
    return `/products/${slug || item.productId || item.referenceId || ""}`;
  }

  if (itemType.includes("CMS") || itemType.includes("PAGE")) {
    return `/pages/${slug || item.cmsPageId || item.referenceId || ""}`;
  }

  return slug ? `/${slug}` : "#";
}

function DrawerMenuItem({
  item,
  onOpenChildren,
  onNavigate,
}: {
  item: NavigationItem;
  onOpenChildren: (item: NavigationItem) => void;
  onNavigate: () => void;
}) {
  const label = getItemLabel(item);
  const children = getItemChildren(item);
  const hasChildren = children.length > 0;

  if (hasChildren) {
    return (
      <button
        type="button"
        onClick={() => onOpenChildren(item)}
        className="group flex min-h-12 w-full items-center justify-between gap-4 px-6 py-3 text-left transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-slate-800">
            {label}
          </span>
          {item.description ? (
            <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
              {item.description}
            </span>
          ) : null}
        </span>

        <span className="flex shrink-0 items-center gap-2">
          {item.badgeText ? (
            <span className="rounded-full bg-storefront-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-storefront-primary">
              {item.badgeText}
            </span>
          ) : null}
          <ChevronRight
            size={18}
            aria-hidden="true"
            className="text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-700"
          />
        </span>
      </button>
    );
  }

  return (
    <Link
      href={getItemUrl(item)}
      onClick={onNavigate}
      className="flex min-h-12 items-center justify-between gap-4 px-6 py-3 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-medium text-slate-800">
          {label}
        </span>
        {item.description ? (
          <span className="mt-0.5 block truncate text-xs font-normal text-slate-500">
            {item.description}
          </span>
        ) : null}
      </span>

      {item.badgeText ? (
        <span className="shrink-0 rounded-full bg-storefront-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-storefront-primary">
          {item.badgeText}
        </span>
      ) : null}
    </Link>
  );
}

export default function AllMenuDrawer({
  open,
  onClose,
  navigationSection,
  accountUrl = "/account",
  accountLabel = "Hello, sign in",
}: AllMenuDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [levels, setLevels] = useState<DrawerLevel[]>([]);

  const navigationMenu = useMemo(
    () => getNavigationMenu(navigationSection),
    [navigationSection]
  );

  const rootItems = useMemo(() => {
    const items = Array.isArray(navigationMenu?.items)
      ? navigationMenu.items
      : Array.isArray(navigationMenu?.children)
        ? navigationMenu.children
        : [];

    return items.filter(isVisibleItem).sort(compareNavigationItems);
  }, [navigationMenu]);

  const currentLevel = levels.length ? levels[levels.length - 1] : null;
  const displayedItems = currentLevel?.items || rootItems;
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) {
      setLevels([]);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      100
    );

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, handleClose]);

  const handleOpenChildren = (item: NavigationItem) => {
    const children = getItemChildren(item);
    if (!children.length) return;

    setLevels((current) => [
      ...current,
      {
        id: item.id,
        title: getItemLabel(item),
        items: children,
      },
    ]);
  };

  return (
    <div
      className={[
        "fixed inset-0 z-[100]",
        open ? "pointer-events-auto" : "pointer-events-none",
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
          open ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />

      <aside
        id="storefront-all-menu"
        role="dialog"
        aria-modal="true"
        aria-label="All departments menu"
        className={[
          "absolute inset-y-0 left-0 flex w-[88vw] max-w-[390px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex min-h-16 items-center justify-between gap-4 bg-slate-900 px-5 text-white">
          <Link
            href={accountUrl}
            onClick={handleClose}
            tabIndex={open ? 0 : -1}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 font-bold outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <CircleUserRound size={29} aria-hidden="true" className="shrink-0" />
            <span className="truncate text-lg">{accountLabel}</span>
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={handleClose}
            aria-label="Close navigation drawer"
            tabIndex={open ? 0 : -1}
            className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
          >
            <X size={25} aria-hidden="true" />
          </button>
        </div>

        {currentLevel ? (
          <button
            type="button"
            onClick={() => setLevels((current) => current.slice(0, -1))}
            tabIndex={open ? 0 : -1}
            className="flex min-h-14 items-center gap-3 border-b border-slate-200 px-6 text-left font-bold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Main menu</span>
          </button>
        ) : null}

        <div className="flex-1 overflow-y-auto overscroll-contain pb-10">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-extrabold text-slate-950">
              {currentLevel?.title || navigationMenu?.name || "Shop by Department"}
            </h2>
            {!currentLevel ? (
              <p className="mt-1 text-sm leading-5 text-slate-500">
                Browse products, categories, brands and offers.
              </p>
            ) : null}
          </div>

          {displayedItems.length ? (
            <nav
              aria-label={currentLevel?.title || "All departments"}
              className="py-2"
            >
              {displayedItems.map((item) => (
                <DrawerMenuItem
                  key={item.id}
                  item={item}
                  onOpenChildren={handleOpenChildren}
                  onNavigate={handleClose}
                />
              ))}
            </nav>
          ) : (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-slate-800">
                No menu items are available.
              </p>
              <p className="mt-2 text-sm leading-5 text-slate-500">
                Add navigation items through the CMS Navigation module.
              </p>
            </div>
          )}

          {!currentLevel ? (
            <div className="mt-3 border-t border-slate-200 px-6 py-6">
              <h3 className="mb-3 text-lg font-extrabold text-slate-950">
                Help & Settings
              </h3>
              <div className="-mx-6">
                {[
                  [accountUrl, "Your Account"],
                  ["/account/orders", "Your Orders"],
                  ["/wishlist", "Your Wishlist"],
                  ["/contact", "Customer Service"],
                ].map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={handleClose}
                    tabIndex={open ? 0 : -1}
                    className="block px-6 py-3 text-[15px] font-medium text-slate-800 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
