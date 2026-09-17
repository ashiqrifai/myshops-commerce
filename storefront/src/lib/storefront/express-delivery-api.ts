import "server-only";

import type {
  StorefrontProduct,
} from "@/types/storefront";

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

export type ExpressDeliveryRegion =
  | "DXB_SHJ"
  | "AUH";

export interface ExpressDeliveryData {
  company: {
    id: string;
    name: string;
    code: string;
    currency: string;
  };

  region: {
    code:
      ExpressDeliveryRegion;

    label:
      string;

    deliveryLabel:
      string;

    hours:
      number;

    locationCodes:
      string[];
  };

  products:
    StorefrontProduct[];

  filters: {
    categories: {
      id: string;
      label: string;
      slug: string | null;
      count: number;
    }[];

    brands: {
      id: string;
      label: string;
      slug: string | null;
      count: number;
    }[];

    price: {
      minimum: number | null;
      maximum: number | null;
      currencyCode: string;
    };
  };

  sortOptions: {
    value:
      string;

    label:
      string;
  }[];

  pagination: {
    page:
      number;

    pageSize:
      number;

    totalItems:
      number;

    totalPages:
      number;

    hasPreviousPage:
      boolean;

    hasNextPage:
      boolean;
  };

  appliedFilters?: {
    search?:
      string |
      null;

    categoryIds?:
      string[];

    brandIds?:
      string[];

    minPrice?:
      number;

    maxPrice?:
      number;

    sort?:
      string;
  };

  meta: {
    channel:
      string;

    generatedAt:
      string;
  };
}

interface ApiResponse {
  success:
    boolean;

  data?:
    ExpressDeliveryData;

  error?: {
    code?:
      string;

    message?:
      string;
  };

  message?:
    string;
}

export async function getExpressDeliveryProducts({
  region =
    "DXB_SHJ",

  page =
    1,

  pageSize =
    24,

  search,

  categoryIds,

  brandIds,

  minPrice,

  maxPrice,

  sort =
    "FEATURED",
}: {
  region?:
    ExpressDeliveryRegion;

  page?:
    number;

  pageSize?:
    number;

  search?:
    string;

  categoryIds?:
    string[];

  brandIds?:
    string[];

  minPrice?:
    number;

  maxPrice?:
    number;

  sort?:
    string;
}): Promise<ExpressDeliveryData> {
  const params =
    new URLSearchParams({
      region,

      channel:
        "WEBSITE",

      page:
        String(page),

      pageSize:
        String(pageSize),

      sort,
    });

  if (
    search?.trim()
  ) {
    params.set(
      "search",
      search.trim()
    );
  }

  if (
    categoryIds?.length
  ) {
    params.set(
      "categoryIds",
      categoryIds.join(",")
    );
  }

  if (
    brandIds?.length
  ) {
    params.set(
      "brandIds",
      brandIds.join(",")
    );
  }

  if (
    minPrice !==
    undefined
  ) {
    params.set(
      "minPrice",
      String(
        minPrice
      )
    );
  }

  if (
    maxPrice !==
    undefined
  ) {
    params.set(
      "maxPrice",
      String(
        maxPrice
      )
    );
  }

  const response =
    await fetch(
      `${API_URL}/public/storefront/express-delivery/products?${params.toString()}`,
      {
        method:
          "GET",

        headers: {
          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        cache:
          "no-store",
      }
    );

  let payload:
    ApiResponse;

  try {
    payload =
      (await response.json()) as
        ApiResponse;
  } catch {
    throw new StorefrontApiError({
      status:
        response.status,

      message:
        "The express delivery API returned an invalid response.",

      code:
        "INVALID_EXPRESS_DELIVERY_RESPONSE",
    });
  }

  if (
    !response.ok ||
    !payload.success ||
    !payload.data
  ) {
    throw new StorefrontApiError({
      status:
        response.status,

      message:
        payload.error
          ?.message ||
        payload.message ||
        `Unable to load express delivery products. HTTP ${response.status}`,

      code:
        payload.error
          ?.code,
    });
  }

  return payload.data;
}