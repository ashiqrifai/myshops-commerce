import "server-only";

import type {
  PublicCategoryApiResponse,
  PublicCategoryData,
  PublicCategoryListApiResponse,
  PublicCategoryListData,
  PublicCategoryQuery,
} from "@/types/publicCategory";

import {
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const cleanSlug = (
  slug: string
) =>
  decodeURIComponent(
    slug
  )
    .trim()
    .replace(
      /^\/+|\/+$/g,
      ""
    )
    .toLowerCase();

const getErrorPayload =
  async (
    response: Response
  ) => {
    let payload:
      | {
          error?: {
            message?: string;
            code?: string;
          };

          message?: string;

          code?: string;
        }
      | undefined;

    try {
      payload =
        await response.json();
    } catch {
      payload =
        undefined;
    }

    return payload;
  };

/*
|--------------------------------------------------------------------------
| All Public Categories
|--------------------------------------------------------------------------
*/

export async function getPublicCategories({
  channel = "WEBSITE",
}: {
  channel?:
    | "WEBSITE"
    | "KIOSK";
} = {}): Promise<PublicCategoryListData> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "channel",
    channel
  );

  const response =
    await fetch(
      `${API_URL}/public/storefront/categories?${searchParams.toString()}`,
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
            120,

          tags: [
            "public-categories",
          ],
        },
      }
    );

  if (!response.ok) {
    const payload =
      await getErrorPayload(
        response
      );

    throw new StorefrontApiError({
      status:
        response.status,

      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Unable to load categories. HTTP ${response.status}`,

      code:
        payload
          ?.error
          ?.code ||
        payload
          ?.code,
    });
  }

  const payload =
    (await response.json()) as PublicCategoryListApiResponse;

  if (
    !payload.success ||
    !payload.data ||
    !Array.isArray(
      payload.data.categories
    )
  ) {
    throw new StorefrontApiError({
      status:
        500,

      message:
        "The categories API returned an invalid response.",

      code:
        "INVALID_PUBLIC_CATEGORIES_RESPONSE",
    });
  }

  return payload.data;
}

/*
|--------------------------------------------------------------------------
| Single Public Category
|--------------------------------------------------------------------------
*/

export async function getPublicCategory({
  slug,
  query = {},
}: {
  slug: string;
  query?: PublicCategoryQuery;
}): Promise<PublicCategoryData> {
  const normalizedSlug =
    cleanSlug(
      slug
    );

  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "channel",
    query.channel ||
      "WEBSITE"
  );

  if (
    query.page &&
    Number(query.page) >
      1
  ) {
    searchParams.set(
      "page",
      String(
        query.page
      )
    );
  }

  if (
    query.pageSize &&
    Number(
      query.pageSize
    ) !==
      24
  ) {
    searchParams.set(
      "pageSize",
      String(
        query.pageSize
      )
    );
  }

  if (query.search) {
    searchParams.set(
      "search",
      query.search
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
    query
      .attributeOptionIds
      ?.length
  ) {
    searchParams.set(
      "attributeOptionIds",
      query
        .attributeOptionIds
        .join(",")
    );
  }

  Object.entries(
    query.attributeRanges ||
      {}
  ).forEach(
    (
      [
        attributeId,
        range,
      ]
    ) => {
      if (
        range.min !==
        undefined
      ) {
        searchParams.set(
          `attributeMin[${attributeId}]`,
          String(
            range.min
          )
        );
      }

      if (
        range.max !==
        undefined
      ) {
        searchParams.set(
          `attributeMax[${attributeId}]`,
          String(
            range.max
          )
        );
      }
    }
  );

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

  if (query.sort) {
    searchParams.set(
      "sort",
      query.sort
    );
  }

  const response =
    await fetch(
      `${API_URL}/public/storefront/categories/${encodeURIComponent(
        normalizedSlug
      )}?${searchParams.toString()}`,
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
            120,

          tags: [
            "public-category",
            `public-category:${normalizedSlug}`,
          ],
        },
      }
    );

  if (!response.ok) {
    const payload =
      await getErrorPayload(
        response
      );

    throw new StorefrontApiError({
      status:
        response.status,

      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Unable to load category. HTTP ${response.status}`,

      code:
        payload
          ?.error
          ?.code ||
        payload
          ?.code,
    });
  }

  const payload =
    (await response.json()) as PublicCategoryApiResponse;

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      message:
        "The category API returned an invalid response.",

      code:
        "INVALID_PUBLIC_CATEGORY_RESPONSE",
    });
  }

  return payload.data;
}