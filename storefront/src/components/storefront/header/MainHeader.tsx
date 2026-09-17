"use client";

import {
  Heart,
  ImageIcon,
  Menu,
  Package,
  Search,
  ShoppingCart,
  Truck,
  UserRound,
} from "lucide-react";

import Link from "next/link";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  CSSProperties,
} from "react";

import CustomerNotificationBell from "./CustomerNotificationBell";

import {
  quickSearchProducts,
} from "@/lib/storefront/public-quick-search-api";

import type {
  QuickSearchProduct,
} from "@/lib/storefront/public-quick-search-api";

import {
  trackStorefrontActivity,
} from "@/lib/storefront/storefront-activity-api";

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

/*
|--------------------------------------------------------------------------
| Logo
|--------------------------------------------------------------------------
*/

const MYSHOPS_LOGO_URL =
  "https://api.vkposme.tech/media/eba8444b-69bb-4d13-84cb-1c0a63313075/fb4697a6-c36f-4b05-aa6b-68810ba0345c/original/myshops-logo-landscape-2-afede6ebaee175db.avif";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface MainHeaderProps {
  storefront:
    StorefrontData;

  section?:
    | StorefrontSection
    | null;

  navigationSection?:
    | StorefrontSection
    | null;
}

interface HeaderActionProps {
  href:
    string;

  label:
    string;

  ariaLabel:
    string;

  showLabel:
    boolean;

  children:
    React.ReactNode;

  hiddenOnSmall?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| Header Action
|--------------------------------------------------------------------------
*/

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
      href={
        href
      }
      aria-label={
        ariaLabel
      }
      className={[
        "group flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-storefront-text transition-colors hover:bg-storefront-secondary hover:text-storefront-primary",

        hiddenOnSmall
          ? "hidden sm:flex"
          : "flex",
      ].join(
        " "
      )}
    >
      <span className="shrink-0">
        {
          children
        }
      </span>

      {showLabel ? (
        <span className="hidden whitespace-nowrap text-xs font-semibold xl:inline">
          {
            label
          }
        </span>
      ) : null}
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| Quick Search Image
|--------------------------------------------------------------------------
*/

const getQuickSearchImage = (
  product:
    QuickSearchProduct
): string | null => {
  const asset =
    product.image
      ?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "SMALL"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "THUMBNAIL"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.variantType ===
        "MEDIUM"
    ) ||
    asset.variants?.find(
      (
        item
      ) =>
        item.isPrimary
    );

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Quick Search Money
|--------------------------------------------------------------------------
*/

const quickSearchMoney = (
  value:
    | number
    | string
    | null
    | undefined,

  currencyCode:
    string
) => {
  if (
    value == null ||
    !Number.isFinite(
      Number(
        value
      )
    )
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency:
        currencyCode ||
        "AED",

      minimumFractionDigits:
        2,

      maximumFractionDigits:
        2,
    }
  ).format(
    Number(
      value
    )
  );
};

/*
|--------------------------------------------------------------------------
| Main Header
|--------------------------------------------------------------------------
*/

