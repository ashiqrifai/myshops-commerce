"use client";

import {
    Heart,
    Menu,
    Package,
    Search,
    ShoppingCart,
    UserRound,
  } from "lucide-react";

import Link from "next/link";
import CustomerNotificationBell from "./CustomerNotificationBell";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  CSSProperties,
} from "react";

import type {
  StorefrontData,
  StorefrontSection,
} from "@/types/storefront";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCustomer,
  selectCustomerAuthenticated,
} from "@/store/slices/customerAuthSlice";



import {
  selectCartItemCount,
} from "@/store/slices/cartSlice";

import {
  selectWishlistItemCount,
} from "@/store/slices/wishlistSlice";

import {
  getBoolean,
  getNumber,
  getSectionContent,
  getSectionSettings,
  getString,
} from "./header.utils";

import NavigationDrawer from "./NavigationDrawer";

interface MainHeaderProps {
    storefront: StorefrontData;
  
    section?:
      | StorefrontSection
      | null;
  
    navigationSection?:
      | StorefrontSection
      | null;
  }

interface HeaderActionProps {
  href: string;
  label: string;
  ariaLabel: string;
  showLabel: boolean;
  children: React.ReactNode;
  hiddenOnSmall?: boolean;
}

function HeaderAction({
  href,
  label,
  ariaLabel,
  showLabel,
  children,
  hiddenOnSmall = false,
}: HeaderActionProps) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className={[
        "group flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-storefront-text transition-colors hover:bg-storefront-secondary hover:text-storefront-primary",
        hiddenOnSmall
          ? "hidden sm:flex"
          : "flex",
      ].join(" ")}
    >
      <span className="shrink-0">
        {children}
      </span>

      {showLabel ? (
        <span className="hidden whitespace-nowrap text-xs font-semibold xl:inline">
          {label}
        </span>
      ) : null}
    </Link>
  );
}

