"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";


import type {
  StorefrontNavigationItem,
  StorefrontNavigationMenu,
  StorefrontSection,
  StorefrontThemeSettings,
} from "@/types/storefront";



interface MainNavigationProps {
  section:
    | StorefrontSection
    | null
    | undefined;

  theme?:
    | StorefrontThemeSettings
    | undefined;
}

interface NavigationSectionContent {
  menuId?: string;
  menuCode?: string;

  menuResolved?:
    | StorefrontNavigationMenu
    | null;
}

interface NavigationSettings {
  sticky?: boolean;
  columns?: number;
  menuType?: string;
  showIcons?: boolean;
  showImages?: boolean;
}

interface PromotionSettings {
  title?: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  description?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  textColor?: string;
  backgroundColor?: string;
  textAlign?:
    | "LEFT"
    | "CENTER"
    | "RIGHT";
  overlay?:
    | "NONE"
    | "LIGHT"
    | "DARK";
}

interface MobileNavigationLevel {
  title: string;
  items: StorefrontNavigationItem[];
}

const getBackendBaseUrl = () => {
  return (
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5080"
  ).replace(/\/$/, "");
};

const resolveMediaUrl = (
  value?: string | null
) => {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  const normalizedPath =
    value.startsWith("/")
      ? value
      : `/${value}`;

      return `${getBackendBaseUrl()}${normalizedPath}`;
};

const getNavigationUrl = (
  item: StorefrontNavigationItem
) => {
  if (item.url?.trim()) {
    return item.url.trim();
  }

  switch (item.itemType) {
    case "CATEGORY":
      return item.referenceId
        ? `/category/${item.referenceId}`
        : "#";

    case "BRAND":
      return item.referenceId
        ? `/brand/${item.referenceId}`
        : "#";

    case "COLLECTION":
      return item.referenceId
        ? `/collection/${item.referenceId}`
        : "#";

    case "CMS_PAGE":
      return item.referenceId
        ? `/page/${item.referenceId}`
        : "#";

    default:
      return "#";
  }
};

const sortNavigationItems = (
  items:
    | StorefrontNavigationItem[]
    | undefined
) => {
  return [...(items || [])]
    .filter((item) => item.isActive)
    .sort(
      (a, b) =>
        (a.displayOrder || 0) -
        (b.displayOrder || 0)
    );
};

const isPromotionItem = (
  item: StorefrontNavigationItem
) => {
  return item.itemType === "PROMOTION";
};

const getPromotionSettings = (
  item: StorefrontNavigationItem
): PromotionSettings => {
  const settings =
    item.settings || {};

  const promotion =
    settings.promotion;

  if (
    promotion &&
    typeof promotion === "object" &&
    !Array.isArray(promotion)
  ) {
    return promotion as PromotionSettings;
  }

  return {};
};

function NavigationBadge({
  item,
}: {
  item: StorefrontNavigationItem;
}) {
  if (!item.badgeText) {
    return null;
  }

  return (
    <span
      className="ml-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={{
        color: item.badgeColor
          ? "#FFFFFF"
          : "#111318",

        backgroundColor:
          item.badgeColor ||
          "#F5D547",
      }}
    >
      {item.badgeText}
    </span>
  );
}

function NavigationLink({
  item,
  className = "",
  onClick,
}: {
  item: StorefrontNavigationItem;
  className?: string;
  onClick?: () => void;
}) {
  const href =
    getNavigationUrl(item);

  const content = (
    <>
      <span>{item.label}</span>

      <NavigationBadge
        item={item}
      />
    </>
  );

  if (href === "#") {
    return (
      <span
        className={className}
        onClick={onClick}
      >
        {content}
      </span>
    );
  }

  return (
    <Link
      href={href}
      target={
        item.openInNewTab
          ? "_blank"
          : undefined
      }
      rel={
        item.openInNewTab
          ? "noopener noreferrer"
          : undefined
      }
      className={className}
      onClick={onClick}
    >
      {content}
    </Link>
  );
}

