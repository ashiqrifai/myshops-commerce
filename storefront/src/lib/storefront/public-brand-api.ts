import "server-only";

import type {
  PublicBrandApiResponse,
  PublicBrandData,
  PublicBrandListApiResponse,
  PublicBrandListData,
  PublicBrandQuery,
} from "@/types/publicBrand";

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

const cleanSlug = (
  slug:
    string
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
    response:
      Response
  ) => {
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

    return payload;
  };

export async function getPublicBrands({
  channel =
    "WEBSITE",
}: {
  channel?:
    | "WEBSITE"
    | "KIOSK";
} = {}): Promise<PublicBrandListData> {
  const searchParams =
    new URLSearchParams();

  searchParams.set(
    "channel",
    channel
  );

  const response =
    await fetch(
      `${API_URL}/public/storefront/brands?${searchParams.toString()}`,

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
            "public-brands",
          ],
        },
      }
    );

  if (
    !response.ok
  ) {
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
        `Unable to load brands. HTTP ${response.status}`,

      code:
        payload
          ?.error
          ?.code ||
        payload
          ?.code,
    });
  }

  const payload =
    (
      await response
        .json()
    ) as
      PublicBrandListApiResponse;

  if (
    !payload.success ||
    !payload.data ||
    !Array.isArray(
      payload.data.brands
    )
  ) {
    throw new StorefrontApiError({
      status:
        500,

      message:
        "The brands API returned an invalid response.",

      code:
        "INVALID_PUBLIC_BRANDS_RESPONSE",
    });
  }

  return payload.data;
}

export async function getPublicBrand({
  slug,
  query = {},
}: {
  slug:
    string;

  query?:
    PublicBrandQuery;
}): Promise<PublicBrandData> {
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
    query.page
  ) {
    searchParams.set(
      "page",
      String(
        query.page
      )
    );
  }

  if (
    query.pageSize
  ) {
    searchParams.set(
      "pageSize",
      String(
        query.pageSize
      )
    );
  }

  if (
    query.search
  ) {
    searchParams.set(
      "search",
      query.search
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
    query.sort
  ) {
    searchParams.set(
      "sort",
      query.sort
    );
  }

  const response =
    await fetch(
      `${API_URL}/public/storefront/brands/${encodeURIComponent(
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
            "public-brand",
            `public-brand:${normalizedSlug}`,
          ],
        },
      }
    );

  if (
    !response.ok
  ) {
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
        `Unable to load brand. HTTP ${response.status}`,

      code:
        payload
          ?.error
          ?.code ||
        payload
          ?.code,
    });
  }

  const payload =
    (
      await response
        .json()
    ) as
      PublicBrandApiResponse;

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      message:
        "The brand API returned an invalid response.",

      code:
        "INVALID_PUBLIC_BRAND_RESPONSE",
    });
  }

  return payload.data;
}