export default function MainHeader({
    storefront,
    section,
    navigationSection,
  }: MainHeaderProps) {
  const router = useRouter();

  const cartItemCount =
  useAppSelector(
    selectCartItemCount
  );

  const wishlistItemCount =
    useAppSelector(
      selectWishlistItemCount
    );

  const customer =
    useAppSelector(
      selectCustomer
    );

  const customerAuthenticated =
    useAppSelector(
      selectCustomerAuthenticated
    );

  const [
    isAllMenuOpen,
    setIsAllMenuOpen,
  ] = useState(false);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const websiteSettings =
    storefront.settings.website || {};

  const companySettings =
    storefront.settings.company || {};

  const sectionSettings =
    getSectionSettings(section);

  const sectionContent =
    getSectionContent(section);

  const headerEnabled =
    getBoolean(
      sectionSettings.enabled,
      websiteSettings.headerEnabled !==
        false
    );

  if (!headerEnabled) {
    return null;
  }

  const sticky =
    getBoolean(
      sectionSettings.sticky,
      websiteSettings.headerSticky !==
        false
    );

  const showLogo =
    getBoolean(
      sectionSettings.showLogo,
      true
    );

  const showCategorySelector =
    getBoolean(
      sectionSettings
        .showCategorySelector,
      true
    );

  const showSearch =
    getBoolean(
      sectionSettings.showSearch,
      websiteSettings.showSearch !==
        false
    );

  const showLogin =
    getBoolean(
      sectionSettings.showLogin,
      websiteSettings.showAccount !==
        false
    );

  const showOrders =
    getBoolean(
      sectionSettings.showOrders,
      true
    );

  const showWishlist =
    getBoolean(
      sectionSettings.showWishlist,
      websiteSettings.showWishlist !==
        false &&
        websiteSettings.wishlistEnabled !==
          false
    );

  const showCart =
    getBoolean(
      sectionSettings.showCart,
      websiteSettings.showCart !==
        false
    );

  const showActionLabels =
    getBoolean(
      sectionSettings
        .showActionLabels,
      true
    );

  const showMobileSearch =
    getBoolean(
      sectionSettings
        .showMobileSearch,
      true
    );

  const desktopHeight =
    Math.max(
      getNumber(
        sectionSettings.desktopHeight,
        72
      ),
      60
    );

  const mobileHeight =
    Math.max(
      getNumber(
        sectionSettings.mobileHeight,
        64
      ),
      56
    );

  const contentMaxWidth =
    Math.max(
      getNumber(
        sectionSettings.contentMaxWidth,
        1440
      ),
      960
    );

  const logoWidth =
    Math.max(
      getNumber(
        sectionSettings.logoWidth,
        150
      ),
      80
    );

  const backgroundColor =
    getString(
      sectionSettings.backgroundColor,
      "var(--storefront-surface)"
    );

  const textColor =
    getString(
      sectionSettings.textColor,
      "var(--storefront-text)"
    );

  const borderColor =
    getString(
      sectionSettings.borderColor,
      "var(--storefront-border)"
    );

  const searchBackgroundColor =
    getString(
      sectionSettings
        .searchBackgroundColor,
      "var(--storefront-secondary)"
    );

  const searchButtonColor =
    getString(
      sectionSettings
        .searchButtonColor,
      "var(--storefront-primary)"
    );

  const displayName =
    companySettings.displayName ||
    storefront.company.name;

  const logoUrl =
    companySettings.logoUrl ||
    storefront.company.logoUrl ||
    null;

  const searchPlaceholder =
    getString(
      sectionContent
        .searchPlaceholder,
      websiteSettings
        .searchPlaceholder ||
        "Search products, brands and categories"
    );

  const categorySelectorLabel =
    getString(
      sectionContent
        .categorySelectorLabel,
      "All"
    );

  const loginLabel =
    getString(
      sectionContent.loginLabel,
      "Log in"
    );

  const ordersLabel =
    getString(
      sectionContent.ordersLabel,
      "Orders"
    );

  const wishlistLabel =
    getString(
      sectionContent
        .wishlistLabel,
      "Wishlist"
    );

  const cartLabel =
    getString(
      sectionContent.cartLabel,
      "Cart"
    );

  const accountUrl =
    getString(
      sectionContent.accountUrl,
      "/account"
    );

  const resolvedAccountUrl =
    customerAuthenticated
      ? accountUrl
      : "/account/login";



  const resolvedLoginLabel =
    customerAuthenticated &&
    customer
      ? `Hi ${customer.firstName}`
      : loginLabel;

  const ordersUrl =
    getString(
      sectionContent.ordersUrl,
      "/account/orders"
    );

  const wishlistUrl =
    getString(
      sectionContent.wishlistUrl,
      "/wishlist"
    );

  const cartUrl =
    getString(
      sectionContent.cartUrl,
      "/cart"
    );

  const handleSearch = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const value =
      searchText.trim();

    if (!value) {
      return;
    }

    router.push(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );
  };

  const headerStyle = {
    "--header-desktop-height":
      `${desktopHeight}px`,

    "--header-mobile-height":
      `${mobileHeight}px`,

    "--header-max-width":
      `${contentMaxWidth}px`,

    "--header-logo-width":
      `${logoWidth}px`,

    backgroundColor,
    color: textColor,
    borderColor,
  } as CSSProperties;

  return (
    <>
    <header
      className={[
        "z-50 w-full border-b bg-white",
        sticky
          ? "sticky top-0"
          : "",
      ].join(" ")}
      style={headerStyle}
    >
      <div className="mx-auto flex min-h-[var(--header-mobile-height)] max-w-[var(--header-max-width)] items-center gap-3 px-4 sm:px-6 lg:min-h-[var(--header-desktop-height)] lg:gap-6 lg:px-8">
        <button
          type="button"
          aria-label="Open all departments menu"
          aria-controls="storefront-all-menu"
          aria-expanded={isAllMenuOpen}
          onClick={() =>
            setIsAllMenuOpen(true)
          }
          className="flex size-10 shrink-0 items-center justify-center rounded-storefront-button transition hover:bg-storefront-secondary lg:hidden"
        >
          <Menu size={22} />
        </button>

        {showLogo ? (
          <Link
            href="/"
            className="flex shrink-0 items-center"
            aria-label={`${displayName} home`}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={displayName}
                className="h-auto max-h-12 w-auto max-w-[var(--header-logo-width)] object-contain"
              />
            ) : (
              <span className="max-w-[var(--header-logo-width)] truncate text-2xl font-black tracking-tight text-black sm:text-3xl">
                {displayName}
              </span>
            )}
          </Link>
        ) : null}

        {showSearch ? (
          <form
            onSubmit={handleSearch}
            className="hidden min-w-0 flex-1 lg:block"
          >
            <div
              className="flex h-12 overflow-hidden rounded-xl border shadow-sm"
              style={{
                backgroundColor:
                  searchBackgroundColor,
                borderColor,
              }}
            >
              {showCategorySelector ? (
                <button
                  type="button"
                  aria-label="Open all departments menu"
                  aria-controls="storefront-all-menu"
                  aria-expanded={isAllMenuOpen}
                  onClick={() =>
                    setIsAllMenuOpen(true)
                  }
                  className="flex min-w-28 shrink-0 items-center justify-center gap-2 border-r px-4 text-sm font-bold transition hover:bg-black/5"
                  style={{
                    borderColor,
                  }}
                >
                  <Menu size={17} />

                  <span>
                    {categorySelectorLabel}
                  </span>
                </button>
              ) : null}

              <div className="relative min-w-0 flex-1">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
                />

                <input
                  type="search"
                  value={searchText}
                  onChange={(event) =>
                    setSearchText(
                      event.target.value
                    )
                  }
                  placeholder={
                    searchPlaceholder
                  }
                  aria-label="Search products"
                  className="h-full w-full border-0 bg-transparent pl-11 pr-4 text-sm text-storefront-text outline-none placeholder:text-storefront-muted"
                />
              </div>

              <button
                type="submit"
                aria-label="Submit search"
                className="flex w-14 shrink-0 items-center justify-center text-white transition hover:brightness-95"
                style={{
                  backgroundColor:
                    searchButtonColor,
                }}
              >
                <Search size={20} />
              </button>
            </div>
          </form>
        ) : null}

        <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">
          {showLogin ? (
            <HeaderAction
              href={resolvedAccountUrl}
              label={resolvedLoginLabel}
              ariaLabel={
                customerAuthenticated
                  ? "Customer account"
                  : "Sign in"
              }
              showLabel={
                showActionLabels
              }
            >
              <UserRound
                size={21}
              />
            </HeaderAction>
          ) : null}

          {showOrders ? (
            <HeaderAction
              href={ordersUrl}
              label={ordersLabel}
              ariaLabel="Orders"
              showLabel={
                showActionLabels
              }
              hiddenOnSmall
            >
              <Package size={21} />
            </HeaderAction>
          ) : null}

          {customerAuthenticated ? (
            <CustomerNotificationBell />
          ) : null}

          {showWishlist ? (
            <HeaderAction
              href={wishlistUrl}
              label={
                wishlistLabel
              }
              ariaLabel="Wishlist"
              showLabel={
                showActionLabels
              }
              hiddenOnSmall
            >
              <span className="relative">
                <Heart size={21} />

                {wishlistItemCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-storefront-primary px-1 text-[9px] font-bold leading-none text-white">
                    {wishlistItemCount > 99
                      ? "99+"
                      : wishlistItemCount}
                  </span>
                ) : null}
              </span>
            </HeaderAction>
          ) : null}

          {showCart ? (
            <Link
              href={cartUrl}
              aria-label="Shopping cart"
              className="relative flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-storefront-text transition-colors hover:bg-storefront-secondary hover:text-storefront-primary"
            >
              <span className="relative">
                <ShoppingCart
                  size={22}
                />

              {cartItemCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-storefront-primary px-1 text-[9px] font-bold leading-none text-white">
                  {cartItemCount > 99
                    ? "99+"
                    : cartItemCount}
                </span>
              ) : null}
              </span>

              {showActionLabels ? (
                <span className="hidden text-xs font-semibold xl:inline">
                  {cartLabel}
                </span>
              ) : null}
            </Link>
          ) : null}
        </nav>
      </div>

      {showSearch &&
      showMobileSearch ? (
        <form
          onSubmit={handleSearch}
          className="border-t px-4 py-3 lg:hidden"
          style={{
            borderColor,
          }}
        >
          <div
            className="mx-auto flex h-11 max-w-[var(--header-max-width)] overflow-hidden rounded-storefront-button border"
            style={{
              backgroundColor:
                searchBackgroundColor,
              borderColor,
            }}
          >
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
              />

              <input
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(
                    event.target.value
                  )
                }
                placeholder={
                  searchPlaceholder
                }
                aria-label="Search products"
                className="h-full w-full border-0 bg-transparent pl-11 pr-3 text-sm text-storefront-text outline-none"
              />
            </div>

            <button
              type="submit"
              aria-label="Submit search"
              className="flex w-12 shrink-0 items-center justify-center text-white"
              style={{
                backgroundColor:
                  searchButtonColor,
              }}
            >
              <Search size={18} />
            </button>
          </div>
        </form>
      ) : null}
    </header>

    <NavigationDrawer
      open={isAllMenuOpen}
      onClose={() =>
        setIsAllMenuOpen(false)
      }
      navigationSection={
        navigationSection
      }
      accountUrl={resolvedAccountUrl}
      accountLabel={resolvedLoginLabel}
    />
    </>
  );
}