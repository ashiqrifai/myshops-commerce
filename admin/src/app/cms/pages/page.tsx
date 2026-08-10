"use client";

import { useEffect, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  FilePlus2,
  Globe2,
  Layers3,
  LayoutTemplate,
  LoaderCircle,
  MoreHorizontal,
  MonitorSmartphone,
  Power,
  Search,
  Send,
  Undo2,
} from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";
import CmsPageStatusBadge from "@/components/cms/CmsPageStatusBadge";

import {
  useChangeCmsPageActiveMutation,
  useChangeCmsPageStatusMutation,
  useDuplicateCmsPageMutation,
  useGetCmsPagesQuery,
} from "@/store/api/cmsPagesApi";

import { useAppSelector } from "@/store/hooks";

import type {
  CmsPageChannel,
  CmsPageStatus,
  CmsPageType,
} from "@/types/cms";

const pageTypeLabels: Record<CmsPageType, string> = {
  HOME: "Home",
  CATEGORY: "Category",
  BRAND: "Brand",
  PRODUCT: "Product",
  SEARCH: "Search",
  CART: "Cart",
  CHECKOUT: "Checkout",
  OFFERS: "Offers",
  LANDING: "Landing Page",
  CUSTOM: "Custom",
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
) => {
  const apiError = error as {
    data?: {
      error?: {
        message?: string;
        details?: Array<{
          message?: string;
        }>;
      };
    };
  };

  return (
    apiError.data?.error?.details?.[0]?.message ||
    apiError.data?.error?.message ||
    fallbackMessage
  );
};