export default function MainHeader({
  storefront,
  section,
}: MainHeaderProps) {
  const router =
    useRouter();

  /*
  |--------------------------------------------------------------------------
  | Redux
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    isAllMenuOpen,
    setIsAllMenuOpen,
  ] =
    useState(
      false
    );

  const [
    searchText,
    setSearchText,
  ] =
    useState(
      ""
    );

  const [
    quickResults,
    setQuickResults,
  ] =
    useState<
      QuickSearchProduct[]
    >(
      []
    );

  const [
    quickSearchLoading,
    setQuickSearchLoading,
  ] =
    useState(
      false
    );

  const [
    quickSearchOpen,
    setQuickSearchOpen,
  ] =
    useState(
      false
    );

  const searchContainerRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | CMS
  |--------------------------------------------------------------------------
  */

  const websiteSettings =
    storefront.settings
      .website ||
    {};

  const companySettings =
    storefront.settings
      .company ||
    {};

  const sectionSettings =
    getSectionSettings(
      section
    );

  const sectionContent =
    getSectionContent(
      section
    );

  const headerEnabled =
    getBoolean(
      sectionSettings.enabled,

      websiteSettings
        .headerEnabled !==
        false
    );

  /*
  |--------------------------------------------------------------------------
  | Quick Search
  |--------------------------------------------------------------------------
  |
  | Search after:
  | - minimum 2 characters
  | - 300ms debounce
  |
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !headerEnabled
      ) {
        return;
      }

      const value =
        searchText.trim();

      if (
        value.length <
        2
      ) {
        setQuickResults(
          []
        );

        setQuickSearchLoading(
          false
        );

        setQuickSearchOpen(
          false
        );

        return;
      }

      let cancelled =
        false;

      setQuickSearchLoading(
        true
      );

      const timer =
        window.setTimeout(
          async () => {
            try {
              const results =
                await quickSearchProducts(
                  value
                );

              if (
                cancelled
              ) {
                return;
              }

              setQuickResults(
                results
              );

              setQuickSearchOpen(
                true
              );
            } catch (
              error
            ) {
              console.error(
                "[Quick search error]",
                error
              );

              if (
                cancelled
              ) {
                return;
              }

              setQuickResults(
                []
              );

              setQuickSearchOpen(
                true
              );
            } finally {
              if (
                !cancelled
              ) {
                setQuickSearchLoading(
                  false
                );
              }
            }
          },
          100
        );

      return () => {
        cancelled =
          true;

        window.clearTimeout(
          timer
        );
      };
    },
    [
      searchText,
      headerEnabled,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Close Search On Outside Click
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const handleClickOutside =
        (
          event:
            MouseEvent
        ) => {
          if (
            searchContainerRef
              .current &&
            !searchContainerRef
              .current
              .contains(
                event.target as Node
              )
          ) {
            setQuickSearchOpen(
              false
            );
          }
        };

      document.addEventListener(
        "mousedown",
        handleClickOutside
      );

      return () => {
        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Disabled Header
  |--------------------------------------------------------------------------
  */

  if (
    !headerEnabled
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Settings
  |--------------------------------------------------------------------------
  */

  const sticky =
    getBoolean(
      sectionSettings.sticky,

      websiteSettings
        .headerSticky !==
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

      websiteSettings
        .showSearch !==
        false
    );

  const showLogin =
    getBoolean(
      sectionSettings.showLogin,

      websiteSettings
        .showAccount !==
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

      websiteSettings
        .showWishlist !==
        false &&
      websiteSettings
        .wishlistEnabled !==
        false
    );

  const showCart =
    getBoolean(
      sectionSettings.showCart,

      websiteSettings
        .showCart !==
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

  /*
  |--------------------------------------------------------------------------
  | Dimensions
  |--------------------------------------------------------------------------
  */

  const desktopHeight =
    Math.max(
      getNumber(
        sectionSettings
          .desktopHeight,
        72
      ),
      60
    );

  const mobileHeight =
    Math.max(
      getNumber(
        sectionSettings
          .mobileHeight,
        64
      ),
      56
    );

  const contentMaxWidth =
    Math.max(
      getNumber(
        sectionSettings
          .contentMaxWidth,
        1440
      ),
      960
    );

  const logoWidth =
    Math.max(
      getNumber(
        sectionSettings
          .logoWidth,
        150
      ),
      80
    );

  /*
  |--------------------------------------------------------------------------
  | Colors
  |--------------------------------------------------------------------------
  */

  const backgroundColor =
    getString(
      sectionSettings
        .backgroundColor,

      "var(--storefront-surface)"
    );

  const textColor =
    getString(
      sectionSettings
        .textColor,

      "var(--storefront-text)"
    );

  const borderColor =
    getString(
      sectionSettings
        .borderColor,

      "var(--storefront-border)"
    );

  const searchBackgroundColor =
    getString(
      sectionSettings
        .searchBackgroundColor,

      "#F3F4F6"
    );

  const searchButtonColor =
    getString(
      sectionSettings
        .searchButtonColor,

      "var(--storefront-primary)"
    );

  /*
  |--------------------------------------------------------------------------
  | Content
  |--------------------------------------------------------------------------
  */

  const displayName =
    companySettings
      .displayName ||
    storefront.company.name;

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

      "Categories"
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

  /*
  |--------------------------------------------------------------------------
  | URLs
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | Search Submit
  |--------------------------------------------------------------------------
  */

  const handleSearch = (
    event:
      FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
  
    const value =
      searchText.trim();
  
    if (!value) {
      return;
    }
  
    setQuickSearchOpen(
      false
    );
  
    /*
    |--------------------------------------------------------------------------
    | Track Search
    |--------------------------------------------------------------------------
    */
  
    void trackStorefrontActivity({
      activityType:
        "SEARCH",
  
      searchQuery:
        value,
  
      source:
        "HEADER_SEARCH",
  
      metadata: {
        resultsShown:
          quickResults.length,
      },
    });
  
    /*
    |--------------------------------------------------------------------------
    | Open Search Results
    |--------------------------------------------------------------------------
    */
  
    router.push(
      `/search?q=${encodeURIComponent(
        value
      )}`
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Header CSS Variables
  |--------------------------------------------------------------------------
  */

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

    color:
      textColor,

    borderColor,
  } as CSSProperties;

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <header
        className={[
          "z-50 w-full border-b bg-white",

          sticky
            ? "sticky top-0"
            : "",
        ].join(
          " "
        )}
        style={
          headerStyle
        }
      >
        <div className="mx-auto flex min-h-[var(--header-mobile-height)] max-w-[var(--header-max-width)] items-center gap-3 px-4 sm:px-6 lg:min-h-[var(--header-desktop-height)] lg:gap-6 lg:px-8">

          {/* Mobile Menu */}

          <button
            type="button"
            aria-label="Open all departments menu"
            aria-controls="storefront-all-menu"
            aria-expanded={
              isAllMenuOpen
            }
            onClick={() =>
              setIsAllMenuOpen(
                true
              )
            }
            className="flex size-10 shrink-0 items-center justify-center rounded-storefront-button transition hover:bg-storefront-secondary lg:hidden"
          >
            <Menu
              size={
                22
              }
            />
          </button>

          {/* Logo */}

          {showLogo ? (
            <Link
              href="/"
              className="flex shrink-0 items-center"
              aria-label={`${displayName} home`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  MYSHOPS_LOGO_URL
                }
                alt={
                  displayName
                }
                className="h-auto max-h-[54px] object-contain object-left"
                style={{
                  width:
                    "var(--header-logo-width)",

                  maxWidth:
                    "var(--header-logo-width)",
                }}
              />
            </Link>
          ) : null}

          {/* Desktop Search + Quick View */}

          {showSearch ? (
            <div
              ref={
                searchContainerRef
              }
              className="relative hidden min-w-0 flex-1 lg:block"
            >
              <form
                onSubmit={
                  handleSearch
                }
              >
                <div
                    className="flex h-10 overflow-hidden rounded-xl border shadow-sm"
                    style={{
                      backgroundColor:
                        searchBackgroundColor,

                      borderColor,
                    }}
                  >
                  {/* Category Selector */}

                  {showCategorySelector ? (
                    <button
                      type="button"
                      aria-label="Open all departments menu"
                      aria-controls="storefront-all-menu"
                      aria-expanded={
                        isAllMenuOpen
                      }
                      onClick={() =>
                        setIsAllMenuOpen(
                          true
                        )
                      }
                      className="flex min-w-28 shrink-0 items-center justify-center gap-2 border-r px-3 text-sm font-bold transition hover:bg-black/5"
                      style={{
                        borderColor,
                      }}
                    >
                      <Menu
                        size={
                          17
                        }
                      />

                      <span>
                        {
                          categorySelectorLabel
                        }
                      </span>
                    </button>
                  ) : null}

                  {/* Search Input */}

                  <div className="relative min-w-0 flex-1">
                    <Search
                      size={
                        18
                      }
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
                    />

                    <input
                      type="search"
                      value={
                        searchText
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchText(
                          event.target
                            .value
                        )
                      }
                      onFocus={() => {
                        if (
                          searchText
                            .trim()
                            .length >=
                          2
                        ) {
                          setQuickSearchOpen(
                            true
                          );
                        }
                      }}
                      placeholder={
                        searchPlaceholder
                      }
                      aria-label="Search products"
                      autoComplete="off"
                      className="h-full w-full border-0 bg-transparent pl-11 pr-4 text-sm text-storefront-text outline-none placeholder:text-storefront-muted"
                    />
                  </div>

                  {/* Search Button */}

                  <button
                    type="submit"
                    aria-label="Submit search"
                    className="flex w-12 shrink-0 items-center justify-center text-white transition hover:brightness-95"
                    style={{
                      backgroundColor:
                        searchButtonColor,

                      color:
                        "#ffffff",

                      WebkitTextFillColor:
                        "#ffffff",
                    }}
                  >
                    <Search
                      size={
                        18
                      }
                    />
                  </button>
                </div>
              </form>

              {/* Quick Search Dropdown */}

              {quickSearchOpen &&
              searchText
                .trim()
                .length >=
                2 ? (
                <div className="absolute left-0 right-0 top-full z-[100] mt-2 overflow-hidden rounded-xl border border-[#D1D5DB] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.18)]">

                  {/* Loading */}

                  {quickSearchLoading ? (
                    <div className="px-5 py-8 text-center">
                      <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-storefront-primary border-t-transparent" />

                      <p className="mt-3 text-sm font-medium text-storefront-muted">
                        Searching products…
                      </p>
                    </div>
                  ) : quickResults.length >
                    0 ? (
                    <>
                      {/* Results */}

                      {quickResults.map(
                        (
                          product
                        ) => {
                          const imageUrl =
                            getQuickSearchImage(
                              product
                            );

                          const currencyCode =
                            product.price
                              ?.currencyCode ||
                            "AED";

                          const sellingPrice =
                            quickSearchMoney(
                              product.price
                                ?.sellingPrice,

                              currencyCode
                            );

                          const compareAtPrice =
                            quickSearchMoney(
                              product.price
                                ?.compareAtPrice,

                              currencyCode
                            );

                          const hasDiscount =
                            product.price
                              ?.compareAtPrice !=
                              null &&
                            product.price
                              ?.sellingPrice !=
                              null &&
                            Number(
                              product.price
                                .compareAtPrice
                            ) >
                              Number(
                                product.price
                                  .sellingPrice
                              );

                          const productUrl =
                            product.productUrl ||
                            `/products/${product.slug}`;

                          return (
                            <Link
                              key={
                                product.id
                              }
                              href={
                                productUrl
                              }
                              onClick={() =>
                                setQuickSearchOpen(
                                  false
                                )
                              }
                              className="grid grid-cols-[minmax(0,1fr)_96px] items-center gap-5 border-b border-[#ECEFF2] px-5 py-3.5 transition last:border-b-0 hover:bg-[#F7F8F9]"
                            >
                              {/* LEFT SIDE */}

                              <div className="min-w-0">
                                {product.brand
                                  ?.name ? (
                                  <p className="mb-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-storefront-muted">
                                    {
                                      product.brand
                                        .name
                                    }
                                  </p>
                                ) : null}

                                <p className="line-clamp-2 text-[13px] font-bold leading-[18px] text-storefront-text">
                                  {
                                    product.name
                                  }
                                </p>

                                {product
                                  .defaultVariant
                                  ?.sku ? (
                                  <p className="mt-1 truncate text-[10px] text-storefront-muted">
                                    SKU:{" "}
                                    {
                                      product
                                        .defaultVariant
                                        .sku
                                    }
                                  </p>
                                ) : null}

                                {sellingPrice ? (
                                  <div className="mt-2 flex flex-wrap items-baseline gap-2">
                                    <span className="text-sm font-black text-storefront-text">
                                      {
                                        sellingPrice
                                      }
                                    </span>

                                    {hasDiscount &&
                                    compareAtPrice ? (
                                      <span className="text-[10px] text-storefront-muted line-through">
                                        {
                                          compareAtPrice
                                        }
                                      </span>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>

                              {/* RIGHT SIDE IMAGE */}

                              <div className="flex h-[82px] w-[96px] items-center justify-center overflow-hidden rounded-lg border border-[#ECEFF2] bg-white">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      product.name
                                    }
                                    loading="lazy"
                                    className="h-full w-full object-contain p-1.5"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={
                                      26
                                    }
                                    strokeWidth={
                                      1.5
                                    }
                                    className="text-storefront-muted"
                                  />
                                )}
                              </div>
                            </Link>
                          );
                        }
                      )}

                      {/* View All */}

                      <Link
                        href={`/search?q=${encodeURIComponent(
                          searchText.trim()
                        )}`}
                        onClick={() =>
                          setQuickSearchOpen(
                            false
                          )
                        }
                        className="flex h-12 items-center justify-center border-t border-[#ECEFF2] bg-[#FAFAFA] px-5 text-sm font-black text-storefront-primary transition hover:bg-[#F3F4F6]"
                      >
                        View all results for&nbsp;
                        <span>
                          &quot;
                          {
                            searchText.trim()
                          }
                          &quot;
                        </span>
                      </Link>
                    </>
                  ) : (
                    /* No Results */

                    <div className="px-5 py-8 text-center">
                      <Search
                        size={
                          24
                        }
                        className="mx-auto text-storefront-muted"
                      />

                      <p className="mt-3 text-sm font-bold text-storefront-text">
                        No products found
                      </p>

                      <p className="mt-1 text-xs text-storefront-muted">
                        Try another product name,
                        model, SKU or brand.
                      </p>

                      <Link
                        href={`/search?q=${encodeURIComponent(
                          searchText.trim()
                        )}`}
                        onClick={() =>
                          setQuickSearchOpen(
                            false
                          )
                        }
                        className="mt-4 inline-flex text-xs font-black text-storefront-primary"
                      >
                        Search all products
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Header Actions */}

          <nav className="ml-auto flex items-center gap-0.5 sm:gap-1">

            {/* Login */}

            {showLogin ? (
              <HeaderAction
                href={
                  resolvedAccountUrl
                }
                label={
                  resolvedLoginLabel
                }
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
                  size={
                    21
                  }
                />
              </HeaderAction>
            ) : null}

            {/* Orders */}

            {showOrders ? (
              <HeaderAction
                href={
                  ordersUrl
                }
                label={
                  ordersLabel
                }
                ariaLabel="Orders"
                showLabel={
                  showActionLabels
                }
                hiddenOnSmall
              >
                <Package
                  size={
                    21
                  }
                />
              </HeaderAction>
            ) : null}

            {/* Track Order */}

<HeaderAction
  href="/track-order"
  label="Track Order"
  ariaLabel="Track Order"
  showLabel={
    showActionLabels
  }
  hiddenOnSmall
>
  <Truck
    size={
      21
    }
  />
</HeaderAction>

            {/* Notifications */}

            {customerAuthenticated ? (
              <CustomerNotificationBell />
            ) : null}

            {/* Wishlist */}

            {showWishlist ? (
              <HeaderAction
                href={
                  wishlistUrl
                }
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
                  <Heart
                    size={
                      21
                    }
                  />

                  {wishlistItemCount >
                  0 ? (
                    <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-storefront-primary px-1 text-[9px] font-bold leading-none text-white">
                      {wishlistItemCount >
                      99
                        ? "99+"
                        : wishlistItemCount}
                    </span>
                  ) : null}
                </span>
              </HeaderAction>
            ) : null}

            {/* Cart */}

            {showCart ? (
              <Link
                href={
                  cartUrl
                }
                aria-label="Shopping cart"
                className="relative flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-storefront-text transition-colors hover:bg-storefront-secondary hover:text-storefront-primary"
              >
                <span className="relative">
                  <ShoppingCart
                    size={
                      22
                    }
                  />

                  {cartItemCount >
                  0 ? (
                    <span className="absolute -right-2 -top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-storefront-primary px-1 text-[9px] font-bold leading-none text-white">
                      {cartItemCount >
                      99
                        ? "99+"
                        : cartItemCount}
                    </span>
                  ) : null}
                </span>

                {showActionLabels ? (
                  <span className="hidden text-xs font-semibold xl:inline">
                    {
                      cartLabel
                    }
                  </span>
                ) : null}
              </Link>
            ) : null}
          </nav>
        </div>

        {/* Mobile Search */}

        {showSearch &&
        showMobileSearch ? (
          <form
            onSubmit={
              handleSearch
            }
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
                  size={
                    17
                  }
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
                />

                <input
                  type="search"
                  value={
                    searchText
                  }
                  onChange={(
                    event
                  ) =>
                    setSearchText(
                      event.target
                        .value
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

                  color:
                    "#ffffff",

                  WebkitTextFillColor:
                    "#ffffff",
                }}
              >
                <Search
                  size={
                    18
                  }
                />
              </button>
            </div>
          </form>
        ) : null}
      </header>

      {/* Navigation Drawer */}

      <NavigationDrawer
        open={
          isAllMenuOpen
        }
        onClose={() =>
          setIsAllMenuOpen(
            false
          )
        }
        accountUrl={
          resolvedAccountUrl
        }
        accountLabel={
          resolvedLoginLabel
        }
      />
    </>
  );
}