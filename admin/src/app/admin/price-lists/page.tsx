"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  PageToolbar,
} from "@/components/admin/common";

import {
  CrudPageLayout,
} from "@/components/layouts";

import {
  PriceListFilters,
  PriceListList,
  PriceListSummary,
} from "@/components/admin/pricing";

import usePriceLists from "@/hooks/pricing/usePriceLists";

export default function PriceListsPage() {
  const {
    priceLists,
    filteredPriceLists,
    pagination,

    search,
    filters,

    typeOptions,
    channelOptions,
    currencyOptions,

    feedback,
    queryErrorMessage,

    isLoading,
    isFetching,
    isChangingStatus,
    isDeleting,
    isMutating,

    handleCreate,
    handleEdit,
    handleDuplicate,
    handleRefresh,
    handleStatusChange,
    handleSetDefault,
    handleDelete,

    handleSearchChange,
    handleFiltersChange,
    handlePageChange,
    handlePageSizeChange,

    clearFeedback,
  } = usePriceLists();

  return (
    <CrudPageLayout
      gap="md"
      toolbar={
        <PageToolbar
          title="Price Lists"
          subtitle="Manage pricing currencies, channels, priorities, validity periods, tax settings, and default pricing."
          searchValue={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by price-list name or code..."
          searchDisabled={isLoading || isMutating}
          onRefresh={handleRefresh}
          isRefreshing={isFetching && !isLoading}
          refreshDisabled={isLoading || isMutating}
          primaryAction={{
            key: "create-price-list",
            label: "New Price List",
            onClick: handleCreate,
            disabled: isMutating,
          }}
        />
      }
      feedback={feedback}
      errorMessage={queryErrorMessage}
      onDismissFeedback={clearFeedback}
      summary={
        <PriceListSummary
          priceLists={priceLists}
          isLoading={isLoading}
          totalItems={pagination.totalItems}
        />
      }
      filters={
        <PriceListFilters
          filters={filters}
          onChange={handleFiltersChange}
          typeOptions={typeOptions}
          channelOptions={channelOptions}
          currencyOptions={currencyOptions}
          disabled={isLoading || isMutating}
        />
      }
      afterContent={
        <PriceListPagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          totalPages={pagination.totalPages}
          disabled={isLoading || isFetching || isMutating}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      }
    >
      <PriceListList
        priceLists={filteredPriceLists}
        isLoading={isLoading}
        isFetching={isFetching}
        isChangingStatus={isChangingStatus}
        isDeleting={isDeleting}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onSetDefault={handleSetDefault}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />
    </CrudPageLayout>
  );
}

interface PriceListPaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;

  disabled?: boolean;

  onPageChange: (
    page: number
  ) => void;

  onPageSizeChange: (
    pageSize: number
  ) => void;
}

function PriceListPagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  disabled = false,
  onPageChange,
  onPageSizeChange,
}: PriceListPaginationProps) {
  const safePage =
    Math.max(
      page,
      1
    );

  const safeTotalPages =
    Math.max(
      totalPages,
      1
    );

  const firstItem =
    totalItems === 0
      ? 0
      : (
          safePage -
          1
        ) *
          pageSize +
        1;

  const lastItem =
    Math.min(
      safePage *
        pageSize,
      totalItems
    );

  const canGoPrevious =
    safePage > 1;

  const canGoNext =
    totalPages > 0 &&
    safePage < totalPages;

  return (
    <section
      aria-label="Price list pagination"
      className="flex flex-col gap-3 rounded-xl border border-[#e1e3e5] bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-[#6d7175]">
        Showing{" "}
        <span className="font-semibold text-[#303030]">
          {firstItem}
        </span>
        {" – "}
        <span className="font-semibold text-[#303030]">
          {lastItem}
        </span>
        {" of "}
        <span className="font-semibold text-[#303030]">
          {totalItems}
        </span>
        {" price lists"}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#6d7175]">
          Rows

          <select
            value={pageSize}
            disabled={disabled}
            aria-label="Rows per page"
            onChange={(event) =>
              onPageSizeChange(
                Number(
                  event.target.value
                )
              )
            }
            className="h-9 rounded-lg border border-[#babfc3] bg-white px-2 text-sm text-[#303030] outline-none transition hover:border-[#8c9196] focus:border-[#303030] focus:ring-1 focus:ring-[#303030] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {[
              10,
              20,
              30,
              50,
              100,
            ].map(
              (
                option
              ) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              )
            )}
          </select>
        </label>

        <span className="text-sm text-[#6d7175]">
          Page{" "}
          <span className="font-semibold text-[#303030]">
            {safePage}
          </span>
          {" of "}
          <span className="font-semibold text-[#303030]">
            {safeTotalPages}
          </span>
        </span>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={
              disabled ||
              !canGoPrevious
            }
            onClick={() =>
              onPageChange(
                safePage -
                  1
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:border-[#8c9196] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft
              size={17}
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            aria-label="Next page"
            disabled={
              disabled ||
              !canGoNext
            }
            onClick={() =>
              onPageChange(
                safePage +
                  1
              )
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#303030] transition hover:border-[#8c9196] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight
              size={17}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
}