"use client";

import {
  useEffect,
} from "react";

import {
  trackStorefrontActivity,
  type StorefrontActivityType,
} from "@/lib/storefront/storefront-activity-api";

interface StorefrontPageViewTrackerProps {
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

  source:
    string;

  metadata?:
    Record<
      string,
      unknown
    >;
}

export default function StorefrontPageViewTracker({
  activityType,
  productId = null,
  variantId = null,
  categoryId = null,
  brandId = null,
  collectionId = null,
  source,
  metadata = {},
}: StorefrontPageViewTrackerProps) {
  useEffect(
    () => {
      void trackStorefrontActivity({
        activityType,

        productId,

        variantId,

        categoryId,

        brandId,

        collectionId,

        source,

        metadata,
      });
    },
    [
      activityType,
      productId,
      variantId,
      categoryId,
      brandId,
      collectionId,
      source,
    ]
  );

  return null;
}