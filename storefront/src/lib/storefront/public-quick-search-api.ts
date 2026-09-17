const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export interface QuickSearchProduct {
  id:
    string;

  name:
    string;

  slug:
    string;

  productUrl?:
    string | null;

  brand?: {
    name?:
      string | null;
  } | null;

  defaultVariant?: {
    id?:
      string | null;

    sku?:
      string | null;
  } | null;

  price?: {
    sellingPrice?:
      number | string | null;

    compareAtPrice?:
      number | string | null;

    currencyCode?:
      string | null;

    isTaxInclusive?:
      boolean;
  } | null;

  image?: {
    altText?:
      string | null;

    mediaAsset?: {
      publicUrl?:
        string | null;

      previewUrl?:
        string | null;

      thumbnailUrl?:
        string | null;

      variants?: Array<{
        publicUrl?:
          string | null;

        variantType?:
          string | null;

        isPrimary?:
          boolean;
      }>;
    } | null;
  } | null;
}

interface QuickSearchResponse {
  success:
    boolean;

  data?: {
    products?:
      QuickSearchProduct[];
  };

  error?: {
    message?:
      string;
  };

  message?:
    string;
}

export async function quickSearchProducts(
  query:
    string
): Promise<QuickSearchProduct[]> {
  const value =
    query.trim();

  if (
    value.length <
    2
  ) {
    return [];
  }

  const params =
    new URLSearchParams();

  params.set(
    "channel",
    "WEBSITE"
  );

  params.set(
    "q",
    value
  );

  params.set(
    "page",
    "1"
  );

  params.set(
    "quick",
    "true"
  );

  const response =
    await fetch(
      `${API_URL}/public/storefront/search?${params.toString()}`,
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

  const payload =
    await response
      .json()
      .catch(
        () =>
          undefined
      ) as
        | QuickSearchResponse
        | undefined;

  if (
    !response.ok
  ) {
    throw new Error(
      payload
        ?.error
        ?.message ||
        payload
          ?.message ||
        "Unable to search products."
    );
  }

  if (
    !payload?.success
  ) {
    return [];
  }

  return Array.isArray(
    payload.data
      ?.products
  )
    ? payload.data
        ?.products ||
        []
    : [];
}