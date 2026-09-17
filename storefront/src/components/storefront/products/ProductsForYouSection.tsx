"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import StorefrontProductCard from "@/components/storefront/products/StorefrontProductCard";

import {
  getExistingStorefrontVisitorId,
} from "@/lib/storefront/storefront-visitor";

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface RecommendationBrand {
  id: string;
  name: string;
  slug?: string | null;
}

interface RecommendationCategory {
  id: string;
  name: string;
  slug?: string | null;
}

interface RecommendationMediaVariant {
  id: string;
  variantType: string;
  format?: string | null;
  mimeType?: string | null;
  width?: number | null;
  height?: number | null;
  isPrimary?: boolean;
  publicUrl: string;
}

interface RecommendationMediaAsset {
  id: string;

  title?: string | null;
  altText?: string | null;
  caption?: string | null;

  assetType?: string | null;
  classification?: string | null;
  mimeType?: string | null;

  width?: number | null;
  height?: number | null;

  orientation?: string | null;
  dominantColor?: string | null;

  publicUrl?: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;

  variants?: RecommendationMediaVariant[];
}

interface RecommendationImage {
  id: string;

  imageRole?: string | null;
  altText?: string | null;
  title?: string | null;

  mediaAsset?: RecommendationMediaAsset | null;
}

interface RecommendationVariant {
  id: string;

  sku: string;

  barcode?: string | null;

  name: string;

  isDefault?: boolean;
}

interface RecommendationPrice {
  id?: string;

  priceListId?: string;

  currencyCode?: string | null;

  isTaxInclusive?: boolean;

  sellingPrice?: number | null;
  regularPrice?: number | null;
  compareAtPrice?: number | null;
}

interface RecommendationAvailability {
  fulfillmentType?: string | null;

  inventoryTracked?: boolean;

  trackQuantity?: boolean;

  status?: string | null;

  quantity?: number | null;

  message?: string | null;
}

interface RecommendedProduct {
  id: string;

  name: string;

  slug: string;

  productType?: string | null;

  parentSku?: string | null;

  shortDescription?: string | null;

  isFeatured?: boolean;

  isDirectDelivery?: boolean;

  taxPercent?: number;

  brand?: RecommendationBrand | null;

  primaryCategory?: RecommendationCategory | null;

  image?: RecommendationImage | null;

  defaultVariant?: RecommendationVariant | null;

  price?: RecommendationPrice | null;

  availability?: RecommendationAvailability | null;

  productUrl?: string | null;
}

interface RecommendationPersonalization {
  hasHistory: boolean;

  activityCount?: number;

  topBrands?: Array<{
    id: string;
    score: number;
  }>;

  topCategories?: Array<{
    id: string;
    score: number;
  }>;

  topSearches?: Array<{
    query: string;
    score: number;
  }>;
}

interface RecommendationResponse {
  success: boolean;

