import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ChevronRight,
  ImageIcon,
  PackageSearch,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getPublicPreBookingCampaign,
} from "@/lib/storefront/public-pre-booking-api";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

/*
|--------------------------------------------------------------------------
| Route Props
|--------------------------------------------------------------------------
*/

interface RouteProps {
  params:
    Promise<{
      campaignSlug:
        string;
    }>;
}

/*
|--------------------------------------------------------------------------
| Money
|--------------------------------------------------------------------------
*/

const money = (
  value:
    | number
    | null
    | undefined,

  currency =
    "AED"
) => {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",

      currency,

      maximumFractionDigits:
        2,
    }
  ).format(
    value
  );
};

/*
|--------------------------------------------------------------------------
| Date Formatter
|--------------------------------------------------------------------------
*/

const formatDate = (
  value:
    | string
    | null
    | undefined
) => {
  if (!value) {
    return null;
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-AE",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  ).format(
    date
  );
};

/*
|--------------------------------------------------------------------------
| Variant Image
|--------------------------------------------------------------------------
|
| Prefer the variant's own image.
|
| If no variant image exists, fall back to the parent product image.
|--------------------------------------------------------------------------
*/

const getVariantImageUrl = (
  variant:
    Record<
      string,
      any
    >,

  product:
    Record<
      string,
      any
    >
) => {
  const variantImages =
    Array.isArray(
      variant?.images
    )
      ? variant.images
      : [];

  const firstVariantImage =
    variantImages.find(
      (
        image:
          Record<
            string,
            any
          >
      ) =>
        Boolean(
          image?.mediaAsset
        )
    );

  const variantAsset =
    firstVariantImage
      ?.mediaAsset;

  if (
    variantAsset
  ) {
    const variants =
      Array.isArray(
        variantAsset
          .variants
      )
        ? variantAsset
            .variants
        : [];

    const preferred =
      variants.find(
        (
          item:
            Record<
              string,
              any
            >
        ) =>
          item
            ?.variantType ===
            "MEDIUM" &&
          item
            ?.publicUrl
      ) ||
      variants.find(
        (
          item:
            Record<
              string,
              any
            >
        ) =>
          item
            ?.variantType ===
            "SMALL" &&
          item
            ?.publicUrl
      ) ||
      variants.find(
        (
          item:
            Record<
              string,
              any
            >
        ) =>
          item
            ?.variantType ===
            "THUMBNAIL" &&
          item
            ?.publicUrl
      ) ||
      variants.find(
        (
          item:
            Record<
              string,
              any
            >
        ) =>
          item
            ?.isPrimary ===
            true &&
          item
            ?.publicUrl
      );

    return (
      preferred
        ?.publicUrl ||
      variantAsset
        .publicUrl ||
      variantAsset
        .previewUrl ||
      variantAsset
        .thumbnailUrl ||
      null
    );
  }

  const productAsset =
    product?.image
      ?.mediaAsset;

  return (
    productAsset
      ?.publicUrl ||
    productAsset
      ?.previewUrl ||
    productAsset
      ?.thumbnailUrl ||
    null
  );
};

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata({
  params,
}: RouteProps): Promise<Metadata> {
  try {
    const {
      campaignSlug,
    } =
      await params;

    const data =
      await getPublicPreBookingCampaign({
        slug:
          campaignSlug,

        channel:
          "WEBSITE",
      });

    return {
      title:
        `${data.campaign.name} | MyShops`,

      description:
        data.campaign
          .description ||
        `${data.campaign.name} coming soon at MyShops.`,

      openGraph: {
        type:
          "website",

        title:
          `${data.campaign.name} | MyShops`,

        description:
          data.campaign
            .description ||
          undefined,
      },
    };
  } catch {
    return {
      title:
        "Pre-Booking | MyShops",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Campaign Page
|--------------------------------------------------------------------------
*/

export default async function PreBookingCampaignPage({
  params,
}: RouteProps) {
  try {
    const {
      campaignSlug,
    } =
      await params;

    const [
      storefront,
      data,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getPublicPreBookingCampaign({
          slug:
            campaignSlug,

          channel:
            "WEBSITE",
        }),
      ]);

    /*
    |--------------------------------------------------------------------------
    | Global Storefront Sections
    |--------------------------------------------------------------------------
    */

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );

    const {
      campaign,
      products,
    } =
      data;

    /*
    |--------------------------------------------------------------------------
    | Campaign Dates
    |--------------------------------------------------------------------------
    */


    /*
    |--------------------------------------------------------------------------
    | Variant Cards
    |--------------------------------------------------------------------------
    |
    | Continue showing only variants that have been allocated for this
    | campaign.
    |
    | The booking action itself is temporarily disabled below.
    |--------------------------------------------------------------------------
    */

    const variantCards =
      products.flatMap(
        (
          product
        ) => {
          const variants =
            Array.isArray(
              product.variants
            )
              ? product.variants
              : [];

          return variants
            .filter(
              (
                variant
              ) =>
                variant
                  .allocationSummary
                  ?.isAvailable ===
                  true &&
                Number(
                  variant
                    .allocationSummary
                    ?.availableQuantity ||
                    0
                ) > 0
            )
            .map(
              (
                variant
              ) => ({
                product,
                variant,
              })
            );
        }
      );

    return (
      <StorefrontShell
        storefront={
          storefront
        }
      >
        <StorefrontHeader
          storefront={
            storefront
          }
          announcementSection={
            globalSections
              .announcementSection
          }
          headerSection={
            globalSections
              .headerSection
          }
          navigationSection={
            globalSections
              .navigationSection
          }
        />

        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {/*
            |--------------------------------------------------------------------------
            | Breadcrumb
            |--------------------------------------------------------------------------
            */}

            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              <Link
                href="/"
                className="hover:text-storefront-primary"
              >
                Home
              </Link>

              <ChevronRight
                size={
                  14
                }
                className="mx-1"
              />

              <span className="font-bold text-storefront-text">
                {
                  campaign.name
                }
              </span>
            </nav>

            {/*
            |--------------------------------------------------------------------------
            | Campaign Hero
            |--------------------------------------------------------------------------
            */}

            <section className="overflow-hidden rounded-[22px] bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
              <div className="max-w-4xl">
               

                <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  {
                    campaign.name
                  }
                </h1>

                {campaign.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/70">
                    {
                      campaign.description
                    }
                  </p>
                ) : null}

<div className="mt-5">
  <span className="inline-flex h-9 items-center rounded-full bg-amber-400 px-4 text-xs font-black uppercase text-slate-950">
    Coming Soon
  </span>
</div>

              </div>
            </section>

            {/*
            |--------------------------------------------------------------------------
            | Variant Listing
            |--------------------------------------------------------------------------
            */}

            <section className="py-8">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-storefront-text">
                  Coming Soon
                </h2>

               
              </div>

              {variantCards.length ===
              0 ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-storefront-border bg-white p-8 text-center">
                  <PackageSearch
                    size={
                      38
                    }
                    className="text-slate-400"
                  />

                  <h3 className="mt-4 text-lg font-black text-storefront-text">
                    Products coming soon
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-storefront-muted">
                    Pre-booking is not
                    open yet. Please
                    check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {variantCards.map(
                    ({
                      product,
                      variant,
                    }) => {
                      const imageUrl =
                        getVariantImageUrl(
                          variant,
                          product
                        );

                      const price =
                        product.priceOverride !==
                          null &&
                        product.priceOverride !==
                          undefined
                          ? Number(
                              product.priceOverride
                            )
                          : Number(
                              variant
                                .price
                                ?.sellingPrice ||
                                0
                            );

                      const currencyCode =
                        variant
                          .price
                          ?.currencyCode ||
                        product
                          .currencyCode ||
                        "AED";

                      return (
                        <article
                          key={
                            `${product.id}:${variant.id}`
                          }
                          className="group flex min-h-[390px] min-w-0 flex-col overflow-hidden rounded-xl border border-[#D8DDE3] bg-white transition duration-200 hover:shadow-md"
                        >
                          {/*
                          |--------------------------------------------------------------------------
                          | Badges
                          |--------------------------------------------------------------------------
                          */}

                          <div className="flex h-[42px] shrink-0 items-center justify-between gap-2 px-3 pt-2">
                            

                            <span className="inline-flex h-[23px] items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 text-[9px] font-black uppercase tracking-[0.06em] text-amber-700">
                              Coming Soon
                            </span>
                          </div>

                          {/*
                          |--------------------------------------------------------------------------
                          | Image
                          |--------------------------------------------------------------------------
                          |
                          | Deliberately not clickable while pre-booking is disabled.
                          |--------------------------------------------------------------------------
                          */}

                          <div className="flex h-[185px] shrink-0 items-center justify-center overflow-hidden bg-white px-4 py-2">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  variant.name ||
                                  product.name
                                }
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-storefront-secondary">
                                <ImageIcon
                                  size={
                                    28
                                  }
                                  className="text-storefront-muted"
                                />
                              </div>
                            )}
                          </div>

                          {/*
                          |--------------------------------------------------------------------------
                          | Product Information
                          |--------------------------------------------------------------------------
                          */}

                          <div className="flex flex-1 flex-col px-3 pb-3 pt-2">
                            {product
                              .brand
                              ?.name ? (
                              <p className="truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#28ABB5]">
                                {
                                  product
                                    .brand
                                    .name
                                }
                              </p>
                            ) : null}

                            {/*
                            |--------------------------------------------------------------------------
                            | Variant Name
                            |--------------------------------------------------------------------------
                            |
                            | Plain text while pre-booking is disabled.
                            |--------------------------------------------------------------------------
                            */}

                            <div className="mt-1 line-clamp-2 min-h-[36px] text-[12px] font-bold leading-[17px] text-[#111111]">
                              {
                                variant.name ||
                                product.name
                              }
                            </div>

                            {variant.sku ? (
                              <p className="mt-1 truncate text-[9px] text-storefront-muted">
                                SKU:{" "}
                                {
                                  variant.sku
                                }
                              </p>
                            ) : null}

                            {/*
                            |--------------------------------------------------------------------------
                            | Price + Coming Soon
                            |--------------------------------------------------------------------------
                            */}

                            <div className="mt-auto pt-3">
                              <p className="text-[9px] text-storefront-muted">
                                Expected price
                              </p>

                              <p className="mt-1 text-[17px] font-black leading-none text-[#111111]">
                                {price >
                                0
                                  ? money(
                                      price,
                                      currencyCode
                                    )
                                  : "Price coming soon"}
                              </p>

                              <p className="mt-2 text-[10px] font-bold text-amber-700">
                                Pre-booking
                                opening soon
                              </p>

                              {/*
                              |--------------------------------------------------------------------------
                              | Disabled Pre-Booking Action
                              |--------------------------------------------------------------------------
                              |
                              | There is deliberately no href here.
                              |--------------------------------------------------------------------------
                              */}

                              <button
                                type="button"
                                disabled
                                aria-disabled="true"
                                className="mt-3 flex h-10 w-full cursor-not-allowed items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-[11px] font-black uppercase tracking-[0.06em] text-amber-700"
                              >
                                Coming Soon
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        </main>

        <StorefrontFooter
          storefront={
            storefront
          }
        />
      </StorefrontShell>
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status ===
        404
    ) {
      notFound();
    }

    throw error;
  }
}