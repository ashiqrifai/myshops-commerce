import "server-only";

import type {
  StorefrontApiErrorResponse,
  StorefrontApiResponse,
  StorefrontChannel,
  StorefrontData,
} from "@/types/storefront";

const API_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

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
    super(message);

    this.name = "StorefrontApiError";
    this.status = status;
    this.code = code;
  }
}

const normalizeSlug = (
  slug?: string
) => {
  const trimmed = String(
    slug || "/"
  ).trim();

  if (!trimmed || trimmed === "/") {
    return "/";
  }

  const withLeadingSlash =
    trimmed.startsWith("/")
      ? trimmed
      : `/${trimmed}`;

  return withLeadingSlash
    .replace(/\/+/g, "/")
    .replace(/\/$/, "")
    .toLowerCase();
};

export async function getStorefrontPage({
  slug = "/",
  channel = "WEBSITE",
}: {
  slug?: string;
  channel?: StorefrontChannel;
}): Promise<StorefrontData> {
  const normalizedSlug =
    normalizeSlug(slug);

  const searchParams =
    new URLSearchParams({
      slug: normalizedSlug,
      channel,
    });

  const response = await fetch(
    `${API_URL}/public/storefront/page?${searchParams.toString()}`,
    {
      method: "GET",

      headers: {
        Accept: "application/json",
        "x-company-code":
          COMPANY_CODE,
      },

      next: {
        revalidate: 300,

        tags: [
          "storefront",
          `storefront:${channel}`,
          `storefront:${channel}:${normalizedSlug}`,
        ],
      },
    }
  );

  if (!response.ok) {
    let errorPayload:
      | StorefrontApiErrorResponse
      | undefined;

    try {
      errorPayload =
        (await response.json()) as StorefrontApiErrorResponse;
    } catch {
      errorPayload = undefined;
    }

    const message =
      errorPayload?.error?.message ||
      errorPayload?.message ||
      `Unable to load storefront page. HTTP ${response.status}`;

    const code =
      errorPayload?.error?.code ||
      errorPayload?.code;

    throw new StorefrontApiError({
      message,
      status: response.status,
      code,
    });
  }

  const payload =
    (await response.json()) as StorefrontApiResponse;

  if (!payload.success || !payload.data) {
    throw new StorefrontApiError({
      message:
        "The storefront API returned an invalid response.",
      status: 500,
      code:
        "INVALID_STOREFRONT_RESPONSE",
    });
  }

  return payload.data;
}