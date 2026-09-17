"use client";

import {
  getStorefrontVisitorId,
} from "@/lib/storefront/storefront-visitor";

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export type StorefrontActivityType =
  | "SEARCH"
  | "VIEW_PRODUCT"
  | "VIEW_CATEGORY"
  | "VIEW_BRAND"
  | "VIEW_COLLECTION"
  | "ADD_TO_CART"
  | "ADD_TO_WISHLIST"
  | "PURCHASE";

interface TrackStorefrontActivityInput {
  activityType:
    StorefrontActivityType;

  productId?:
    string | null;

  variantId?:
    string | null;

  categoryId?:
    string | null;

  brandId?:
    string | null;

  collectionId?:
    string | null;

  searchQuery?:
    string | null;

  quantity?:
    number | null;

  source?:
    string | null;

  metadata?:
    Record<
      string,
      unknown
    >;
}

export async function trackStorefrontActivity(
  input:
    TrackStorefrontActivityInput
): Promise<void> {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const visitorId =
      getStorefrontVisitorId();

    if (!visitorId) {
      return;
    }

    const payload = {
      visitorId,

      activityType:
        input.activityType,

      productId:
        input.productId ||
        null,

      variantId:
        input.variantId ||
        null,

      categoryId:
        input.categoryId ||
        null,

      brandId:
        input.brandId ||
        null,

      collectionId:
        input.collectionId ||
        null,

      searchQuery:
        input.searchQuery ||
        null,

      quantity:
        input.quantity ??
        null,

      source:
        input.source ||
        null,

      pageUrl:
        window.location.href,

      referrer:
        document.referrer ||
        null,

      channel:
        "WEBSITE",

      metadata:
        input.metadata ||
        {},
    };

    const response =
      await fetch(
        `${API_URL}/public/storefront/activity`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            "x-company-code":
              COMPANY_CODE,
          },

          body:
            JSON.stringify(
              payload
            ),

          /*
           * Tracking should not
           * block navigation.
           */
          keepalive:
            true,
        }
      );

    if (
      !response.ok
    ) {
      console.warn(
        "[Storefront activity] tracking failed:",
        response.status
      );
    }
  } catch (
    error
  ) {
    /*
     * Tracking must never break
     * the shopping experience.
     */
    console.warn(
      "[Storefront activity] tracking error:",
      error
    );
  }
}