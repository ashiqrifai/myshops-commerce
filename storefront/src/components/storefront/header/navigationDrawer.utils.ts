import type {
  PublicCategoryTreeItem,
} from "@/lib/storefront/public-category-tree-api";

import type {
  NavigationItem,
} from "./NavigationDrawer.types";

export function categoryToNavigationItem(
  category: PublicCategoryTreeItem
): NavigationItem {
  return {
    id: category.id,
    label: category.name,
    name: category.name,
    slug: category.slug,
    itemType: "CATEGORY",
    categoryId: category.id,
    referenceId: category.slug,
    url: `/category/${category.slug}`,
    description:
      category.shortDescription ||
      category.description ||
      null,
    isActive: category.isActive !== false,
    mobileVisible: category.showInMenu !== false,
    desktopVisible: category.showInMenu !== false,
    sortOrder: category.sortOrder ?? 0,
    children: Array.isArray(category.children)
      ? category.children.map(categoryToNavigationItem)
      : [],
  };
}

export function getItemLabel(
  item: NavigationItem
) {
  return (
    item.label?.trim() ||
    item.name?.trim() ||
    item.title?.trim() ||
    "Category"
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
  const children = Array.isArray(
    item.children
  )
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
