"use client";

export interface NavigationItem {
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

export interface NavigationMenu {
  id?: string;
  name?: string;
  code?: string;
  menuType?: string;

  items?: NavigationItem[] | null;
  children?: NavigationItem[] | null;
}

export interface DrawerLevel {
  id: string;
  title: string;
  items: NavigationItem[];
}
