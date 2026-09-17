import "server-only";

import type {
  PublicSearchApiResponse,
  PublicSearchData,
  PublicSearchQuery,
} from "@/types/publicSearch";

import {
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

const API_URL =
  process.env.API_URL ||
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export async function getPublicSearch({
  query = {},
}: {
  query?:
    PublicSearchQuery;
}): Promise<PublicSearchData> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "channel",
    query.channel ||
      "WEBSITE"
  );

  if (
    query.q?.trim()
  ) {
    searchParams.set(
      "q",
      query.q.trim()
    );
  }

  if (query.page) {
    searchParams.set(
      "page",
      String(
        query.page
      )
    );
  }

  if (query.pageSize) {
    searchParams.set(
      "pageSize",
      String(
        query.pageSize
      )
    );
  }

  if (
    query.brandIds
      ?.length
  ) {
    searchParams.set(
      "brandIds",
      query.brandIds.join(
        ","
      )
    );
  }

  if (
    query.categoryIds
      ?.length
  ) {
    searchParams.set(
      "categoryIds",
      query.categoryIds.join(
        ","
      )
    );
  }

  if (
    query.minPrice !==
    undefined
  ) {
    searchParams.set(
      "minPrice",
      String(
        query.minPrice
      )
    );
  }

  if (
    query.maxPrice !==
    undefined
  ) {
    searchParams.set(
      "maxPrice",
      String(
        query.maxPrice
      )
    );
  }

  if (
    query.featured !==
    undefined
  ) {
    searchParams.set(
      "featured",
      String(
        query.featured
      )
    );
  }

  if (query.sort) {
    searchParams.set(
      "sort",
      query.sort
    );
  }

  const response =
    await fetch(
      `${API_URL}/public/storefront/search?${searchParams.toString()}`,

      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        next: {
          revalidate:
            60,

          tags: [
            "public-search",
          ],
        },
      }
    );

  if (!response.ok) {
    let payload:
      | {
          error?: {
            message?:
              string;

            code?:
              string;
          };

          message?:
            string;

          code?:
            string;
        }
      | undefined;

    try {
      payload =
        await response
          .json();
    } catch {
      payload =
        undefined;
    }

    throw new StorefrontApiError({
      status:
        response.status,

      message:
        payload?.error
          ?.message ||
        payload?.message ||
        `Unable to search products. HTTP ${response.status}`,

      code:
        payload?.error
          ?.code ||
        payload?.code,
    });
  }

  const payload =
    (
      await response
        .json()
    ) as
      PublicSearchApiResponse;

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      message:
        "The search API returned an invalid response.",

      code:
        "INVALID_PUBLIC_SEARCH_RESPONSE",
    });
  }

  return payload.data;
}