function PromotionCard({
  item,
  showImages,
}: {
  item: StorefrontNavigationItem;
  showImages: boolean;
}) {
  const promotion =
    getPromotionSettings(item);

  const imageUrl =
    showImages
      ? resolveMediaUrl(
          item.mediaAsset
            ?.publicUrl ||
            item.mediaAsset
              ?.previewUrl ||
            item.mediaAsset
              ?.thumbnailUrl
        )
      : null;

  const href =
    promotion.ctaUrl ||
    item.url ||
    "#";

  const textAlignment =
    promotion.textAlign === "CENTER"
      ? "text-center items-center"
      : promotion.textAlign ===
          "RIGHT"
        ? "text-right items-end"
        : "text-left items-start";

  const overlayClass =
    promotion.overlay === "DARK"
      ? "bg-black/55"
      : promotion.overlay ===
          "LIGHT"
        ? "bg-white/15"
        : "";

  const card = (
    <div
      className="group/promo relative flex min-h-[205px] overflow-hidden rounded-2xl border border-black/[0.08] shadow-[0_8px_25px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,0.16)]"
      style={{
        backgroundColor:
          promotion.backgroundColor ||
          "#303030",

        color:
          promotion.textColor ||
          "#FFFFFF",
      }}
    >
      {imageUrl ? (
        // Using a normal image here allows
        // backend-hosted dynamic media.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={
            item.mediaAsset
              ?.altText ||
            item.label
          }
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/promo:scale-[1.04]"
        />
      ) : null}

      <div
        className={`absolute inset-0 ${overlayClass}`}
      />

      <div
        className={`relative z-10 flex w-full flex-col justify-end gap-1.5 p-5 ${textAlignment}`}
      >
        {promotion.eyebrow ? (
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-85">
            {promotion.eyebrow}
          </span>
        ) : null}

        <strong className="text-lg leading-tight">
          {promotion.title ||
            item.label}
        </strong>

        {promotion.subtitle ? (
          <span className="text-sm font-medium opacity-90">
            {promotion.subtitle}
          </span>
        ) : null}

        {promotion.description ? (
          <span className="text-xs leading-relaxed opacity-80">
            {
              promotion.description
            }
          </span>
        ) : null}

        {promotion.ctaText ? (
          <span className="mt-3 inline-flex w-fit items-center rounded-full bg-white px-4 py-2 text-xs font-black text-black shadow-sm transition-transform group-hover/promo:translate-x-1">
            {promotion.ctaText}
          </span>
        ) : null}
      </div>
    </div>
  );

  if (href === "#") {
    return card;
  }

  return (
    <Link
      href={href}
      target={
        item.openInNewTab
          ? "_blank"
          : undefined
      }
      rel={
        item.openInNewTab
          ? "noopener noreferrer"
          : undefined
      }
      className="block"
    >
      {card}
    </Link>
  );
}

