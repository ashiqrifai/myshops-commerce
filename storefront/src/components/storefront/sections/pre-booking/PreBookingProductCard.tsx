import {
  CalendarDays,
  Heart,
  ImageIcon,
} from "lucide-react";

import StorefrontMoney from "@/components/storefront/money/StorefrontMoney";

import {
  formatDate,
} from "./preBooking.utils";

import type {
  PreBookingProduct,
  PreBookingSettings,
} from "./preBooking.utils";

interface PreBookingListingVariant {
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
}

export default function PreBookingProductCard({
  product,
  settings,
  listingVariant =
    null,
}: {
  product:
    PreBookingProduct;

  settings:
    PreBookingSettings;

  listingVariant?:
    | PreBookingListingVariant
    | null;
}) {
  const preBooking =
    product.preBooking;

  /*
  |--------------------------------------------------------------------------
  | Price
  |--------------------------------------------------------------------------
  */

  const currencyCode =
    listingVariant?.price
      ?.currencyCode ||
    product.price
      ?.currencyCode ||
    "AED";

  const bookingPrice =
    Number(
      preBooking
        ?.fullBookingPrice
    ) > 0
      ? Number(
          preBooking
            ?.fullBookingPrice
        )
      : listingVariant?.price
          ?.sellingPrice !=
        null
        ? Number(
            listingVariant
              .price
              ?.sellingPrice
          )
        : product.price
            ?.sellingPrice !=
          null
          ? Number(
              product.price
                .sellingPrice
            )
          : null;

  /*
  |--------------------------------------------------------------------------
  | Dates
  |--------------------------------------------------------------------------
  */

  const deadline =
    formatDate(
      preBooking
        ?.bookingEndAt
    );

  const launchDate =
    formatDate(
      preBooking
        ?.expectedLaunchAt
    );

  /*
  |--------------------------------------------------------------------------
  | Image
  |--------------------------------------------------------------------------
  */

  const variantImage =
    listingVariant
      ?.images
      ?.find(
        (
          image
        ) =>
          Boolean(
            image.mediaAsset
          )
      );

  const asset =
    variantImage
      ?.mediaAsset ||
    product.image
      ?.mediaAsset;

  const preferred =
    asset
      ?.variants
      ?.find(
        (
          item
        ) =>
          item.variantType ===
          "MEDIUM"
      ) ||
    asset
      ?.variants
      ?.find(
        (
          item
        ) =>
          item.variantType ===
          "SMALL"
      ) ||
    asset
      ?.variants
      ?.find(
        (
          item
        ) =>
          item.variantType ===
          "THUMBNAIL"
      ) ||
    asset
      ?.variants
      ?.find(
        (
          item
        ) =>
          item.isPrimary ===
          true
      );

  const imageUrl =
    preferred
      ?.publicUrl ||
    asset
      ?.publicUrl ||
    asset
      ?.previewUrl ||
    asset
      ?.thumbnailUrl ||
    null;

  /*
  |--------------------------------------------------------------------------
  | Display
  |--------------------------------------------------------------------------
  */

  const displayName =
    listingVariant
      ?.name ||
    product.name ||
    "Upcoming product";

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <article
      className="
        group
        relative
        flex
        h-[350px]
        min-w-0
        flex-col
        overflow-hidden
        rounded-xl
        border
        border-[#D8DDE3]
        bg-white
        transition
        duration-200
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      {/*
      |--------------------------------------------------------------------------
      | Top Row
      |--------------------------------------------------------------------------
      */}

      <div className="relative h-[36px] shrink-0">
        {settings.showAvailabilityBadge !==
        false ? (
          <span
            className="
              absolute
              left-2.5
              top-2
              z-20
              inline-flex
              h-[22px]
              items-center
              rounded-full
              border
              border-amber-200
              bg-amber-50
              px-2.5
              text-[9px]
              font-black
              uppercase
              leading-none
              tracking-[0.08em]
              text-amber-700
            "
          >
            Coming Soon
          </span>
        ) : null}

        <button
          type="button"
          aria-label="Add to wishlist"
          className="
            absolute
            right-2
            top-1
            z-20
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-[#111827]
            transition
            hover:bg-[#f6f6f7]
          "
        >
          <Heart
            size={
              17
            }
          />
        </button>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Image
      |--------------------------------------------------------------------------
      |
      | Temporarily not clickable while pre-booking is Coming Soon.
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          flex
          h-[120px]
          shrink-0
          items-center
          justify-center
          overflow-hidden
          bg-white
        "
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              imageUrl
            }
            alt={
              displayName
            }
            className="
              h-full
              w-full
              object-contain
              p-2
              transition
              duration-300
              group-hover:scale-[1.03]
            "
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-storefront-secondary">
            <ImageIcon
              size={
                26
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

      <div
        className="
          flex
          min-h-0
          flex-1
          flex-col
          px-3
          pt-2
        "
      >
        {/*
        |--------------------------------------------------------------------------
        | Brand
        |--------------------------------------------------------------------------
        */}

        <div className="h-[13px] shrink-0">
          {product.brand
            ?.name ? (
            <p
              className="
                truncate
                text-[9px]
                font-bold
                uppercase
                leading-[12px]
                tracking-[0.12em]
                text-[#28ABB5]
              "
            >
              {
                product
                  .brand
                  .name
              }
            </p>
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Name
        |--------------------------------------------------------------------------
        |
        | Temporarily plain text rather than a link.
        |--------------------------------------------------------------------------
        */}

        <div
          className="
            mt-1
            line-clamp-2
            min-h-[30px]
            text-[11px]
            font-bold
            leading-[15px]
            text-[#111111]
          "
        >
          {
            displayName
          }
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Booking / Launch Date
        |--------------------------------------------------------------------------
        */}

        <div className="mt-1.5 h-[18px] shrink-0">
          {settings.showBookingDeadline !==
            false &&
          deadline ? (
            <div
              className="
                flex
                items-center
                gap-1.5
                truncate
                text-[9px]
                leading-[13px]
                text-[#8c9196]
              "
            >
              <CalendarDays
                size={
                  11
                }
                className="shrink-0"
              />

              <span className="truncate">
                Booking opens soon
              </span>
            </div>
          ) : settings.showLaunchDate !==
              false &&
            launchDate ? (
            <div
              className="
                flex
                items-center
                gap-1.5
                truncate
                text-[9px]
                leading-[13px]
                text-[#8c9196]
              "
            >
              <CalendarDays
                size={
                  11
                }
                className="shrink-0"
              />

              <span className="truncate">
                Expected:{" "}

                <strong className="font-bold text-[#303030]">
                  {
                    launchDate
                  }
                </strong>
              </span>
            </div>
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Price
        |--------------------------------------------------------------------------
        */}

        <div className="mt-2 shrink-0">
          {bookingPrice !=
          null ? (
            <>
              <StorefrontMoney
                amount={
                  bookingPrice
                }
                currencyCode={
                  currencyCode
                }
                className="
                  text-[16px]
                  font-bold
                  leading-none
                  text-[#111111]
                "
              />

              <p
                className="
                  mt-1
                  text-[8px]
                  leading-[10px]
                  text-[#9ca3af]
                "
              >
                Pre-booking opening soon
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold text-storefront-muted">
              Price coming soon
            </p>
          )}
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Coming Soon Footer
      |--------------------------------------------------------------------------
      |
      | Deliberately non-clickable.
      |--------------------------------------------------------------------------
      */}

      <div
        className="
          shrink-0
          px-3
          pb-3
          pt-2
        "
      >
        <div
          className="
            flex
            h-10
            w-full
            items-center
            justify-center
            rounded-lg
            border
            border-amber-200
            bg-amber-50
            px-3
            text-[11px]
            font-black
            uppercase
            tracking-[0.08em]
            text-amber-700
          "
        >
          Coming Soon
        </div>
      </div>
    </article>
  );
}