export default function CmsPagesPage() {
  const router = useRouter();

  const { accessToken, initialized } = useAppSelector(
    (state) => state.auth
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [channel, setChannel] =
    useState<CmsPageChannel | "">("");

  const [status, setStatus] =
    useState<CmsPageStatus | "">("");

  const [pageType, setPageType] =
    useState<CmsPageType | "">("");

  const [activeFilter, setActiveFilter] =
    useState<boolean | "">("");

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    if (initialized && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, initialized, router]);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetCmsPagesQuery(
    {
      page,
      pageSize,
      search: debouncedSearch || undefined,
      channel: channel || undefined,
      status: status || undefined,
      pageType: pageType || undefined,
      isActive:
        activeFilter === ""
          ? undefined
          : activeFilter,
      sortBy: "updatedAt",
      sortDirection: "DESC",
    },
    {
      skip: !accessToken,
    }
  );

  const [
    changeStatus,
    { isLoading: isChangingStatus },
  ] = useChangeCmsPageStatusMutation();

  const [
    changeActive,
    { isLoading: isChangingActive },
  ] = useChangeCmsPageActiveMutation();

  const [
    duplicatePage,
    { isLoading: isDuplicating },
  ] = useDuplicateCmsPageMutation();

  const actionLoading =
    isChangingStatus ||
    isChangingActive ||
    isDuplicating;

  const handleStatusChange = async (
    id: string,
    newStatus: CmsPageStatus
  ) => {
    try {
      const response = await changeStatus({
        id,
        status: newStatus,
      }).unwrap();

      toast.success(
        response.message ||
          "Page status updated successfully."
      );

      setOpenMenuId(null);
    } catch (statusError: unknown) {
      toast.error(
        getApiErrorMessage(
          statusError,
          "Unable to update page status."
        )
      );
    }
  };

  const handleActiveChange = async (
    id: string,
    isActive: boolean
  ) => {
    try {
      const response = await changeActive({
        id,
        isActive,
      }).unwrap();

      toast.success(
        response.message ||
          "Page availability updated successfully."
      );

      setOpenMenuId(null);
    } catch (activeError: unknown) {
      toast.error(
        getApiErrorMessage(
          activeError,
          "Unable to update the page."
        )
      );
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response =
        await duplicatePage(id).unwrap();

      toast.success(
        response.message ||
          "Page duplicated successfully."
      );

      setOpenMenuId(null);
    } catch (duplicateError: unknown) {
      toast.error(
        getApiErrorMessage(
          duplicateError,
          "Unable to duplicate page."
        )
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setChannel("");
    setStatus("");
    setPageType("");
    setActiveFilter("");
    setPage(1);
  };

  const hasFilters = Boolean(
    search ||
      channel ||
      status ||
      pageType ||
      activeFilter !== ""
  );

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1350px] px-5 py-7 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-[#6d7175]">
              Content management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Pages
            </h1>

            <p className="mt-1 text-sm text-[#6d7175]">
              Manage pages for the Next.js website
              and Android Jetpack Compose kiosk.
            </p>
          </div>

          <Link
            href="/cms/pages/new"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
          >
            <FilePlus2 size={17} />
            Create page
          </Link>
        </div>

        <section className="admin-card mb-5 p-4">
          <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_180px_180px_180px_160px_auto]">
            <div className="relative">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="admin-input pl-10"
                placeholder="Search pages"
              />
            </div>

            <select
              value={channel}
              onChange={(event) => {
                setChannel(
                  event.target
                    .value as CmsPageChannel | ""
                );

                setPage(1);
              }}
              className="admin-input"
            >
              <option value="">
                All channels
              </option>

              <option value="WEBSITE">
                Website
              </option>

              <option value="KIOSK">
                Android Kiosk
              </option>

              <option value="BOTH">
                Website & Kiosk
              </option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target
                    .value as CmsPageStatus | ""
                );

                setPage(1);
              }}
              className="admin-input"
            >
              <option value="">
                All statuses
              </option>

              <option value="DRAFT">
                Draft
              </option>

              <option value="PUBLISHED">
                Published
              </option>

              <option value="UNPUBLISHED">
                Unpublished
              </option>

              <option value="ARCHIVED">
                Archived
              </option>
            </select>

            <select
              value={pageType}
              onChange={(event) => {
                setPageType(
                  event.target
                    .value as CmsPageType | ""
                );

                setPage(1);
              }}
              className="admin-input"
            >
              <option value="">
                All page types
              </option>

              {Object.entries(pageTypeLabels).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={
                activeFilter === ""
                  ? ""
                  : String(activeFilter)
              }
              onChange={(event) => {
                const value =
                  event.target.value;

                setActiveFilter(
                  value === ""
                    ? ""
                    : value === "true"
                );

                setPage(1);
              }}
              className="admin-input"
            >
              <option value="">
                All availability
              </option>

              <option value="true">
                Enabled
              </option>

              <option value="false">
                Disabled
              </option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="h-[42px] rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </section>

        {isLoading && (
          <div className="admin-card flex min-h-[400px] items-center justify-center">
            <div className="text-center">
              <LoaderCircle className="mx-auto animate-spin" />

              <p className="mt-3 text-sm text-[#6d7175]">
                Loading CMS pages...
              </p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="admin-card p-8 text-center">
            <p className="font-semibold text-red-700">
              Unable to load CMS pages.
            </p>

            <p className="mt-2 text-sm text-[#6d7175]">
              Check that the backend is running
              and your access token is valid.
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg bg-[#303030] px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading &&
          !error &&
          data?.data.length === 0 && (
            <div className="admin-card p-12 text-center">
              <LayoutTemplate
                size={36}
                className="mx-auto text-[#8c9196]"
              />

              <h2 className="mt-4 text-lg font-semibold">
                No pages found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-[#6d7175]">
                Create a new page or clear the
                current search and filters.
              </p>

              <Link
                href="/cms/pages/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#303030] px-4 py-2 text-sm font-semibold text-white"
              >
                <FilePlus2 size={16} />
                Create page
              </Link>
            </div>
          )}

        {!isLoading &&
          !error &&
          data &&
          data.data.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-[#6d7175]">
                  {data.pagination.totalItems}{" "}
                  page
                  {data.pagination.totalItems === 1
                    ? ""
                    : "s"}
                </p>

                {isFetching && (
                  <div className="flex items-center gap-2 text-xs text-[#6d7175]">
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />

                    Updating
                  </div>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.data.map((cmsPage) => {
                  const ChannelIcon =
                    cmsPage.channel === "KIOSK"
                      ? MonitorSmartphone
                      : Globe2;

                  return (
                    <article
                      key={cmsPage.id}
                      className={[
                        "admin-card relative overflow-visible p-5 transition hover:-translate-y-0.5 hover:shadow-md",
                        !cmsPage.isActive
                          ? "opacity-70"
                          : "",
                      ].join(" ")}
                    >
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f2f3]">
                            <ChannelIcon size={20} />
                          </div>

                          <div className="min-w-0">
                            <h2 className="truncate text-base font-semibold">
                              {cmsPage.name}
                            </h2>

                            <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                              {cmsPage.slug}
                            </p>
                          </div>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId ===
                                  cmsPage.id
                                  ? null
                                  : cmsPage.id
                              )
                            }
                            disabled={actionLoading}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
                            aria-label={`Actions for ${cmsPage.name}`}
                          >
                            <MoreHorizontal
                              size={18}
                            />
                          </button>

                          {openMenuId ===
                            cmsPage.id && (
                            <div className="absolute right-0 top-9 z-30 w-52 rounded-xl border border-[#e1e3e5] bg-white p-1.5 shadow-xl">
                              <Link
                                href={`/cms/pages/${cmsPage.id}/edit`}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f6f6f7]"
                              >
                                <Edit3 size={15} />
                                Edit page
                              </Link>

                              <Link
                                href={`/cms/pages/${cmsPage.id}/sections`}
                                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#f6f6f7]"
                              >
                                <Layers3 size={15} />
                                Manage sections
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDuplicate(
                                    cmsPage.id
                                  )
                                }
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
                              >
                                <Copy size={15} />
                                Duplicate
                              </button>

                              {cmsPage.status !==
                                "PUBLISHED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      cmsPage.id,
                                      "PUBLISHED"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
                                >
                                  <Send size={15} />
                                  Publish
                                </button>
                              )}

                              {cmsPage.status ===
                                "PUBLISHED" && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(
                                      cmsPage.id,
                                      "UNPUBLISHED"
                                    )
                                  }
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]"
                                >
                                  <Undo2 size={15} />
                                  Unpublish
                                </button>
                              )}

                              <div className="my-1 border-t border-[#e1e3e5]" />

                              <button
                                type="button"
                                onClick={() =>
                                  handleActiveChange(
                                    cmsPage.id,
                                    !cmsPage.isActive
                                  )
                                }
                                className={[
                                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#f6f6f7]",
                                  cmsPage.isActive
                                    ? "text-red-700"
                                    : "text-[#276749]",
                                ].join(" ")}
                              >
                                <Power size={15} />

                                {cmsPage.isActive
                                  ? "Disable"
                                  : "Enable"}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <CmsPageStatusBadge
                          status={cmsPage.status}
                        />

                        <CmsPageStatusBadge
                          channel={cmsPage.channel}
                        />

                        <CmsPageStatusBadge
                          isActive={
                            cmsPage.isActive
                          }
                        />

                        {cmsPage.isDefault && (
                          <span className="inline-flex items-center rounded-full bg-[#fff4d6] px-2.5 py-1 text-xs font-medium text-[#7a5a00]">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#e1e3e5] pt-4">
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                            Page type
                          </p>

                          <p className="mt-1 text-sm font-medium">
                            {
                              pageTypeLabels[
                                cmsPage.pageType
                              ]
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-[#8c9196]">
                            Code
                          </p>

                          <p className="mt-1 truncate font-mono text-xs font-medium">
                            {cmsPage.code}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-[#e1e3e5] pt-4">
                        <p className="text-xs text-[#6d7175]">
                          Updated{" "}
                          {formatDate(
                            cmsPage.updatedAt
                          )}
                        </p>

                        {cmsPage.updatedByUser && (
                          <p className="mt-1 text-xs text-[#6d7175]">
                            by{" "}
                            {
                              cmsPage
                                .updatedByUser
                                .firstName
                            }{" "}
                            {cmsPage.updatedByUser
                              .lastName || ""}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 border-t border-[#e1e3e5] pt-4">
                        <Link
                          href={`/cms/pages/${cmsPage.id}/sections`}
                          className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#f6f6f7]"
                        >
                          <Layers3 size={16} />
                          Manage sections
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-[#6d7175]">
                  Page {data.pagination.page} of{" "}
                  {Math.max(
                    data.pagination.totalPages,
                    1
                  )}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      page <= 1 || isFetching
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          current - 1,
                          1
                        )
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      page >=
                        data.pagination
                          .totalPages ||
                      isFetching
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                    className="flex h-9 items-center gap-1 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
      </div>
    </AdminShell>
  );
}