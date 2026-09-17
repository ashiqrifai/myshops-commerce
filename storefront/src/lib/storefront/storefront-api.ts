import "server-only";

import {
  cache,
} from "react";

import type {
  StorefrontApiErrorResponse,
  StorefrontApiResponse,
  StorefrontChannel,
  StorefrontData,
} from "@/types/storefront";

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Storefront API Error
|--------------------------------------------------------------------------
*/

export class StorefrontApiError extends Error {
  status: number;
  code?: string;

  constructor({
    message,
    status,
    code,
  }: {
    message: string;
    status: number;
    code?: string;
  }) {
    super(
      message
    );

    this.name =
      "StorefrontApiError";

    this.status =
      status;

    this.code =
      code;
  }
}

/*
|--------------------------------------------------------------------------
| Normalize Slug
|--------------------------------------------------------------------------
*/

const normalizeSlug = (
  slug?: string
) => {
  const trimmed =
    String(
      slug ||
        "/"
    ).trim();

  if (
    !trimmed ||
    trimmed === "/"
  ) {
    return "/";
  }

  const withLeadingSlash =
    trimmed.startsWith(
      "/"
    )
      ? trimmed
      : `/${trimmed}`;

  return withLeadingSlash
    .replace(
      /\/+/g,
      "/"
    )
    .replace(
      /\/$/,
      ""
    )
    .toLowerCase();
};

/*
|--------------------------------------------------------------------------
| Internal Storefront Page Loader
|--------------------------------------------------------------------------
|
| Primitive arguments are used deliberately.
|
| React cache() can therefore memoize using:
|
|   normalized slug
|   channel
|
| rather than relying on the identity of an object argument.
|--------------------------------------------------------------------------
*/

async function getStorefrontPageInternal(
  normalizedSlug: string,
  channel: StorefrontChannel
): Promise<StorefrontData> {
  const searchParams =
    new URLSearchParams({
      slug:
        normalizedSlug,

      channel,
    });

  /*
  |--------------------------------------------------------------------------
  | Request
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      `${API_URL}/public/storefront/page?${searchParams.toString()}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        /*
        |--------------------------------------------------------------------------
        | Next.js Data Cache
        |--------------------------------------------------------------------------
        |
        | Keep the existing 60-second cache.
        |
        | Next.js handles reuse across requests while React cache() below
        | memoizes repeated calls during the same server rendering lifecycle.
        |--------------------------------------------------------------------------
        */

        next: {
          revalidate:
            60,
        },
      }
    );

  /*
  |--------------------------------------------------------------------------
  | HTTP Error Handling
  |--------------------------------------------------------------------------
  */

  if (
    !response.ok
  ) {
    let errorPayload:
      | StorefrontApiErrorResponse
      | undefined;

    try {
      errorPayload =
        (
          await response.json()
        ) as StorefrontApiErrorResponse;
    } catch {
      errorPayload =
        undefined;
    }

    const message =
      errorPayload
        ?.error
        ?.message ||
      errorPayload
        ?.message ||
      `Unable to load storefront page. HTTP ${response.status}`;

    const code =
      errorPayload
        ?.error
        ?.code ||
      errorPayload
        ?.code;

    throw new StorefrontApiError({
      message,
      status:
        response.status,
      code,
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Parse Response
  |--------------------------------------------------------------------------
  */

  const payload =
    (
      await response.json()
    ) as StorefrontApiResponse;

  /*
  |--------------------------------------------------------------------------
  | Validate Response
  |--------------------------------------------------------------------------
  */

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      message:
        "The storefront API returned an invalid response.",

      status:
        500,

      code:
        "INVALID_STOREFRONT_RESPONSE",
    });
  }

  return payload.data;
}

/*
|--------------------------------------------------------------------------
| React Server Memoization
|--------------------------------------------------------------------------
|
| Examples:
|
|   "/" + "WEBSITE"
|   "/product" + "WEBSITE"
|
| Repeated requests for the same page during one React server render reuse
| the same result instead of parsing/allocating another large storefront
| response.
|--------------------------------------------------------------------------
*/

const getCachedStorefrontPage =
  cache(
    getStorefrontPageInternal
  );

/*
|--------------------------------------------------------------------------
| Public Storefront Page API
|--------------------------------------------------------------------------
|
| Keep the existing object-based public API so none of the current callers
| need to change.
|--------------------------------------------------------------------------
*/

export async function getStorefrontPage({
  slug = "/",
  channel = "WEBSITE",
}: {
  slug?: string;
  channel?: StorefrontChannel;
}): Promise<StorefrontData> {
  const normalizedSlug =
    normalizeSlug(
      slug
    );

  return getCachedStorefrontPage(
    normalizedSlug,
    channel
  );
}