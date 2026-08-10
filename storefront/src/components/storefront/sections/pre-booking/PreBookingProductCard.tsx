import Link from "next/link";

import {
  CalendarDays,
  WalletCards,
} from "lucide-react";

import {
  formatDate,
  formatMoney,
} from "./preBooking.utils";

import type {
  PreBookingProduct,
  PreBookingSettings,
} from "./preBooking.utils";

export default function PreBookingProductCard({
  product,
  settings,
}: {
  product:
    PreBookingProduct;

  settings:
    PreBookingSettings;
}) {
  const preBooking =
    product.preBooking;

  const currency =
    product.price
      ?.currencyCode ||
    "AED";

  const deposit =
    formatMoney(
      preBooking
        ?.depositAmount,
      currency
    );

    const bookingPrice =
    Number(
      preBooking?.fullBookingPrice
    ) > 0
      ? preBooking?.fullBookingPrice
      : product.price?.sellingPrice;
  
  const fullPrice =
    formatMoney(
      bookingPrice,
      currency
    );

    
  const launchDate =
    formatDate(
      preBooking
        ?.expectedLaunchAt
    );

  const deadline =
    formatDate(
      preBooking
        ?.bookingEndAt
    );

    const mediaAsset =
  product.image?.mediaAsset;

const preferredVariant =
  mediaAsset?.variants?.find(
    (variant) =>
      variant.isPrimary === true &&
      Boolean(variant.publicUrl)
  ) ||
  mediaAsset?.variants?.find(
    (variant) =>
      [
        "MEDIUM",
        "SMALL",
        "THUMBNAIL",
        "PREVIEW",
        "ORIGINAL",
      ].includes(
        String(
          variant.variantType || ""
        ).toUpperCase()
      ) &&
      Boolean(variant.publicUrl)
  ) ||
  mediaAsset?.variants?.find(
    (variant) =>
      Boolean(variant.publicUrl)
  );

const imageUrl =
  preferredVariant?.publicUrl ||
  mediaAsset?.previewUrl ||
  mediaAsset?.thumbnailUrl ||
  mediaAsset?.publicUrl ||
  null;

  const productHref =
    `/products/${
      product.slug ||
      product.id
    }`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={productHref}
        className="block"
      >
        <div className="relative aspect-square bg-slate-50">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={
                product.name ||
                "Pre-booking product"
              }
              className="h-full w-full object-contain p-5"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              No image
            </div>
          )}

          {settings.showAvailabilityBadge !==
          false ? (
            <span className="absolute left-3 top-3 rounded-full bg-[#111827] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white">
              Pre-Book
            </span>
          ) : null}
        </div>
      </Link>

      <div className="p-4">
        {product.brand?.name ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#28ABB5]">
            {product.brand.name}
          </p>
        ) : null}

        <Link
          href={productHref}
          className="mt-1 line-clamp-2 block min-h-12 text-base font-bold text-slate-950"
        >
          {product.name ||
            "Upcoming product"}
        </Link>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          {settings.showLaunchDate !==
            false &&
          launchDate ? (
            <div className="flex items-center gap-2">
              <CalendarDays
                size={15}
              />

              <span>
                Expected launch:{" "}
                <strong>
                  {launchDate}
                </strong>
              </span>
            </div>
          ) : null}

          {settings.showBookingDeadline !==
            false &&
          deadline ? (
            <div className="flex items-center gap-2">
              <CalendarDays
                size={15}
              />

              <span>
                Booking closes:{" "}
                <strong>
                  {deadline}
                </strong>
              </span>
            </div>
          ) : null}

          {settings.showDeposit !==
            false &&
          deposit ? (
            <div className="flex items-center gap-2">
              <WalletCards
                size={15}
              />

              <span>
                Deposit:{" "}
                <strong>
                  {deposit}
                </strong>
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-4">
          {deposit ? (
            <p className="text-sm text-slate-500">
              Reserve from
            </p>
          ) : null}

          <p className="text-xl font-black text-slate-950">
            {deposit ||
              fullPrice ||
              "Register interest"}
          </p>
        </div>

        <Link
          href={productHref}
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#28ABB5] px-4 text-sm font-bold text-white transition hover:opacity-90"
        >
          Pre-book now
        </Link>
      </div>
    </article>
  );
}
