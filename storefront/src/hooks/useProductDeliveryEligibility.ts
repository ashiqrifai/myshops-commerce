"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  requestDeliveryEligibility,
} from "@/lib/storefront/deliveryEligibilityApi";

import type {
  DeliveryEligibilityItem,
} from "@/lib/storefront/deliveryEligibilityApi";

interface UseProductDeliveryEligibilityOptions {
  productVariantId:
    | string
    | null
    | undefined;

  quantity?: number;

  /*
   * Allows the caller to completely skip the live inventory
   * eligibility request when Express Delivery is disabled for
   * the selected product / variant.
   */
  enabled?: boolean;
}

export function useProductDeliveryEligibility({
  productVariantId,
  quantity = 1,
  enabled = true,
}: UseProductDeliveryEligibilityOptions) {
  const [
    eligibility,
    setEligibility,
  ] =
    useState<DeliveryEligibilityItem | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null
    );

  useEffect(
    () => {
      /*
      |--------------------------------------------------------------------------
      | Disabled / Missing Variant
      |--------------------------------------------------------------------------
      |
      | If Express Delivery is disabled for this product/variant there is no
      | reason to call the live inventory eligibility endpoint.
      |--------------------------------------------------------------------------
      */

      if (
        !enabled ||
        !productVariantId
      ) {
        setEligibility(
          null
        );

        setLoading(
          false
        );

        setError(
          null
        );

        return;
      }

      let active =
        true;

      const normalizedQuantity =
        Math.max(
          1,
          Number(
            quantity ||
              1
          )
        );

      const run =
        async () => {
          try {
            setLoading(
              true
            );

            setError(
              null
            );

            /*
            |--------------------------------------------------------------------------
            | Live Express Eligibility
            |--------------------------------------------------------------------------
            */

            const result =
              await requestDeliveryEligibility({
                productVariantId,

                quantity:
                  normalizedQuantity,
              });

            if (
              !active
            ) {
              return;
            }

            setEligibility(
              result
            );
          } catch (
            requestError
          ) {
            if (
              !active
            ) {
              return;
            }

            console.error(
              "Delivery eligibility error:",
              requestError
            );

            setEligibility(
              null
            );

            setError(
              requestError instanceof
                Error
                ? requestError.message
                : "Unable to check delivery availability."
            );
          } finally {
            if (
              active
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void run();

      return () => {
        active =
          false;
      };
    },
    [
      enabled,
      productVariantId,
      quantity,
    ]
  );

  return {
    eligibility,
    loading,
    error,
  };
}