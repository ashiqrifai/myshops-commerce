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
        publicUrl?:
          | string
          | null;

        previewUrl?:
          | string
          | null;

        thumbnailUrl?:
          | string
          | null;
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

  const maximumProducts =
    Math.max(
      1,
      Number(
        settings.maximumProducts ||
          8
      )
    );

  const products:
    PreBookingProduct[] =
    Array.isArray(
      content.productIdsResolved
    )
      ? content.productIdsResolved.slice(
          0,
          maximumProducts
        )
      : [];

  /*
   * Do not render campaigns that have
   * not started or have already closed.
   */
  if (
    content.bookingStatus ===
      "UPCOMING" ||
    content.bookingStatus ===
      "CLOSED" ||
    products.length === 0
  ) {
    return null;
  }

  const desktopImage =
    getResolvedAssetUrl(
      content.desktopAssetIdResolved
    );

  const mobileImage =
    getResolvedAssetUrl(
      content.mobileAssetIdResolved
    ) || desktopImage;

  const layout =
    settings.layout ||
    "SIDE_BANNER";

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
      0.85;

    scroller.scrollBy({
      left:
        direction === "left"
          ? -distance
          : distance,

      behavior: "smooth",
    });
  };

  const banner = (
    <div className="relative isolate min-h-[430px] overflow-hidden rounded-[18px] bg-slate-950 text-white">
      {desktopImage ? (
        <picture>
          {mobileImage ? (
            <source
              media="(max-width: 639px)"
              srcSet={mobileImage}
            />
          ) : null}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={desktopImage}
            alt={
              content.title ||
              "Pre-booking"
            }
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />

      <div className="relative z-10 flex min-h-[430px] flex-col justify-center p-7 sm:p-10">
        {content.badge ? (
          <span className="w-fit rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] backdrop-blur">
            {content.badge}
          </span>
        ) : null}

        <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-5xl">
          {content.title ||
            "Pre-Book Now"}
        </h2>

        {content.subtitle ? (
          <p className="mt-4 max-w-lg text-sm leading-6 text-white/90 sm:text-base">
            {content.subtitle}
          </p>
        ) : null}

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
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-slate-950 transition hover:bg-slate-100"
            >
              {
                content.buttonLabel
              }
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );

  const carousel = (
    <div className="min-w-0">
      {settings.showNavigation !==
      false ? (
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() =>
              scroll("left")
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 transition hover:bg-slate-100"
            aria-label="Previous pre-booking products"
          >
            <ChevronLeft
              size={19}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              scroll("right")
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 transition hover:bg-slate-100"
            aria-label="Next pre-booking products"
          >
            <ChevronRight
              size={19}
            />
          </button>
        </div>
      ) : null}

      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map(
          (product) => (
            <div
              key={product.id}
              className="basis-[86%] shrink-0 snap-start sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-0.75rem)]"
            >
              <PreBookingProductCard
                product={product}
                settings={settings}
              />
            </div>
          )
        )}
      </div>
    </div>
  );

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
      className="w-full py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {layout ===
        "PRODUCTS_ONLY" ? (
          carousel
        ) : layout ===
          "BANNER_TOP" ? (
          <div className="space-y-6">
            {banner}

            {carousel}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(320px,0.34fr)_minmax(0,0.66fr)]">
            {banner}

            <div className="min-w-0 rounded-[18px] border border-slate-200 bg-slate-50 p-4 sm:p-6">
              {carousel}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}