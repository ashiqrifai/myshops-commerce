"use client";

import {
  LoaderCircle,
  PackageSearch,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import type {
  PublicProductData,
} from "@/types/publicProduct";

interface CartRecommendationsProps {
  productSlug:
    | string
    | null;
}

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export default function CartRecommendations({
  productSlug,
}: CartRecommendationsProps) {
  const [
    products,
    setProducts,
  ] =
    useState<
      PublicProductData["relatedProducts"]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(() => {
    if (!productSlug) {
      setProducts([]);
      return;
    }

    const controller =
      new AbortController();

    const load =
      async () => {
        setLoading(true);
        setError(null);

        try {
          const response =
            await fetch(
              `${API_URL}/public/storefront/products/${encodeURIComponent(
                productSlug
              )}?channel=WEBSITE`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",

                  "x-company-code":
                    COMPANY_CODE,
                },

                signal:
                  controller.signal,
              }
            );

          const result =
            await response.json();

          if (
            !response.ok ||
            result?.success !==
              true
          ) {
            throw new Error(
              result?.error
                ?.message ||
                result?.message ||
                "Unable to load recommended products."
            );
          }

          const data =
            result.data as
              PublicProductData;

          setProducts(
            Array.isArray(
              data.relatedProducts
            )
              ? data.relatedProducts
              : []
          );
        } catch (
          caughtError
        ) {
          if (
            caughtError instanceof
              DOMException &&
            caughtError.name ===
              "AbortError"
          ) {
            return;
          }

          setProducts([]);

          setError(
            caughtError instanceof
            Error
              ? caughtError.message
              : "Unable to load recommended products."
          );
        } finally {
          if (
            !controller.signal
              .aborted
          ) {
            setLoading(false);
          }
        }
      };

    load();

    return () => {
      controller.abort();
    };
  }, [
    productSlug,
  ]);

  if (!productSlug) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-storefront-text sm:text-3xl">
          Recommended for you
        </h2>

        {products.length ? (
          <span className="text-sm font-black text-storefront-primary">
            Based on your cart
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="flex min-h-52 items-center justify-center rounded-[22px] border border-storefront bg-white">
          <div className="flex items-center gap-3 text-sm font-bold text-storefront-muted">
            <LoaderCircle
              size={20}
              className="animate-spin"
            />

            Loading recommendations…
          </div>
        </div>
      ) : null}

      {!loading &&
      error ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-storefront bg-white px-6 text-center">
          <PackageSearch
            size={30}
            className="text-storefront-muted"
          />

          <p className="mt-3 text-sm font-black text-storefront-text">
            Recommendations are temporarily unavailable
          </p>

          <p className="mt-2 text-xs text-storefront-muted">
            {error}
          </p>
        </div>
      ) : null}

      {!loading &&
      !error &&
      products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {products
            .slice(0, 4)
            .map(
              (
                product
              ) => (
                <StorefrontProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                />
              )
            )}
        </div>
      ) : null}

      {!loading &&
      !error &&
      !products.length ? (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-dashed border-storefront bg-white px-6 text-center">
          <PackageSearch
            size={30}
            className="text-storefront-muted"
          />

          <p className="mt-3 text-sm font-black text-storefront-text">
            No related products found
          </p>

          <p className="mt-2 text-xs text-storefront-muted">
            Configure related products for the first cart product to populate this section.
          </p>
        </div>
      ) : null}
    </section>
  );
}
