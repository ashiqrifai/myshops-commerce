import type {
  StorefrontSection,
} from "@/types/storefront";

import type {
  NavigationItem,
  NavigationMenu,
} from "./NavigationDrawer.types";

export function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function asNavigationMenu(
  value: unknown
): NavigationMenu | null {
  return isObject(value)
    ? (value as NavigationMenu)
    : null;
}

export function getNavigationMenu(
  section?:
    | StorefrontSection
    | null
): NavigationMenu | null {
  if (
    !section ||
    !isObject(section.content)
  ) {
    return null;
  }

  const content =
    section.content as Record<
      string,
      unknown
    >;

  return (
    asNavigationMenu(
      content.menuResolved
    ) ||
    asNavigationMenu(
      content.navigationResolved
    ) ||
    asNavigationMenu(
      content.menu
    ) ||
    null
  );
}

export function getItemLabel(
  item: NavigationItem
) {
  return (
    item.label?.trim() ||
    item.name?.trim() ||
    item.title?.trim() ||
    "Menu item"
  );
}

export function isVisibleItem(
  item: NavigationItem
) {
  return (
    item.isActive !== false &&
    item.mobileVisible !== false
  );
}

export function compareNavigationItems(
  first: NavigationItem,
  second: NavigationItem
) {
  const firstOrder =
    first.displayOrder ??
    first.sortOrder ??
    0;

  const secondOrder =
    second.displayOrder ??
    second.sortOrder ??
    0;

  return firstOrder - secondOrder;
}

export function getItemChildren(
  item: NavigationItem
) {
  const children =
    Array.isArray(item.children)
      ? item.children
      : Array.isArray(item.items)
        ? item.items
        : [];

  return children
    .filter(isVisibleItem)
    .sort(compareNavigationItems);
}

function normalizeUrl(
  value?: string | null
) {
  const url = value?.trim();
  return url || null;
}

export function getItemUrl(
  item: NavigationItem
) {
  const directUrl =
    normalizeUrl(item.url) ||
    normalizeUrl(item.linkUrl) ||
    normalizeUrl(item.href);

  if (directUrl) {
    return directUrl;
  }

  const itemType = String(
    item.itemType ||
      item.type ||
      ""
  )
    .trim()
    .toUpperCase();

  const target =
    item.slug?.trim() ||
    item.referenceId ||
    item.categoryId ||
    item.brandId ||
    item.productId ||
    item.cmsPageId ||
    "";

  if (!target) {
    return "#";
  }

  switch (itemType) {
    case "CATEGORY":
      return `/category/${target}`;

    case "BRAND":
      return `/brand/${target}`;

    case "COLLECTION":
      return `/collection/${target}`;

    case "PRODUCT":
      return `/product/${target}`;

    case "CMS_PAGE":
      return `/page/${target}`;

    default:
      return `/${target}`;
  }
}
