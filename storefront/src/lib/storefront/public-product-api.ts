import "server-only";

import type {
  PublicProductApiResponse,
  PublicProductData,
} from "@/types/publicProduct";

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

export async function getPublicProduct({
  slug,
  channel = "WEBSITE",
}: {
  slug: string;
  channel?:
    | "WEBSITE"
    | "KIOSK";
}): Promise<PublicProductData> {
  const normalizedSlug =
    decodeURIComponent(slug)
      .trim()
      .replace(
        /^\/+|\/+$/g,
        ""
      )
      .toLowerCase();

  const searchParams =
    new URLSearchParams({
      channel,
    });

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

        next: {
          revalidate: 120,
          tags: [
            "public-product",
            `public-product:${normalizedSlug}`,
          ],
        },
      }
    );

  if (!response.ok) {
    let payload:
      | {
          error?: {
            code?: string;
            message?: string;
          };
          code?: string;
          message?: string;
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
        payload?.error
          ?.code ||
        payload?.code,
      message:
        payload?.error
          ?.message ||
        payload?.message ||
        `Unable to load product. HTTP ${response.status}`,
    });
  }

  const payload =
    (await response.json()) as PublicProductApiResponse;

  if (
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status: 500,
      code:
        "INVALID_PUBLIC_PRODUCT_RESPONSE",
      message:
        "The product API returned an invalid response.",
    });
  }

  return payload.data;
}
