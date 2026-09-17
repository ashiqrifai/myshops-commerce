"use client";

import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  useRef,
} from "react";

import type {
  StorefrontSection,
} from "@/types/storefront";

import PreBookingCountdown from "./pre-booking/PreBookingCountdown";
import PreBookingProductCard from "./pre-booking/PreBookingProductCard";

import type {
  PreBookingContent,
  PreBookingProduct,
  PreBookingSettings,
} from "./pre-booking/preBooking.utils";

interface PreBookingSectionProps {
  section: StorefrontSection;
}

const getResolvedAssetUrl = (
  asset:
    | {
        publicUrl?: string | null;
        previewUrl?: string | null;
        thumbnailUrl?: string | null;
      }
    | null
    | undefined
): string | null => {
  if (!asset) {
    return null;
  }

  return (
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

export default function PreBookingSection({
  section,
}: PreBookingSectionProps) {
  const scrollerRef =
    useRef<HTMLDivElement>(
      null
    );

  const content =
    (section.content ||
      {}) as PreBookingContent;

  const settings =
    (section.settings ||
      {}) as PreBookingSettings;

  /*
  |--------------------------------------------------------------------------
  | Products
  |--------------------------------------------------------------------------
  */

  const maximumProducts =
    Math.max(
      1,
      Number(
        settings.maximumProducts ||
          8
      )
    );

  const sourceProducts:
    PreBookingProduct[] =
    Array.isArray(
      content.productIdsResolved
    )
      ? content.productIdsResolved
      : [];

  /*
  |--------------------------------------------------------------------------
  | Variant Cards
  |--------------------------------------------------------------------------
  |
  | A campaign may contain only a few parent products but many allocated
  | variants. Render every AVAILABLE allocated variant as its own carousel
  | card. The detail page remains the same parent product page; the variant
  | id is passed only as the initial selection.
  |--------------------------------------------------------------------------
  */

  type PreBookingListingVariant = {
    id: string;
  
    sku?:
      | string
      | null;
  
    name?:
      | string
      | null;
  
    images?: Array<{
      id?: string;
  
      mediaAsset?: {
        publicUrl?:
          | string
          | null;
  
        previewUrl?:
          | string
          | null;
  
        thumbnailUrl?:
          | string
          | null;
  
        variants?: Array<{
          variantType?:
            | string
            | null;
  
          publicUrl?:
            | string
            | null;
  
          isPrimary?:
            boolean;
        }>;
      } | null;
    }>;
  
    price?: {
      currencyCode?:
        | string
        | null;
  
      sellingPrice?:
        | number
        | null;
    } | null;
  
    allocationSummary?: {
      availableQuantity?:
        number;
  
      isAvailable?:
        boolean;
    } | null;
  };
  
  type PreBookingVariantCard = {
    key:
      string;
  
    product:
      PreBookingProduct;
  
    variant:
      PreBookingListingVariant |
      null;
  };
  
  /*
  |--------------------------------------------------------------------------
  | Variant Cards
  |--------------------------------------------------------------------------
  |
  | Each available allocated variant becomes its own carousel card.
  |
  | The underlying product remains the parent product. The variant ID is only
  | used to preselect the correct storage/color combination on the detail page.
  |--------------------------------------------------------------------------
  */
  
  const productCards:
    PreBookingVariantCard[] =
    sourceProducts
      .reduce<
        PreBookingVariantCard[]
      >(
        (
          cards,
          product
        ) => {
          const productWithVariants =
            product as PreBookingProduct & {
              variants?:
                PreBookingListingVariant[];
            };
  
          const variants =
            Array.isArray(
              productWithVariants
                .variants
            )
              ? productWithVariants
                  .variants
              : [];
  
          /*
          |--------------------------------------------------------------------------
          | Only Available Allocated Variants
          |--------------------------------------------------------------------------
          */
  
          const availableVariants =
            variants.filter(
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
                ) >
                  0
            );
  
          /*
          |--------------------------------------------------------------------------
          | Variant Cards
          |--------------------------------------------------------------------------
          */
  
          if (
            availableVariants.length >
            0
          ) {
            for (
              const variant of
              availableVariants
            ) {
              cards.push({
                key:
                  `${product.id}:${variant.id}`,
  
                product,
  
                variant,
              });
            }
  
            return cards;
          }
  
          /*
          |--------------------------------------------------------------------------
          | Parent Product Fallback
          |--------------------------------------------------------------------------
          |
          | If the CMS resolver does not provide variants for this product,
          | preserve the existing parent-product card.
          |--------------------------------------------------------------------------
          */
  
          cards.push({
            key:
              String(
                product.id
              ),
  
            product,
  
            variant:
              null,
          });
  
          return cards;
        },
        []
      )
      .slice(
        0,
        maximumProducts
      );

  const products =
    sourceProducts;

  /*
  |--------------------------------------------------------------------------
  | Visibility
  |--------------------------------------------------------------------------
  */

  if (
    content.bookingStatus ===
      "UPCOMING" ||
    content.bookingStatus ===
      "CLOSED" ||
    content.bookingStatus ===
      "UNAVAILABLE" ||
    productCards.length === 0
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Images
  |--------------------------------------------------------------------------
  */

  const desktopImage =
    getResolvedAssetUrl(
      content.desktopAssetIdResolved
    );

  const mobileImage =
    getResolvedAssetUrl(
      content.mobileAssetIdResolved
    ) || desktopImage;

  /*
  |--------------------------------------------------------------------------
  | Layout
  |--------------------------------------------------------------------------
  */

  const layout =
    settings.layout ||
    "SIDE_BANNER";

  /*
  |--------------------------------------------------------------------------
  | Carousel Scroll
  |--------------------------------------------------------------------------
  */

  const scroll = (
    direction:
      | "left"
      | "right"
  ) => {
    const scroller =
      scrollerRef.current;

    if (!scroller) {
      return;
    }

    const distance =
      scroller.clientWidth *
      0.9;

    scroller.scrollBy({
      left:
        direction === "left"
          ? -distance
          : distance,

      behavior:
        "smooth",
    });
  };

  /*
  |--------------------------------------------------------------------------
  | Banner
  |--------------------------------------------------------------------------
  */

  const banner = (
    <div
      className="
        relative
        isolate
        h-full
        min-h-[420px]
        overflow-hidden
        rounded-[18px]
        bg-[#02030a]
        text-white

        lg:min-h-0
      "
    >
      {desktopImage ? (
        <picture>
          {mobileImage ? (
            <source
              media="(max-width: 639px)"
              srcSet={
                mobileImage
              }
            />
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={
              desktopImage
            }
            alt={
              content.title ||
              "Pre-booking"
            }
            className="
              absolute
              inset-0
              h-full
              w-full
              object-cover
            "
          />
        </picture>
      ) : null}

      {/*
       * Dark overlay keeps text readable
       * while still allowing banner artwork
       * to remain visible.
       */}
      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-black/85
          via-black/60
          to-black/10
        "
      />

      <div
        className="
          relative
          z-10
          flex
          h-full
          min-h-[420px]
          flex-col
          justify-center
          p-7

          sm:p-8
          lg:min-h-0
          lg:p-8
        "
      >
        {/* Badge */}

        {content.badge ? (
          <span
            className="
              w-fit
              rounded-full
              border
              border-white/25
              bg-white/10
              px-3
              py-1
              text-[10px]
              font-bold
              uppercase
              tracking-[0.16em]
              backdrop-blur-sm
            "
          >
            {
              content.badge
            }
          </span>
        ) : null}

        {/* Title */}

        <h2
          className="
            mt-4
            max-w-[390px]
            text-[26px]
            font-bold
            leading-[1.08]
            tracking-tight

            xl:text-[38px]
          "
        >
          {content.title ||
            "Pre-Book the Latest Devices"}
        </h2>

        {/* Subtitle */}

        {content.subtitle ? (
          <p
            className="
              mt-4
              max-w-[390px]
              text-sm
              leading-6
              text-white/80
            "
          >
            {
              content.subtitle
            }
          </p>
        ) : null}

        {/* Countdown */}

        {settings.showCountdown !==
        false ? (
          <div className="mt-6">
            <PreBookingCountdown
              endAt={
                content.bookingEndAt ||
                null
              }
            />
          </div>
        ) : null}

        {/* CTA */}

        {content.buttonLabel &&
        content.buttonUrl ? (
          <div className="mt-7">
            <Link
              href={
                content.buttonUrl
              }
              target={
                content.openInNewTab
                  ? "_blank"
                  : undefined
              }
              rel={
                content.openInNewTab
                  ? "noopener noreferrer"
                  : undefined
              }
              className="
                inline-flex
                min-h-11
                items-center
                justify-center
                rounded-full
                bg-white
                px-6
                text-sm
                font-bold
                text-[#111111]
                transition
                hover:bg-[#f2f2f2]
              "
            >
              {
                content.buttonLabel
              }

              <ChevronRight
                size={
                  16
                }
                className="ml-2"
              />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Carousel
  |--------------------------------------------------------------------------
  */

  const carousel = (
    <div
      className="
        relative
        flex
        h-full
        min-w-0
        flex-col
      "
    >
      {/* Navigation */}

      {settings.showNavigation !==
      false ? (
        <div className="mb-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              scroll(
                "left"
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border
              border-[#D8DDE3]
              bg-white
              text-[#202223]
              transition
              hover:bg-[#f6f6f7]
            "
            aria-label="Previous pre-booking products"
          >
            <ChevronLeft
              size={
                17
              }
            />
          </button>

          <button
            type="button"
            onClick={() =>
              scroll(
                "right"
              )
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              border
              border-[#D8DDE3]
              bg-white
              text-[#202223]
              transition
              hover:bg-[#f6f6f7]
            "
            aria-label="Next pre-booking products"
          >
            <ChevronRight
              size={
                17
              }
            />
          </button>
        </div>
      ) : null}

      {/* Cards */}

      <div
        ref={
          scrollerRef
        }
        className="
          flex
          flex-1
          snap-x
          snap-mandatory
          items-start
          gap-3
          overflow-x-auto
          overflow-y-visible
          pb-2
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        {productCards.map(
          (
            card
          ) => (
            <div
              key={
                card.key
              }
              className="
                w-[210px]
                shrink-0
                snap-start

                sm:w-[215px]
                lg:w-[220px]
              "
            >
              <PreBookingProductCard
                product={
                  card.product
                }
                listingVariant={
                  card.variant
                }
                settings={
                  settings
                }
              />
            </div>
          )
        )}
      </div>
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <section
      data-section-id={
        section.id
      }
      data-section-code={
        section.code
      }
      data-section-type={
        section.type.code
      }
      className="
        w-full
        py-6

        sm:py-7
        lg:py-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1440px]
          px-4

          sm:px-6
          lg:px-8
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Products Only
        |--------------------------------------------------------------------------
        */}

        {layout ===
"PRODUCTS_ONLY" ? (
  <div className="space-y-4">
    {/*
    |--------------------------------------------------------------------------
    | Products-Only Header
    |--------------------------------------------------------------------------
    |
    | In PRODUCTS_ONLY mode there is no banner, so the CMS title and
    | subtitle must be rendered independently above the product carousel.
    |--------------------------------------------------------------------------
    */}

    {(content.title ||
      content.subtitle) ? (
      <div
        className="
          flex
          flex-col
          gap-1
        "
      >
        {content.title ? (
          <h2
            className="
              text-[24px]
              font-bold
              leading-tight
              tracking-tight
              text-[#202223]

              sm:text-[28px]
              lg:text-[30px]
            "
          >
            {
              content.title
            }
          </h2>
        ) : null}

        {content.subtitle ? (
          <p
            className="
              max-w-[760px]
              text-sm
              leading-6
              text-[#6D7175]

              sm:text-[15px]
            "
          >
            {
              content.subtitle
            }
          </p>
        ) : null}
      </div>
    ) : null}

    {/*
    |--------------------------------------------------------------------------
    | Product Carousel
    |--------------------------------------------------------------------------
    */}

    <div
      className="
        rounded-[18px]
        border
        border-[#D8DDE3]
        bg-[#f8fafc]
        p-4

        sm:p-5
      "
    >
      {
        carousel
      }
    </div>
  </div>
) : layout ===
          "BANNER_TOP" ? (
          /*
          |--------------------------------------------------------------------------
          | Banner Top
          |--------------------------------------------------------------------------
          */

          <div className="space-y-4">
            <div className="h-[420px]">
              {
                banner
              }
            </div>

            <div
              className="
                rounded-[18px]
                border
                border-[#D8DDE3]
                bg-[#f8fafc]
                p-4

                sm:p-5
              "
            >
              {
                carousel
              }
            </div>
          </div>
        ) : (
          /*
          |--------------------------------------------------------------------------
          | Side Banner
          |--------------------------------------------------------------------------
          |
          | Compact desktop layout:
          |
          | Banner = ~34%
          | Products = ~66%
          |
          | Height is intentionally 475px so:
          |
          | - navigation fits
          | - 335px card fits fully
          | - bottom button is not clipped
          |--------------------------------------------------------------------------
          */

          <div
            className="
              grid
              overflow-hidden
              rounded-[18px]
              border
              border-[#D8DDE3]
              bg-[#f8fafc]

              lg:h-[475px]
              lg:grid-cols-[minmax(360px,34%)_minmax(0,66%)]
            "
          >
            {/* Banner */}

            <div className="min-w-0">
              {
                banner
              }
            </div>

            {/* Products */}

            <div
              className="
                min-w-0
                p-4

                sm:p-5
                lg:p-5
              "
            >
              {
                carousel
              }
            </div>
          </div>
        )}
      </div>
    </section>
  );
}