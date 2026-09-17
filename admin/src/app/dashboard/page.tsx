"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Link2,
  LoaderCircle,
  Package,
  RefreshCw,
  Search,
  Unlink,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  useGetZohoItemLinkStatusQuery,
  useSyncZohoItemsMutation,
} from "@/store/api/zohoIntegrationApi";

/*
|--------------------------------------------------------------------------
| Constants
|--------------------------------------------------------------------------
*/

const PAGE_SIZE =
  20;

  const formatDateTime =
  (
    value:
      string | null
  ) => {
    if (
      !value
    ) {
      return "Never";
    }

    const date =
      new Date(
        value
      );

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown";
    }

    return new Intl.DateTimeFormat(
      "en-AE",
      {
        day:
          "2-digit",

        month:
          "short",

        year:
          "numeric",

        hour:
          "2-digit",

        minute:
          "2-digit",
      }
    ).format(
      date
    );
  };


  const getZohoStatus =
  (
    status:
      string | null |
      undefined
  ) => {
    switch (
      status
    ) {
      case "SKU_NOT_FOUND_IN_ZOHO":
        return {
          label:
            "SKU Not Found in Zoho",

          className:
            "bg-amber-50 text-amber-700",
        };

      case "ZOHO_ITEM_MISSING_ID":
        return {
          label:
            "Zoho Item ID Missing",

          className:
            "bg-red-50 text-red-700",
        };

      case "NOT_CHECKED":
        return {
          label:
            "Not Checked",

          className:
            "bg-[#f1f2f3] text-[#6d7175]",
        };

      case "LINKED":
        return {
          label:
            "Linked",

          className:
            "bg-emerald-50 text-emerald-700",
        };

      default:
        return {
          label:
            "Not Linked",

          className:
            "bg-amber-50 text-amber-700",
        };
    }
  };
/*
|--------------------------------------------------------------------------
| Error Helper
|--------------------------------------------------------------------------
*/

