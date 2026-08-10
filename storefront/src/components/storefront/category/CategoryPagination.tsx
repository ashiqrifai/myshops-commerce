import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import type {
  PublicCategoryPagination,
} from "@/types/publicCategory";

const buildHref = (
  currentQuery: Record<
    string,
    string | string[] | undefined
  >,
  page: number
) => {
  const params =
    new URLSearchParams();

  Object.entries(
    currentQuery
  ).forEach(
    ([key, value]) => {
      if (
        value === undefined
      ) {
        return;
      }

      params.set(
        key,
        Array.isArray(value)
          ? value.join(",")
          : value
      );
    }
  );

  params.set(
    "page",
    String(page)
  );

  return `?${params.toString()}`;
};

export default function CategoryPagination({
  pagination,
  currentQuery,
}: {
  pagination: PublicCategoryPagination;

  currentQuery: Record<
    string,
    string | string[] | undefined
  >;
}) {
  if (
    pagination.totalPages <=
    1
  ) {
    return null;
  }

  const pages =
    Array.from(
      {
        length:
          pagination.totalPages,
      },
      (_, index) =>
        index + 1
    ).filter(
      (page) =>
        page === 1 ||
        page ===
          pagination.totalPages ||
        Math.abs(
          page -
            pagination.page
        ) <= 2
    );

  return (
    <nav
      aria-label="Category pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      {pagination.hasPreviousPage ? (
        <Link
          href={buildHref(
            currentQuery,
            pagination.page - 1
          )}
          className="flex h-10 items-center gap-1 rounded-storefront-button border border-storefront bg-white px-3 text-sm font-bold text-storefront-text"
        >
          <ChevronLeft
            size={16}
          />
          Previous
        </Link>
      ) : null}

      {pages.map(
        (page, index) => {
          const previous =
            pages[
              index - 1
            ];

          const gap =
            previous &&
            page - previous >
              1;

          return (
            <span
              key={page}
              className="contents"
            >
              {gap ? (
                <span className="px-1 text-storefront-muted">
                  …
                </span>
              ) : null}

              <Link
                href={buildHref(
                  currentQuery,
                  page
                )}
                className={[
                  "flex h-10 min-w-10 items-center justify-center rounded-storefront-button border px-3 text-sm font-bold",
                  page ===
                  pagination.page
                    ? "border-storefront-primary bg-storefront-primary text-white"
                    : "border-storefront bg-white text-storefront-text",
                ].join(" ")}
              >
                {page}
              </Link>
            </span>
          );
        }
      )}

      {pagination.hasNextPage ? (
        <Link
          href={buildHref(
            currentQuery,
            pagination.page + 1
          )}
          className="flex h-10 items-center gap-1 rounded-storefront-button border border-storefront bg-white px-3 text-sm font-bold text-storefront-text"
        >
          Next
          <ChevronRight
            size={16}
          />
        </Link>
      ) : null}
    </nav>
  );
}