function DesktopMegaMenu({
  item,
  columns,
  showImages,
}: {
  item: StorefrontNavigationItem;
  columns: number;
  showImages: boolean;
}) {
  const children =
    sortNavigationItems(
      item.children
    ).filter(
      (child) =>
        child.desktopVisible !== false
    );

  const normalItems =
    children.filter(
      (child) =>
        !isPromotionItem(child)
    );

  const promotionItems =
    children.filter(
      isPromotionItem
    );

  const safeColumnCount =
    Math.min(
      Math.max(columns, 1),
      6
    );

  const groupedItems =
    Array.from(
      {
        length: safeColumnCount,
      },
      () =>
        [] as StorefrontNavigationItem[]
    );

  normalItems.forEach(
    (child, index) => {
      const requestedColumn =
        Number(
          child.columnNumber
        );

      const columnIndex =
        Number.isFinite(
          requestedColumn
        ) &&
        requestedColumn > 0
          ? Math.min(
              requestedColumn - 1,
              safeColumnCount - 1
            )
          : index %
            safeColumnCount;

      groupedItems[
        columnIndex
      ].push(child);
    }
  );

  return (
    <div className="storefront-mega-menu invisible absolute left-0 top-full z-50 w-full translate-y-3 opacity-0 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
  <div
  className={[
    "border-t border-black/[0.05]",
    "bg-white text-[#111318]",
    "shadow-[0_24px_70px_rgba(15,23,42,0.16)]",

    /*
     * Force every navigation destination
     * inside the white mega menu to use
     * dark text, regardless of item type.
     */
    "[&_a]:!text-[#111318]",
    "[&_button]:!text-[#111318]",

    /*
     * Teal hover colour for all links.
     */
    "[&_a:hover]:!text-[#1597A1]",
    "[&_button:hover]:!text-[#1597A1]",
  ].join(" ")}
>
      <div className="mx-auto grid max-w-[1440px] grid-cols-12 gap-8 px-8 py-8">
        <div
          className={
            promotionItems.length
              ? "col-span-8"
              : "col-span-12"
          }
        >
          <div
            className="grid gap-x-8 gap-y-6"
            style={{
              gridTemplateColumns:
                `repeat(${safeColumnCount}, minmax(0, 1fr))`,
            }}
          >
            {groupedItems.map(
              (
                columnItems,
                columnIndex
              ) => (
                <div
                  key={
                    columnIndex
                  }
                  className="space-y-1"
                >
                  {columnItems.map(
                    (child) => (
                      <div
                        key={
                          child.id
                        }
                        className="mb-4"
                      >
                        <NavigationLink
  item={child}
  className="flex items-center py-2 text-sm font-semibold !text-[#111318] transition-colors hover:!text-[#1597A1]"
/>

                        {child
                          .description ? (
                          <p className="mt-1 text-xs leading-relaxed text-[#667085]">
                            {
                              child.description
                            }
                          </p>
                        ) : null}

                        {child
                          .children
                          ?.length ? (
                          <div className="mt-2 space-y-1.5 border-l border-black/10 pl-3">
                            {sortNavigationItems(
                              child.children
                            )
                              .filter(
                                (
                                  nested
                                ) =>
                                  nested.desktopVisible !==
                                  false
                              )
                              .map(
                                (
                                  nested
                                ) => (
                                  <NavigationLink
  key={nested.id}
  item={nested}
  className="flex items-center py-1 text-xs font-medium !text-[#667085] transition-colors hover:!text-[#1597A1]"
/>
                                )
                              )}
                          </div>
                        ) : null}
                      </div>
                    )
                  )}
                </div>
              )
            )}
          </div>
        </div>

        {promotionItems.length ? (
          <div className="col-span-4 grid gap-4">
            {promotionItems
              .slice(0, 2)
              .map((promotion) => (
                <PromotionCard
                  key={
                    promotion.id
                  }
                  item={
                    promotion
                  }
                  showImages={
                    showImages
                  }
                />
              ))}
          </div>
        ) : null}
      </div>
    </div>
  </div>
  );
}

