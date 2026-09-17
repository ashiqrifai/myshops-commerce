export type ProductAttachmentDisplayLocation =
  | "PRODUCT_DETAIL"
  | "ADD_TO_CART"
  | "CART"
  | "CHECKOUT";

export type ProductAttachmentRelationshipType =
  | "ACCESSORY"
  | "UPSELL"
  | "CROSS_SELL"
  | "ADD_ON"
  | "BUNDLE_SUGGESTION"
  | "COMPATIBLE_PRODUCT";

export type ProductAttachmentSource =
  | "PRODUCT"
  | "BRAND"
  | "CATEGORY";

export interface PublicAttachmentBrand {
  id: string;
  name: string;
  code: string | null;
}

export interface PublicAttachmentVariant {
  id: string;
  sku: string;
  name: string;
}

export interface PublicAttachmentPrice {
  regularPrice: number;
  sellingPrice: number;
  compareAtPrice: number | null;
  currencyCode: string;
  isTaxInclusive: boolean;
}

export interface PublicAttachmentProduct {
  id: string;
  name: string;
  slug: string;
  brand: PublicAttachmentBrand | null;
  variant: PublicAttachmentVariant;
  price: PublicAttachmentPrice;
  taxPercent: number;
  image: string | null;
}

export interface PublicProductAttachmentSuggestion {
  attachmentProductId: string;
  ruleId: string;
  ruleName: string;
  relationshipType:
    ProductAttachmentRelationshipType;
  source:
    ProductAttachmentSource;
  priority: number;
  sortOrder: number;
  minimumQuantity: number;
  maximumQuantity: number | null;
  product:
    PublicAttachmentProduct;
}

export interface PublicProductAttachmentResponse {
  success: boolean;

  data: {
    product: {
      id: string;
      name: string;
      slug: string;
    };

    displayLocation:
      ProductAttachmentDisplayLocation;

    channelCode:
      string;

    currencyCode:
      string;

    suggestions:
      PublicProductAttachmentSuggestion[];
  };
}

const normalizeApiBase =
  (
    value:
      string
  ) => {
    const cleaned =
      value
        .trim()
        .replace(
          /\/+$/,
          ""
        );

    if (
      /\/api\/v1$/i.test(
        cleaned
      )
    ) {
      return cleaned;
    }

    if (
      /\/api$/i.test(
        cleaned
      )
    ) {
      return `${cleaned}/v1`;
    }

    return `${cleaned}/api/v1`;
  };

const API_BASE_URL =
  normalizeApiBase(
    process.env
      .NEXT_PUBLIC_API_URL ||
      "https://api.vkposme.tech"
  );

const COMPANY_CODE =
  (
    process.env
      .NEXT_PUBLIC_COMPANY_CODE ||
    "MYSHOPS"
  )
    .trim()
    .toUpperCase();

export const getAssetUrl =
  (
    value:
      string |
      null |
      undefined
  ) => {
    if (
      !value
    ) {
      return null;
    }

    if (
      /^https?:\/\//i.test(
        value
      )
    ) {
      return value;
    }

    try {
      const origin =
        new URL(
          API_BASE_URL
        ).origin;

      return `${origin}${
        value.startsWith(
          "/"
        )
          ? value
          : `/${value}`
      }`;
    } catch {
      return value;
    }
  };

export async function getPublicProductAttachments({
  productId,
  displayLocation =
    "PRODUCT_DETAIL",
  channelCode =
    "WEBSITE",
  currencyCode =
    "AED",
  excludeProductIds =
    [],
  limit =
    8,
  signal,
}: {
  productId:
    string;

  displayLocation?:
    ProductAttachmentDisplayLocation;

  channelCode?:
    string;

  currencyCode?:
    string;

  excludeProductIds?:
    string[];

  limit?:
    number;

  signal?:
    AbortSignal;
}): Promise<
  PublicProductAttachmentResponse
> {
  const params =
    new URLSearchParams({
      productId,

      displayLocation,

      channelCode,

      currencyCode,

      limit:
        String(
          limit
        ),
    });

  if (
    excludeProductIds
      .length
  ) {
    params.set(
      "excludeProductIds",
      excludeProductIds
        .join(
          ","
        )
    );
  }

  const response =
    await fetch(
      `${API_BASE_URL}/public/product-attachments?${params.toString()}`,
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

        signal,
      }
    );

  const payload =
    await response
      .json()
      .catch(
        () =>
          null
      );

  if (
    !response.ok
  ) {
    throw new Error(
      payload?.error
        ?.message ||
        payload
          ?.message ||
        "Unable to load product suggestions."
    );
  }

  return payload as
    PublicProductAttachmentResponse;
}
