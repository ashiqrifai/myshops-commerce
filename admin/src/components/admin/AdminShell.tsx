"use client";

import Link from "next/link";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  FolderTree,
  Home,
  Images,
  LogOut,
  Menu,
  MonitorCog,
  Package,
  PanelTop,
  Search,
  Settings,
  ShoppingBag,
  Store,
  Users,
  Badge,
  Shapes,
  DollarSign,
  BadgeDollarSign,
  Grid3X3,
  FolderKanban,
  FileUp
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import { toast } from "sonner";

import {
  useLogoutMutation,
} from "@/store/api/authApi";

import {
  clearCredentials,
} from "@/store/slices/authSlice";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

interface AdminShellProps {
  children: React.ReactNode;
}

interface NavigationChild {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: NavigationChild[];
}

const navigation: NavigationItem[] = [
  {
    name: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingBag,
  },
  {
    name: "Catalog",
    icon: Package,
    children: [
      {
        name: "Products",
        href: "/admin/products",
        icon: Package,
      },
      {
        name: "Product Import",
        href: "/admin/products/import",
        icon: FileUp,
      },
      {
        name: "Categories",
        href: "/admin/categories",
        icon: FolderTree,
      },
      {
        name: "Brands",
        href: "/admin/brands",
        icon: Badge,
      },
      {
        name: "Attributes",
        href: "/admin/attributes",
        icon: Shapes,
      },
      {
        name: "Collections",
        href: "/admin/collections",
        icon: FolderKanban,
      },
    ],
  },
  {
    name: "Pricing",
    icon: DollarSign,
    children: [
      {
        name: "Price Lists",
        href: "/admin/price-lists",
        icon: DollarSign,
      },
  
      {
        name: "Variant Pricing",
        href: "/admin/variant-prices",
        icon: BadgeDollarSign,
      },
  
      {
        name: "Pricing Center",
        href: "/admin/pricing-center",
        icon: Grid3X3,
      },
    ],
  },
  {
    name: "Media",
    href: "/media",
    icon: Images,
  },
  {
    name: "Content",
    icon: PanelTop,
    children: [
      {
        name: "Pages",
        href: "/cms/pages",
        icon: FileText,
      },
      {
        name: "Navigation",
        href: "/admin/cms/navigation",
        icon: Menu,
      },
    ],
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
  },
  {
    name: "Kiosk",
    href: "/kiosk",
    icon: MonitorCog,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function AdminShell({
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const dispatch = useAppDispatch();

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const contentRouteActive =
  pathname.startsWith("/cms/pages") ||
  pathname.startsWith("/cms/navigation");

const catalogRouteActive =
  pathname.startsWith("/admin/products") ||
  pathname.startsWith("/admin/categories") ||
  pathname.startsWith("/admin/brands") ||
  pathname.startsWith("/admin/attributes");

const pricingRouteActive =
  pathname.startsWith("/admin/price-lists");
  const [
    expandedSections,
    setExpandedSections,
  ] = useState<Record<string, boolean>>({
    Catalog: catalogRouteActive,
    Pricing: pricingRouteActive,
    Content: contentRouteActive,
  });

  useEffect(() => {
    setExpandedSections((current) => ({
      ...current,
      Catalog:
        current.Catalog || catalogRouteActive,
      Pricing:
        current.Pricing || pricingRouteActive,
      Content:
        current.Content || contentRouteActive,
    }));
  }, [
    catalogRouteActive,
    pricingRouteActive,
    contentRouteActive,
  ]);

  const [
    logout,
    {
      isLoading,
    },
  ] = useLogoutMutation();

  const toggleSection = (
    sectionName: string
  ) => {
    setExpandedSections(
      (current) => ({
        ...current,
        [sectionName]:
          !current[sectionName],
      })
    );
  };

  const handleLogout =
    async () => {
      try {
        await logout().unwrap();
      } catch {
        // Clear the local session even
        // when the server logout fails.
      }

      localStorage.removeItem(
        "myshops.admin.accessToken"
      );

      localStorage.removeItem(
        "myshops.admin.user"
      );

      dispatch(
        clearCredentials()
      );

      toast.success(
        "Logged out successfully."
      );

      router.replace(
        "/login"
      );
    };

  return (
    <div className="min-h-screen bg-[#f6f6f7]">
      <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-[#dfe3e8] bg-[#1a1a1a] px-4 text-white">
        <div className="flex w-[230px] items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#1a1a1a]">
            <Store
              size={18}
            />
          </div>

          <div>
            <p className="text-sm font-semibold leading-tight">
              MyShops
            </p>

            <p className="text-[11px] text-white/60">
              Commerce Admin
            </p>
          </div>
        </div>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <div className="flex h-9 items-center gap-2 rounded-lg bg-white/10 px-3 text-sm text-white/70">
            <Search
              size={16}
            />

            <span>
              Search admin
            </span>
          </div>
        </div>

        <button
          type="button"
          className="ml-auto flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/10"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#b4fed2] text-sm font-semibold text-[#163b25]">
            {user?.firstName?.charAt(
              0
            ) || "M"}
          </div>

          <div className="hidden text-left lg:block">
            <p className="text-xs font-medium">
              {user?.fullName ||
                "Administrator"}
            </p>

            <p className="text-[10px] text-white/60">
              {user?.company?.name ||
                "MyShops"}
            </p>
          </div>

          <ChevronDown
            size={14}
            className="hidden lg:block"
          />
        </button>
      </header>

      <aside className="fixed bottom-0 left-0 top-14 z-30 hidden w-[230px] border-r border-[#dfe3e8] bg-[#ebebeb] px-3 py-4 lg:block">
        <nav className="space-y-1">
          {navigation.map(
            (item) => {
              const Icon =
                item.icon;

              if (
                item.children &&
                item.children.length >
                  0
              ) {
                const isExpanded =
                  expandedSections[
                    item.name
                  ] ?? false;

                const hasActiveChild =
                  item.children.some(
                    (child) =>
                      pathname ===
                        child.href ||
                      pathname.startsWith(
                        `${child.href}/`
                      )
                  );

                return (
                  <div
                    key={
                      item.name
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSection(
                          item.name
                        )
                      }
                      className={[
                        "flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                        hasActiveChild
                          ? "bg-[#d4d4d4] text-[#202223]"
                          : "text-[#4d5156] hover:bg-[#dedede]",
                      ].join(
                        " "
                      )}
                    >
                      <Icon
                        size={18}
                      />

                      <span className="flex-1 text-left">
                        {
                          item.name
                        }
                      </span>

                      {isExpanded ? (
                        <ChevronDown
                          size={15}
                        />
                      ) : (
                        <ChevronRight
                          size={15}
                        />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-[#c9cccf] pl-3">
                        {item.children.map(
                          (
                            child
                          ) => {
                            const ChildIcon =
                              child.icon;

                            const childActive =
                              pathname ===
                                child.href ||
                              pathname.startsWith(
                                `${child.href}/`
                              );

                            return (
                              <Link
                                key={
                                  child.href
                                }
                                href={
                                  child.href
                                }
                                className={[
                                  "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                                  childActive
                                    ? "bg-white text-[#202223] shadow-sm"
                                    : "text-[#5c5f62] hover:bg-[#dedede]",
                                ].join(
                                  " "
                                )}
                              >
                                <ChildIcon
                                  size={
                                    16
                                  }
                                />

                                <span>
                                  {
                                    child.name
                                  }
                                </span>
                              </Link>
                            );
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (!item.href) {
                return null;
              }

              const active =
                pathname ===
                  item.href ||
                pathname.startsWith(
                  `${item.href}/`
                );

              return (
                <Link
                  key={`${item.href}-${item.name}`}
                  href={
                    item.href
                  }
                  className={[
                    "flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                    active
                      ? "bg-[#d4d4d4] text-[#202223]"
                      : "text-[#4d5156] hover:bg-[#dedede]",
                  ].join(
                    " "
                  )}
                >
                  <Icon
                    size={18}
                  />

                  <span>
                    {item.name}
                  </span>
                </Link>
              );
            }
          )}
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={
              handleLogout
            }
            className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#4d5156] hover:bg-[#dedede] disabled:opacity-50"
          >
            <LogOut
              size={18}
            />

            <span>
              {isLoading
                ? "Logging out..."
                : "Log out"}
            </span>
          </button>
        </div>
      </aside>

      <main className="min-h-screen pt-14 lg:pl-[230px]">
        {children}
      </main>
    </div>
  );
}