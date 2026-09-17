import "server-only";

import {
  cache,
} from "react";

import type {
  PublicProductApiResponse,
  PublicProductData,
} from "@/types/publicProduct";

import {
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

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
| Product Channel
|--------------------------------------------------------------------------
*/

type PublicProductChannel =
  | "WEBSITE"
  | "KIOSK";

/*
|--------------------------------------------------------------------------
| Internal Product Loader
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This function accepts primitive arguments:
|
|   slug
|   channel
|
| This allows React cache() to reliably memoize repeated calls using the
| same product slug and channel during the same server rendering lifecycle.
|
| Product pages currently request product data from both:
|
|   generateMetadata()
|   ProductRoute()
|
| Without explicit memoization those paths can cause duplicate expensive
| product API work.
|--------------------------------------------------------------------------
*/

async function getPublicProductInternal(
  slug: string,
  channel: PublicProductChannel
): Promise<PublicProductData> {
  /*
  |--------------------------------------------------------------------------
  | Normalize Slug
  |--------------------------------------------------------------------------
  */

  const normalizedSlug =
    decodeURIComponent(
      slug
    )
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .toLowerCase();

  /*
  |--------------------------------------------------------------------------
  | Query Parameters
  |--------------------------------------------------------------------------
  */

  const searchParams =
    new URLSearchParams({
      channel,
    });

  /*
  |--------------------------------------------------------------------------
  | Request
  |--------------------------------------------------------------------------
  */

  const response =
    await fetch(
      `${API_URL}/public/storefront/products/${encodeURIComponent(
        normalizedSlug
      )}?${searchParams.toString()}`,
      {
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
        | Keep the existing 120-second product cache.
        |
        | React cache() below handles request/render memoization.
        | Next.js fetch caching handles reuse across requests.
        |--------------------------------------------------------------------------
        */

        next: {
          revalidate:
            120,

          tags: [
            "public-product",

            `public-product:${normalizedSlug}`,
          ],
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
    let payload:
      | {
          error?: {
            code?:
              string;

            message?:
              string;
          };

          code?:
            string;

          message?:
            string;
        }
      | undefined;

    try {
      payload =
        await response.json();
    } catch {
      payload =
        undefined;
    }

    throw new StorefrontApiError({
      status:
        response.status,

      code:
        payload
          ?.error
          ?.code ||
        payload
          ?.code,

      message:
        payload
          ?.error
          ?.message ||
        payload
          ?.message ||
        `Unable to load product. HTTP ${response.status}`,
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
    ) as PublicProductApiResponse;

  /*
  |--------------------------------------------------------------------------
  | Validate Public API Response
  |--------------------------------------------------------------------------
  */

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status:
        500,

      code:
        "INVALID_PUBLIC_PRODUCT_RESPONSE",

      message:
        "The product API returned an invalid response.",
    });
  }

  return payload.data;
}

/*
|--------------------------------------------------------------------------
| React Server Request Memoization
|--------------------------------------------------------------------------
|
| The cache key is based on:
|
|   slug
|   channel
|
| Example:
|
|   iphone-18-pro + WEBSITE
|
| This avoids using an object as the cache argument, because separate object
| instances would not provide the reliable primitive-key memoization that we
| want here.
|--------------------------------------------------------------------------
*/

const getCachedPublicProduct =
  cache(
    getPublicProductInternal
  );

/*
|--------------------------------------------------------------------------
| Public Product API
|--------------------------------------------------------------------------
|
| Keep the existing public function signature so no callers need to change.
|--------------------------------------------------------------------------
*/

export async function getPublicProduct({
  slug,
  channel = "WEBSITE",
}: {
  slug:
    string;

  channel?:
    PublicProductChannel;
}): Promise<PublicProductData> {
  return getCachedPublicProduct(
    slug,
    channel
  );
}