const getErrorMessage =
  (
    error:
      unknown
  ) => {
    if (
      !error ||
      typeof error !==
        "object"
    ) {
      return "An unexpected error occurred.";
    }

    const apiError =
      error as {
        data?: {
          message?: string;

          error?: {
            message?: string;
          };
        };

        message?: string;
      };

    return (
      apiError.data
        ?.error
        ?.message ||
      apiError.data
        ?.message ||
      apiError.message ||
      "An unexpected error occurred."
    );
  };

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title:
    string;

  value:
    string | number;

  subtitle:
    string;

  icon:
    React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[#6d7175]">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-[#202223]">
            {value}
          </p>

          <p className="mt-2 text-xs leading-5 text-[#8c9196]">
            {subtitle}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f8f9] text-[#16828b]">
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

export default function DashboardPage() {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const [
    searchInput,
    setSearchInput,
  ] =
    useState(
      ""
    );

  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  /*
  |--------------------------------------------------------------------------
  | Debounced Search
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timeout =
        window.setTimeout(
          () => {
            setSearch(
              searchInput.trim()
            );

            setPage(
              1
            );
          },
          400
        );

      return () => {
        window.clearTimeout(
          timeout
        );
      };
    },
    [
      searchInput,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Status Query
  |--------------------------------------------------------------------------
  */

  const {
    data:
      statusResponse,

    isLoading:
      isLoadingStatus,

    isFetching:
      isFetchingStatus,

    error:
      statusError,

    refetch:
      refetchStatus,
  } =
    useGetZohoItemLinkStatusQuery({
      page,

      pageSize:
        PAGE_SIZE,

      search:
        search ||
        undefined,
    });

  /*
  |--------------------------------------------------------------------------
  | Sync Mutation
  |--------------------------------------------------------------------------
  */

  const [
    syncZohoItems,
    {
      isLoading:
        isSyncing,
    },
  ] =
    useSyncZohoItemsMutation();

  /*
  |--------------------------------------------------------------------------
  | Derived Data
  |--------------------------------------------------------------------------
  */

  const data =
    statusResponse
      ?.data;

  const summary =
    data
      ?.summary;

  const items =
    useMemo(
      () =>
        data?.items ||
        [],
      [
        data?.items,
      ]
    );

  const pagination =
    data
      ?.pagination;

  /*
  |--------------------------------------------------------------------------
  | Sync
  |--------------------------------------------------------------------------
  */

  const handleSync =
    async () => {
      try {
        const result =
          await syncZohoItems({
            companyCode:
              "MYSHOPS",

            dryRun:
              false,
          }).unwrap();

        const sync =
          result.data;

        if (
          sync.updated >
          0
        ) {
          toast.success(
            `Zoho sync completed. ${sync.updated} item${
              sync.updated ===
              1
                ? ""
                : "s"
            } linked or updated.`
          );
        } else {
          toast.success(
            "Zoho sync completed. All matching items are already linked."
          );
        }

        setPage(
          1
        );

        await refetchStatus();
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (
    isLoadingStatus &&
    !data
  ) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#16828b]"
          />

          <p className="mt-4 text-sm font-semibold text-[#202223]">
            Loading dashboard
          </p>

          <p className="mt-1 text-sm text-[#6d7175]">
            Checking Zoho item
            linkage status...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (
    statusError &&
    !data
  ) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={22}
            className="mt-0.5 shrink-0 text-red-700"
          />

          <div>
            <h1 className="text-base font-semibold text-red-900">
              Unable to load
              Zoho integration
              status
            </h1>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {getErrorMessage(
                statusError
              )}
            </p>

            <button
              type="button"
              onClick={() =>
                refetchStatus()
              }
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800"
            >
              <RefreshCw
                size={15}
              />

              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/*
      ----------------------------------------------------------------------
      Header
      ----------------------------------------------------------------------
      */}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf7f8] text-[#16828b]">
              <Cloud
                size={20}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#202223]">
                Dashboard
              </h1>

              <p className="mt-0.5 text-sm text-[#6d7175]">
                MyShops commerce
                integration overview
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={
            isSyncing
          }
          onClick={
            handleSync
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#16828b] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#126f77] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSyncing ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
          ) : (
            <RefreshCw
              size={16}
            />
          )}

          {isSyncing
            ? "Syncing with Zoho..."
            : "Sync Items from Zoho"}
        </button>
      </div>

      {/*
      ----------------------------------------------------------------------
      Integration Heading
      ----------------------------------------------------------------------
      */}

      <div className="rounded-xl border border-[#e1e3e5] bg-white px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link2
                size={17}
                className="text-[#16828b]"
              />

              <h2 className="text-base font-semibold text-[#202223]">
                Zoho Item
                Integration
              </h2>
            </div>

            <p className="mt-1 text-sm text-[#6d7175]">
              MyShops website
              variants are linked
              to Zoho Inventory
              using exact SKU
              matching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isFetchingStatus ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f1f2f3] px-3 py-1.5 text-xs font-medium text-[#6d7175]">
                <LoaderCircle
                  size={12}
                  className="animate-spin"
                />

                Refreshing
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2
                  size={12}
                />

                Connected
              </span>
            )}
          </div>
        </div>
      </div>

      {/*
      ----------------------------------------------------------------------
      Summary
      ----------------------------------------------------------------------
      */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Website Variants"
          value={
            summary
              ?.websiteVariants ??
            0
          }
          subtitle="Active variants published to the website"
          icon={
            <Package
              size={21}
            />
          }
        />

        <SummaryCard
          title="Linked to Zoho"
          value={
            summary
              ?.linked ??
            0
          }
          subtitle="Variants with a Zoho item link"
          icon={
            <Link2
              size={21}
            />
          }
        />

        <SummaryCard
          title="Not Linked"
          value={
            summary
              ?.notLinked ??
            0
          }
          subtitle="Website variants requiring attention"
          icon={
            <Unlink
              size={21}
            />
          }
        />

        <SummaryCard
          title="Link Rate"
          value={`${Number(
            summary
              ?.linkedPercent ??
              0
          ).toFixed(
            2
          )}%`}
          subtitle="Website variants currently linked"
          icon={
            <CheckCircle2
              size={21}
            />
          }
        />
      </div>

      {/*
      ----------------------------------------------------------------------
      Unlinked Items
      ----------------------------------------------------------------------
      */}

      <section className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] px-5 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-[#202223]">
                Items Not Linked
                to Zoho
              </h2>

              <p className="mt-1 text-sm text-[#6d7175]">
                Published website

                variants that do not
                currently have a Zoho
                item link.
              </p>
            </div>

            {/*
            ------------------------------------------------------------------
            Search
            ------------------------------------------------------------------
            */}

            <div className="relative w-full lg:w-[340px]">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
              />

              <input
                type="text"
                value={
                  searchInput
                }
                onChange={(
                  event
                ) =>
                  setSearchInput(
                    event.target
                      .value
                  )
                }
                placeholder="Search product, variant or SKU"
                className="h-10 w-full rounded-lg border border-[#c9cccf] bg-white pl-9 pr-3 text-sm text-[#202223] outline-none transition placeholder:text-[#8c9196] focus:border-[#16828b] focus:ring-1 focus:ring-[#16828b]"
              />

              {isFetchingStatus &&
              searchInput ? (
                <LoaderCircle
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8c9196]"
                />
              ) : null}
            </div>
          </div>
        </div>

        {/*
        ----------------------------------------------------------------------
        Table
        ----------------------------------------------------------------------
        */}

        {items.length >
        0 ? (
          <>
            <div className="overflow-x-auto">
            <table className="w-full min-w-[1150px] border-collapse">
                <thead>
                  <tr className="border-b border-[#e1e3e5] bg-[#f6f6f7]">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Product
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Variant
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      SKU
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
                      Zoho Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]">
  Last Checked
</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map(
                    (
                      item
                    ) => (
                      <tr
                        key={
                          item.productVariantId
                        }
                        className="border-b border-[#f1f2f3] last:border-b-0 hover:bg-[#fafbfb]"
                      >
                        {/*
                        ------------------------------------------------------
                        Product
                        ------------------------------------------------------
                        */}

                        <td className="px-5 py-4 align-top">
                          <div className="max-w-[340px]">
                            <p className="text-sm font-semibold leading-5 text-[#202223]">
                              {item.productName ||
                                "Unnamed product"}
                            </p>

                            {item.productSlug ? (
                              <p className="mt-1 truncate text-xs text-[#8c9196]">
                                {
                                  item.productSlug
                                }
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/*
                        ------------------------------------------------------
                        Variant
                        ------------------------------------------------------
                        */}

                        <td className="px-5 py-4 align-top">
                          <div className="max-w-[300px]">
                            <p className="text-sm leading-5 text-[#454f5b]">
                              {item.variantName ||
                                "Default variant"}
                            </p>
                          </div>
                        </td>

                        {/*
                        ------------------------------------------------------
                        SKU
                        ------------------------------------------------------
                        */}

                        <td className="px-5 py-4 align-top">
                          {item.sku ? (
                            <span className="inline-flex rounded-md bg-[#f1f2f3] px-2.5 py-1 font-mono text-xs font-semibold text-[#454f5b]">
                              {
                                item.sku
                              }
                            </span>
                          ) : (
                            <span className="text-xs text-[#8c9196]">
                              No SKU
                            </span>
                          )}
                        </td>

                        {/*
                        ------------------------------------------------------
                        Status
                        ------------------------------------------------------
                        */}

<td className="px-5 py-4 align-top">
  {(() => {
    const status =
      getZohoStatus(
        item.zohoStatus
      );

    return (
      <div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          <Unlink
            size={12}
          />

          {
            status.label
          }
        </span>

        {item.zohoStatusMessage ? (
          <p className="mt-1.5 max-w-[260px] text-xs leading-5 text-[#8c9196]">
            {
              item.zohoStatusMessage
            }
          </p>
        ) : null}
      </div>
    );
  })()}
</td>

<td className="px-5 py-4 align-top">
  <p className="whitespace-nowrap text-sm text-[#454f5b]">
    {formatDateTime(
      item.zohoLastCheckedAt
    )}
  </p>
</td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/*
            ------------------------------------------------------------------
            Pagination
            ------------------------------------------------------------------
            */}

            <div className="flex flex-col gap-3 border-t border-[#e1e3e5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-[#6d7175]">
                  Showing{" "}
                  <span className="font-semibold text-[#202223]">
                    {pagination
                      ? (pagination.page -
                          1) *
                          pagination.pageSize +
                        1
                      : 0}
                  </span>
                  {" - "}
                  <span className="font-semibold text-[#202223]">
                    {pagination
                      ? Math.min(
                          pagination.page *
                            pagination.pageSize,
                          pagination.totalItems
                        )
                      : 0}
                  </span>
                  {" of "}
                  <span className="font-semibold text-[#202223]">
                    {pagination
                      ?.totalItems ??
                      0}
                  </span>
                </p>

                {pagination &&
                pagination.totalPages >
                  1 ? (
                  <p className="mt-1 text-xs text-[#8c9196]">
                    Page{" "}
                    {
                      pagination.page
                    }{" "}
                    of{" "}
                    {
                      pagination.totalPages
                    }
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    !pagination
                      ?.hasPreviousPage ||
                    isFetchingStatus
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        Math.max(
                          1,
                          current -
                            1
                        )
                    )
                  }
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#c9cccf] bg-white px-3 text-sm font-medium text-[#454f5b] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft
                    size={15}
                  />

                  Previous
                </button>

                <button
                  type="button"
                  disabled={
                    !pagination
                      ?.hasNextPage ||
                    isFetchingStatus
                  }
                  onClick={() =>
                    setPage(
                      (
                        current
                      ) =>
                        current +
                        1
                    )
                  }
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#c9cccf] bg-white px-3 text-sm font-medium text-[#454f5b] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next

                  <ChevronRight
                    size={15}
                  />
                </button>
              </div>
            </div>
          </>
        ) : (
          /*
          --------------------------------------------------------------------
          Empty State
          --------------------------------------------------------------------
          */

          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f1f8f9] text-[#16828b]">
              {search ? (
                <Search
                  size={21}
                />
              ) : (
                <CheckCircle2
                  size={21}
                />
              )}
            </div>

            <h3 className="mt-4 text-sm font-semibold text-[#202223]">
              {search
                ? "No matching items found"
                : "All website items are linked"}
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#6d7175]">
              {search
                ? `No unlinked products or variants matched "${search}".`
                : "Every active and published website variant currently has a Zoho item link."}
            </p>

            {search ? (
              <button
                type="button"
                onClick={() => {
                  setSearchInput(
                    ""
                  );

                  setSearch(
                    ""
                  );

                  setPage(
                    1
                  );
                }}
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg border border-[#c9cccf] bg-white px-4 text-sm font-semibold text-[#454f5b] transition hover:bg-[#f6f6f7]"
              >
                Clear Search
              </button>
            ) : null}
          </div>
        )}
      </section>

      {/*
      ----------------------------------------------------------------------
      Information
      ----------------------------------------------------------------------
      */}

      <div className="rounded-xl border border-[#dfe3e8] bg-[#f8fafb] px-5 py-4">
        <div className="flex items-start gap-3">
          <Link2
            size={18}
            className="mt-0.5 shrink-0 text-[#16828b]"
          />

          <div>
            <p className="text-sm font-semibold text-[#202223]">
              How Zoho item
              linking works
            </p>

            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              MyShops matches
              each local product
              variant to a Zoho
              Inventory item using
              the exact SKU. Items
              that are already
              correctly linked are
              skipped during sync,
              so only new or changed
              links are written to
              the database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}