function DesktopNavigation({
  menu,
  settings,
  theme,
}: {
  menu: StorefrontNavigationMenu;
  settings: NavigationSettings;
  theme?:
    | StorefrontThemeSettings;
}) {
  const items =
    sortNavigationItems(
      menu.items
    ).filter(
      (item) =>
        item.desktopVisible !== false
    );

  const columns =
    Number(
      settings.columns ||
        menu.settings
          ?.maxColumns ||
        4
    );

  return (
    <nav
    aria-label="Main navigation"
    className="relative hidden border-b border-black bg-[#050505] text-white shadow-sm lg:block"
      style={{
        backgroundColor:
          "#050505",

        color:
          "#FFFFFF",
      }}
    >
      <div className="mx-auto flex min-h-[48px] max-w-[1440px] items-stretch justify-center gap-0 px-4 lg:px-8">
        {items.map((item) => {
          const hasChildren =
            Boolean(
              item.children
                ?.length
            );

          return (
            <div
              key={item.id}
              className="group static flex items-stretch"
            >
              <NavigationLink
                item={item}
                className={[
                  "storefront-desktop-nav-link relative flex items-center px-4 py-3 text-[14px] font-bold tracking-[0.01em] text-white transition-colors hover:text-[#53C7CF]",
                  item.label
                    .toLowerCase()
                    .includes("express")
                    ? "italic text-[#53C7CF]"
                    : "",
                ].join(" ")}
              />

              {hasChildren ? (
                <DesktopMegaMenu
                  item={item}
                  columns={
                    Number.isFinite(
                      columns
                    )
                      ? columns
                      : 4
                  }
                  showImages={
                    settings.showImages !==
                    false
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </nav>
  );
}


function MobileDrawerItem({
  item,
  onNavigate,
  onOpenChildren,
}: {
  item: StorefrontNavigationItem;
  onNavigate: () => void;
  onOpenChildren: (
    item: StorefrontNavigationItem
  ) => void;
}) {
  const children =
    sortNavigationItems(
      item.children
    ).filter(
      (child) =>
        child.mobileVisible !== false
    );

  const hasChildren =
    children.length > 0;

  const imageUrl =
    resolveMediaUrl(
      item.mediaAsset?.thumbnailUrl ||
        item.mediaAsset?.previewUrl ||
        item.mediaAsset?.publicUrl
    );

  if (isPromotionItem(item)) {
    return (
      <div className="px-4 py-3">
        <PromotionCard
          item={item}
          showImages
        />
      </div>
    );
  }

  return (
    <div className="border-b border-black/[0.06] last:border-b-0">
      <div className="flex min-h-[66px] items-center gap-3 px-4">
        {imageUrl ? (
          <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-black/[0.06] bg-[#f8fafc]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={
                item.mediaAsset?.altText ||
                item.label
              }
              className="h-full w-full object-contain p-1.5"
            />
          </div>
        ) : (
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-storefront-secondary text-sm font-bold text-storefront-primary">
            {item.label
              .slice(0, 1)
              .toUpperCase()}
          </div>
        )}

        <NavigationLink
          item={item}
          onClick={
            hasChildren
              ? undefined
              : onNavigate
          }
          className="flex min-w-0 flex-1 items-center text-[15px] font-semibold text-storefront-text"
        />

        {hasChildren ? (
          <button
            type="button"
            aria-label={`Open ${item.label}`}
            onClick={() =>
              onOpenChildren(item)
            }
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-storefront-muted transition hover:bg-storefront-secondary hover:text-storefront-primary"
          >
            <ChevronRight
              size={19}
            />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function MobileNavigation({
  menu,
  theme,
}: {
  menu: StorefrontNavigationMenu;
  theme?:
    | StorefrontThemeSettings;
}) {
  const [open, setOpen] =
    useState(false);

  const [levels, setLevels] =
    useState<
      MobileNavigationLevel[]
    >([]);

  const rootItems =
    useMemo(
      () =>
        sortNavigationItems(
          menu.items
        ).filter(
          (item) =>
            item.mobileVisible !==
            false
        ),
      [menu.items]
    );

  const currentLevel =
    levels.length > 0
      ? levels[levels.length - 1]
      : {
          title: "Shop categories",
          items: rootItems,
        };

  const closeDrawer = () => {
    setOpen(false);
    setLevels([]);
  };

  const openChildren = (
    item: StorefrontNavigationItem
  ) => {
    const childItems =
      sortNavigationItems(
        item.children
      ).filter(
        (child) =>
          child.mobileVisible !==
          false
      );

    if (!childItems.length) {
      return;
    }

    setLevels((current) => [
      ...current,
      {
        title: item.label,
        items: childItems,
      },
    ]);
  };

  const goBack = () => {
    setLevels((current) =>
      current.slice(0, -1)
    );
  };

  useEffect(() => {
    const handleOpenNavigation =
      () => {
        setOpen(true);
      };

    window.addEventListener(
      "storefront:open-navigation",
      handleOpenNavigation
    );

    return () => {
      window.removeEventListener(
        "storefront:open-navigation",
        handleOpenNavigation
      );
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.body.style.overflow =
        originalOverflow;

      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [open]);

  return (
    <>
      <div
        className="border-b border-black/[0.07] lg:hidden"
        style={{
          backgroundColor:
            theme?.surfaceColor ||
            "#FFFFFF",
        }}
      >
        <div className="mx-auto flex min-h-11 max-w-[1440px] items-center px-4 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={open}
            onClick={() =>
              setOpen(true)
            }
            className="flex items-center gap-2.5 py-3 text-sm font-bold text-storefront-text transition hover:text-storefront-primary"
          >
            <Menu size={19} />

            <span>
              Shop categories
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden={!open}
        className={[
          "fixed inset-0 z-[100] lg:hidden",
          open
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
      >
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeDrawer}
          className={[
            "absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-300",
            open
              ? "opacity-100"
              : "opacity-0",
          ].join(" ")}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
          className={[
            "absolute inset-y-0 left-0 flex w-[min(92vw,390px)] flex-col bg-white shadow-[20px_0_60px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out",
            open
              ? "translate-x-0"
              : "-translate-x-full",
          ].join(" ")}
        >
          <div className="flex min-h-[72px] items-center justify-between border-b border-black/[0.07] px-4">
            <div className="flex min-w-0 items-center gap-3">
              {levels.length ? (
                <button
                  type="button"
                  aria-label="Go back"
                  onClick={goBack}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full transition hover:bg-storefront-secondary"
                >
                  <ArrowLeft
                    size={20}
                  />
                </button>
              ) : (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-storefront-primary text-white">
                  <Menu size={20} />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-storefront-muted">
                  MyShops
                </p>

                <h2 className="truncate text-base font-black text-storefront-text">
                  {
                    currentLevel.title
                  }
                </h2>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={closeDrawer}
              className="flex size-10 shrink-0 items-center justify-center rounded-full transition hover:bg-storefront-secondary"
            >
              <X size={21} />
            </button>
          </div>

          <div className="border-b border-black/[0.06] bg-[#f8fafc] px-4 py-3">
            <div className="rounded-xl border border-black/[0.07] bg-white px-4 py-3 text-xs leading-relaxed text-storefront-muted">
              Browse mobiles, laptops,
              accessories and the latest
              MyShops offers.
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div
              key={
                currentLevel.title
              }
              className="storefront-mobile-menu-level"
            >
              {currentLevel.items.map(
                (item) => (
                  <MobileDrawerItem
                    key={item.id}
                    item={item}
                    onNavigate={
                      closeDrawer
                    }
                    onOpenChildren={
                      openChildren
                    }
                  />
                )
              )}
            </div>
          </div>

          <div className="border-t border-black/[0.07] bg-[#f8fafc] p-4">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/account"
                onClick={closeDrawer}
                className="rounded-xl border border-black/[0.07] bg-white px-3 py-3 text-center text-xs font-bold text-storefront-text"
              >
                My account
              </Link>

              <Link
                href="/contact"
                onClick={closeDrawer}
                className="rounded-xl bg-storefront-primary px-3 py-3 text-center text-xs font-bold text-white"
              >
                Get support
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}



export default function MainNavigation({
  section,
  theme,
}: MainNavigationProps) {
  const content =
    (section?.content ||
      {}) as NavigationSectionContent;

  const settings =
    (section?.settings ||
      {}) as NavigationSettings;

  const menu =
    content.menuResolved;

  const hasItems =
    Boolean(menu?.items?.length);

  const sortedMenu =
    useMemo(() => {
      if (!menu) {
        return null;
      }

      return {
        ...menu,
        items:
          sortNavigationItems(
            menu.items
          ),
      };
    }, [menu]);

  if (
    !section ||
    !sortedMenu ||
    !hasItems
  ) {
    return null;
  }

  return (
    <div
      className={
        settings.sticky
          ? "sticky top-0 z-40"
          : ""
      }
    >
      <DesktopNavigation
        menu={sortedMenu}
        settings={settings}
        theme={theme}
      />

      <MobileNavigation
        menu={sortedMenu}
        theme={theme}
      />
    </div>
  );
}