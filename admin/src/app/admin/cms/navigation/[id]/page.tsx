"use client";

import Link from "next/link";

import {
  useParams,
} from "next/navigation";

import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info,
  LoaderCircle,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import NavigationBuilder from "@/components/admin/navigation/NavigationBuilder";

import {
  useGetNavigationMenuByIdQuery,
} from "@/store/api/navigationApi";

export default function NavigationBuilderPage() {
  const params =
    useParams<{
      id: string;
    }>();

  const menuId =
    params.id;

  const [
    isDetailsOpen,
    setIsDetailsOpen,
  ] = useState(
    false
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } =
    useGetNavigationMenuByIdQuery(
      menuId,
      {
        skip:
          !menuId,
      }
    );

  const menu =
    data?.data;

  /*
   * Prevent the page behind the drawer
   * from scrolling while it is open.
   */
  useEffect(() => {
    if (
      !isDetailsOpen
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style
      .overflow =
      "hidden";

    return () => {
      document.body.style
        .overflow =
        previousOverflow;
    };
  }, [
    isDetailsOpen,
  ]);

  /*
   * Allow Escape to close the drawer.
   */
  useEffect(() => {
    if (
      !isDetailsOpen
    ) {
      return;
    }

    const handleKeyDown = (
      event:
        KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setIsDetailsOpen(
          false
        );
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    isDetailsOpen,
  ]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin"
          />

          <p className="mt-3 text-sm text-[#6d7175]">
            Loading navigation
            builder...
          </p>
        </div>
      </main>
    );
  }

  if (
    isError ||
    !menu
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
        <div className="w-full max-w-md rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold">
            Navigation menu not
            found
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#6d7175]">
            The requested
            navigation menu may
            have been removed, or
            you may not have access
            to it.
          </p>

          <Link
            href="/admin/cms/navigation"
            className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
          >
            Return to navigation
          </Link>
        </div>
      </main>
    );
  }

  const previewChannel =
    menu.channel ===
    "BOTH"
      ? "WEBSITE"
      : menu.channel;

  const publicApiUrl =
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5080/api/v1";

  const previewUrl =
    `${publicApiUrl}/public/navigation/${menu.code}` +
    `?companyCode=MYSHOPS&channel=${previewChannel}`;

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1800px] px-5 py-6 md:px-8">
        <header>
          <Link
            href="/admin/cms/navigation"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] transition hover:text-[#303030]"
          >
            <ArrowLeft
              size={16}
            />

            Navigation menus
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#6d7175]">
            <span>
              CMS
            </span>

            <ChevronRight
              size={14}
            />

            <span>
              Navigation
            </span>

            <ChevronRight
              size={14}
            />

            <span className="font-medium text-[#303030]">
              {menu.name}
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight">
                {menu.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                  {menu.channel}
                </span>

                <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                  {menu.menuType}
                </span>

                <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 font-mono text-xs text-[#005bd3]">
                  {menu.code}
                </span>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-medium",

                    menu.isActive
                      ? "bg-[#e3f1df] text-[#1f6f1f]"
                      : "bg-[#fbeae5] text-[#a23b2a]",
                  ].join(
                    " "
                  )}
                >
                  {menu.isActive
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              {menu.description && (
                <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d7175]">
                  {
                    menu.description
                  }
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setIsDetailsOpen(
                    true
                  )
                }
                className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium transition hover:bg-[#fafafa]"
              >
                <Info
                  size={15}
                />

                Menu details
              </button>

              <button
                type="button"
                onClick={() =>
                  refetch()
                }
                disabled={
                  isFetching
                }
                className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFetching ? (
                  <LoaderCircle
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <RefreshCw
                    size={15}
                  />
                )}

                Refresh
              </button>

              <Link
                href={`/admin/cms/navigation/${menu.id}/edit`}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium transition hover:bg-[#fafafa]"
              >
                <Pencil
                  size={15}
                />

                Edit settings
              </Link>

              <a
                href={
                  previewUrl
                }
                target="_blank"
                rel="noreferrer"
                className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white transition hover:bg-[#1f1f1f]"
              >
                <ExternalLink
                  size={15}
                />

                Preview JSON
              </a>
            </div>
          </div>
        </header>

        <div className="mt-6">
          <NavigationBuilder
            menu={
              menu
            }
          />
        </div>
      </div>

      <MenuDetailsDrawer
        isOpen={
          isDetailsOpen
        }
        onClose={() =>
          setIsDetailsOpen(
            false
          )
        }
        menuName={
          menu.name
        }
        menuId={
          menu.id
        }
        topLevelItemCount={
          menu.items?.length ||
          0
        }
        maximumColumns={
          Number(
            menu.settings
              ?.maxColumns ||
              4
          )
        }
        desktopEnabled={
          menu.settings
            ?.desktopEnabled !==
          false
        }
        mobileEnabled={
          menu.settings
            ?.mobileEnabled !==
          false
        }
        channel={
          menu.channel
        }
        menuType={
          menu.menuType
        }
        menuCode={
          menu.code
        }
        isActive={
          menu.isActive
        }
      />
    </main>
  );
}

interface MenuDetailsDrawerProps {
  isOpen: boolean;

  onClose: () => void;

  menuName: string;

  menuId: string;

  topLevelItemCount:
    number;

  maximumColumns:
    number;

  desktopEnabled:
    boolean;

  mobileEnabled:
    boolean;

  channel: string;

  menuType: string;

  menuCode: string;

  isActive: boolean;
}

function MenuDetailsDrawer({
  isOpen,
  onClose,
  menuName,
  menuId,
  topLevelItemCount,
  maximumColumns,
  desktopEnabled,
  mobileEnabled,
  channel,
  menuType,
  menuCode,
  isActive,
}: MenuDetailsDrawerProps) {
  return (
    <div
      className={[
        "fixed inset-0 z-50 transition",

        isOpen
          ? "pointer-events-auto"
          : "pointer-events-none",
      ].join(
        " "
      )}
      aria-hidden={
        !isOpen
      }
    >
      <button
        type="button"
        onClick={
          onClose
        }
        className={[
          "absolute inset-0 bg-black/30 transition-opacity duration-200",

          isOpen
            ? "opacity-100"
            : "opacity-0",
        ].join(
          " "
        )}
        aria-label="Close menu details"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu details"
        className={[
          "absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",

          isOpen
            ? "translate-x-0"
            : "translate-x-full",
        ].join(
          " "
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#e1e3e5] px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8c9196]">
              Navigation menu
            </p>

            <h2 className="mt-1 truncate text-lg font-semibold">
              {menuName}
            </h2>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dfe3e8] bg-white transition hover:bg-[#f1f2f3]"
            aria-label="Close menu details"
          >
            <X
              size={17}
            />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f6f7] p-5">
          <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold">
                Menu summary
              </h3>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[11px] font-medium",

                  isActive
                    ? "bg-[#e3f1df] text-[#1f6f1f]"
                    : "bg-[#fbeae5] text-[#a23b2a]",
                ].join(
                  " "
                )}
              >
                {isActive
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>

            <dl className="mt-5 space-y-4 text-sm">
              <SummaryRow
                label="Top-level items"
                value={String(
                  topLevelItemCount
                )}
              />

              <SummaryRow
                label="Maximum columns"
                value={String(
                  maximumColumns
                )}
              />

              <SummaryRow
                label="Desktop enabled"
                value={
                  desktopEnabled
                    ? "Yes"
                    : "No"
                }
              />

              <SummaryRow
                label="Mobile enabled"
                value={
                  mobileEnabled
                    ? "Yes"
                    : "No"
                }
              />

              <SummaryRow
                label="Channel"
                value={
                  channel
                }
              />

              <SummaryRow
                label="Menu type"
                value={
                  menuType
                }
              />
            </dl>
          </section>

          <section className="mt-4 rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold">
              CMS usage
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#6d7175]">
              CMS navigation
              sections can reference
              this menu using its ID
              or menu code.
            </p>

            <div className="mt-4 space-y-3">
              <DetailCodeBlock
                label="Menu code"
                value={
                  menuCode
                }
              />

              <DetailCodeBlock
                label="Menu ID"
                value={
                  menuId
                }
              />
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-[#dfe3e8] bg-[#eef4ff] p-5">
            <h3 className="text-sm font-semibold text-[#003a8c]">
              Builder workspace
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#365c8d]">
              The summary panel is
              now stored here so the
              navigation tree,
              designer and live
              preview can use the
              full page width.
            </p>
          </section>
        </div>
      </aside>
    </div>
  );
}

interface DetailCodeBlockProps {
  label: string;
  value: string;
}

function DetailCodeBlock({
  label,
  value,
}: DetailCodeBlockProps) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-3">
      <p className="text-xs text-[#6d7175]">
        {label}
      </p>

      <p className="mt-1 break-all font-mono text-xs leading-5 text-[#303030]">
        {value}
      </p>
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({
  label,
  value,
}: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#f1f2f3] pb-3 last:border-b-0 last:pb-0">
      <dt className="text-[#6d7175]">
        {label}
      </dt>

      <dd className="text-right font-medium">
        {value}
      </dd>
    </div>
  );
}