  data?: {
    products?: RecommendedProduct[];

    personalization?: RecommendationPersonalization;

    meta?: {
      channel?: string;

      visitorId?: string | null;

      customerId?: string | null;

      generatedAt?: string;
    };
  };
}

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const API_BASE_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function ProductsForYouSection() {
  /*
  |--------------------------------------------------------------------------
  | References
  |--------------------------------------------------------------------------
  */

  const sectionRef =
    useRef<HTMLElement>(
      null
    );

  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [
    shouldLoad,
    setShouldLoad,
  ] =
    useState(false);

  const [
    products,
    setProducts,
  ] =
    useState<
      RecommendedProduct[]
    >([]);

  const [
    hasHistory,
    setHasHistory,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    failed,
    setFailed,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Scroll
  |--------------------------------------------------------------------------
  */

  const scroll = (
    direction:
      | "left"
      | "right"
  ) => {
    const node =
      scrollRef.current;

    if (!node) {
      return;
    }

    const distance =
      Math.max(
        300,
        node.clientWidth *
          0.85
      );

    node.scrollBy({
      left:
        direction ===
        "left"
          ? -distance
          : distance,

      behavior:
        "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Defer Recommendation Work
  |--------------------------------------------------------------------------
  |
  | Products For You is below the initial viewport.
  |
  | Do not start the recommendation request during the critical initial
  | homepage render.
  |
  | Start loading when this section comes within approximately 700px of
  | the viewport.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const node =
        sectionRef.current;

      if (!node) {
        return;
      }

      /*
       * Browser fallback.
       */

      if (
        typeof IntersectionObserver ===
        "undefined"
      ) {
        setShouldLoad(
          true
        );

        return;
      }

      const observer =
        new IntersectionObserver(
          (
            entries
          ) => {
            const entry =
              entries[0];

            if (
              !entry ||
              !entry.isIntersecting
            ) {
              return;
            }

            setShouldLoad(
              true
            );

            /*
             * Recommendation loading only
             * needs to be triggered once.
             */

            observer.disconnect();
          },
          {
            root:
              null,

            /*
             * Start shortly before the
             * customer reaches the section.
             */

            rootMargin:
              "700px 0px",

            threshold:
              0,
          }
        );

      observer.observe(
        node
      );

      return () => {
        observer.disconnect();
      };
    },
    []
  );

  /*
  |--------------------------------------------------------------------------
  | Load Recommendations
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      /*
       * Critical performance guard:
       *
       * Do not run recommendation API work
       * during initial homepage hydration.
       */

      if (!shouldLoad) {
        return;
      }

      let cancelled =
        false;

      const loadRecommendations =
        async () => {
          try {
            setLoading(
              true
            );

            setFailed(
              false
            );

            const visitorId =
              getExistingStorefrontVisitorId();

            /*
             * Brand-new visitor.
             *
             * Do not show fake personalization.
             */

            if (!visitorId) {
              if (
                !cancelled
              ) {
                setProducts(
                  []
                );

                setHasHistory(
                  false
                );

                setLoading(
                  false
                );
              }

              return;
            }

            /*
            |--------------------------------------------------------------------------
            | Recommendation API URL
            |--------------------------------------------------------------------------
            */

            const url =
              new URL(
                `${API_BASE_URL}/public/storefront/recommendations`
              );

            url.searchParams.set(
              "visitorId",
              visitorId
            );

            url.searchParams.set(
              "limit",
              "18"
            );

            url.searchParams.set(
              "channel",
              "WEBSITE"
            );

            /*
            |--------------------------------------------------------------------------
            | Request
            |--------------------------------------------------------------------------
            */

            const response =
              await fetch(
                url.toString(),
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

            if (
              !response.ok
            ) {
              throw new Error(
                `Recommendation request failed with HTTP ${response.status}`
              );
            }

            const payload =
              (
                await response
                  .json()
              ) as
                RecommendationResponse;

            if (
              !payload.success
            ) {
              throw new Error(
                "Recommendation API returned success=false."
              );
            }

            const returnedProducts =
              Array.isArray(
                payload.data
                  ?.products
              )
                ? payload.data
                    ?.products ||
                  []
                : [];

            const personalized =
              payload.data
                ?.personalization
                ?.hasHistory ===
              true;

            if (
              cancelled
            ) {
              return;
            }

            setProducts(
              returnedProducts
            );

            setHasHistory(
              personalized
            );
          } catch (
            error
          ) {
            console.error(
              "[Products For You]",
              error
            );

            if (
              !cancelled
            ) {
              setFailed(
                true
              );

              setProducts(
                []
              );

              setHasHistory(
                false
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        };

      void loadRecommendations();

      return () => {
        cancelled =
          true;
      };
    },
    [
      shouldLoad,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | Available Products Only
  |--------------------------------------------------------------------------
  |
  | Backend already filters stock.
  |
  | This is an additional frontend safeguard.
  |--------------------------------------------------------------------------
  */

  const visibleProducts =
    useMemo(
      () =>
        products.filter(
          (
            product
          ) => {
            if (
              !product.id ||
              !product.slug
            ) {
              return false;
            }

            if (
              product.availability
                ?.status ===
              "OUT_OF_STOCK"
            ) {
              return false;
            }

            return true;
          }
        ),
      [
        products,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Loading / Deferred Skeleton
  |--------------------------------------------------------------------------
  |
  | The section remains in the document so IntersectionObserver has a target.
  |
  | No recommendation request is made until shouldLoad becomes true.
  |--------------------------------------------------------------------------
  */

  if (
    !shouldLoad ||
    loading
  ) {
    return (
      <section
        ref={
          sectionRef
        }
        aria-label="Products For You"
        className="-mt-10 w-full pt-2 pb-0 sm:mt-0 sm:pt-6"
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <div className="h-6 w-44 animate-pulse rounded bg-gray-200" />

            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {Array.from({
              length:
                6,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className="overflow-hidden rounded-xl border border-gray-200 bg-white"
                >
                  <div className="aspect-square animate-pulse bg-gray-100" />

                  <div className="space-y-3 p-4">
                    <div className="h-4 animate-pulse rounded bg-gray-100" />

                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />

                    <div className="h-5 w-1/2 animate-pulse rounded bg-gray-200" />

                    <div className="h-9 animate-pulse rounded bg-gray-100" />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Hide Section
  |--------------------------------------------------------------------------
  |
  | Do not display Products For You if:
  |
  | - recommendation API failed
  | - visitor has no behavioral history
  | - no available products were returned
  |--------------------------------------------------------------------------
  */

  if (
    failed ||
    !hasHistory ||
    visibleProducts.length ===
      0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      ref={
        sectionRef
      }
      aria-labelledby="products-for-you-title"
      className="-mt-10 w-full pt-2 pb-0 sm:mt-0 sm:pt-6"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */}

        <div className="mb-4">
          <div className="min-w-0">
            <h2
              id="products-for-you-title"
              className="text-xl font-black tracking-tight text-storefront-text sm:text-[22px]"
            >
              Products For You
            </h2>

            <p className="mt-1.5 text-sm leading-5 text-storefront-muted">
              Recommended based on your interests
            </p>
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Carousel
        |--------------------------------------------------------------------------
        */}

        <div className="group/carousel relative">
          {/*
          |--------------------------------------------------------------------------
          | Left Arrow
          |--------------------------------------------------------------------------
          */}

          {visibleProducts.length >
          6 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "left"
                )
              }
              aria-label="Previous recommended products"
              className={[
                "absolute",
                "left-2",
                "top-1/2",
                "z-20",
                "-translate-y-1/2",

                "hidden",
                "h-10",
                "w-10",
                "items-center",
                "justify-center",

                "rounded-full",
                "border",
                "border-[#D1D5DB]",

                "bg-white/95",
                "text-black",

                "shadow-md",
                "backdrop-blur",

                "transition",
                "hover:scale-105",
                "hover:bg-white",

                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronLeft
                size={
                  20
                }
              />
            </button>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Product Scroller
          |--------------------------------------------------------------------------
          */}

          <div
            ref={
              scrollRef
            }
            className={[
              "flex",
              "snap-x",
              "snap-mandatory",
              "gap-3",
              "overflow-x-auto",
              "pb-0",
              "scroll-smooth",

              "sm:gap-4",
              "lg:gap-4",

              "[scrollbar-width:none]",
              "[-ms-overflow-style:none]",
              "[&::-webkit-scrollbar]:hidden",
            ].join(
              " "
            )}
          >
            {visibleProducts.map(
              (
                product
              ) => (
                <div
                  key={
                    product.id
                  }
                  className={[
                    "min-w-0",
                    "shrink-0",
                    "snap-start",

                    /*
                     * Mobile:
                     * approximately two cards.
                     */

                    "basis-[calc(50%-0.375rem)]",

                    /*
                     * Tablet:
                     * three cards.
                     */

                    "sm:basis-[calc(33.333%-0.75rem)]",

                    /*
                     * Desktop:
                     * exactly six cards visible.
                     */

                    "lg:basis-[calc((100%-5rem)/6)]",
                  ].join(
                    " "
                  )}
                >
                  <StorefrontProductCard
                    product={
                      product as never
                    }
                    showPrice={
                      true
                    }
                    showBrand={
                      true
                    }
                    showWishlist={
                      true
                    }
                    showAddToCart={
                      true
                    }
                  />
                </div>
              )
            )}
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Right Arrow
          |--------------------------------------------------------------------------
          */}

          {visibleProducts.length >
          6 ? (
            <button
              type="button"
              onClick={() =>
                scroll(
                  "right"
                )
              }
              aria-label="Next recommended products"
              className={[
                "absolute",
                "right-2",
                "top-1/2",
                "z-20",
                "-translate-y-1/2",

                "hidden",
                "h-10",
                "w-10",
                "items-center",
                "justify-center",

                "rounded-full",
                "border",
                "border-[#D1D5DB]",

                "bg-white/95",
                "text-black",

                "shadow-md",
                "backdrop-blur",

                "transition",
                "hover:scale-105",
                "hover:bg-white",

                "sm:flex",
              ].join(
                " "
              )}
            >
              <ChevronRight
                size={
                  20
                }
              />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}