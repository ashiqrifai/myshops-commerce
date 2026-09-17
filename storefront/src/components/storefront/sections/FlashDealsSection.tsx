"use client";

import {
  useState,
} from "react";

import FlashDealBanner from "./flash-deals/FlashDealBanner";
import FlashDealCarousel from "./flash-deals/FlashDealCarousel";

import type {
  FlashDealsContent,
  FlashDealsSettings,
} from "./flash-deals/flashDeals.utils";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface FlashDealsSectionProps {
  section:
    StorefrontSection;
}

export default function FlashDealsSection({
  section,
}: FlashDealsSectionProps) {
  const content =
    (section.content ||
      {}) as FlashDealsContent;

  const settings =
    (section.settings ||
      {}) as FlashDealsSettings;

  const [
    expired,
    setExpired,
  ] = useState(
    content.dealStatus ===
      "ENDED"
  );

  const hideWhenExpired =
    settings.hideWhenExpired !==
    false;

  if (
    expired &&
    hideWhenExpired
  ) {
    return null;
  }

  if (
    content.dealStatus ===
    "UPCOMING"
  ) {
    return null;
  }

  const layout =
    settings.layout ||
    "BANNER_TOP";

  const onExpired = () =>
    setExpired(true);

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
        pt-4
        pb-6
        sm:pt-5
        sm:pb-7
        lg:pt-6
        lg:pb-8
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
        {expired &&
        !hideWhenExpired ? (
          /*
          |--------------------------------------------------------------------------
          | Expired
          |--------------------------------------------------------------------------
          */

          <div className="rounded-2xl border border-storefront-border-light bg-storefront-surface p-8 text-center">
            <p className="text-lg font-bold text-storefront-text">
              This offer has ended
            </p>
          </div>
        ) : layout ===
          "SIDE_BANNER" ? (
          /*
          |--------------------------------------------------------------------------
          | Side Banner
          |--------------------------------------------------------------------------
          */

          <div className="grid gap-5 lg:grid-cols-[minmax(280px,0.34fr)_minmax(0,0.66fr)]">
            <FlashDealBanner
              content={
                content
              }
              settings={
                settings
              }
              compact
              onExpired={
                onExpired
              }
            />

            <div className="min-w-0 rounded-2xl border border-storefront-border-light bg-storefront-surface p-4 sm:p-6">
              <FlashDealCarousel
                content={
                  content
                }
                settings={
                  settings
                }
              />
            </div>
          </div>
        ) : layout ===
          "BACKGROUND_BANNER" ? (
          /*
          |--------------------------------------------------------------------------
          | Compact Background Banner
          |--------------------------------------------------------------------------
          |
          | Target appearance:
          |
          | Desktop  : ~215px
          | Tablet   : ~205px
          | Mobile   : ~190px
          |
          | We also pass `compact` to FlashDealBanner so the
          | title, CTA and timer use the compact internal layout.
          |
          | No blur is applied to the image.
          |--------------------------------------------------------------------------
          */

          <div className="overflow-visible rounded-2xl">
            <div
              className="
                h-[190px]
                overflow-hidden
                rounded-2xl

                sm:h-[195px]
                md:h-[205px]
                lg:h-[215px]

                [&>*]:h-full
                [&>*]:min-h-0
              "
            >
              <FlashDealBanner
                content={
                  content
                }
                settings={
                  settings
                }
                compact
                onExpired={
                  onExpired
                }
              />
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Product Panel
            |--------------------------------------------------------------------------
            |
            | Slight overlap with banner, like the reference image.
            |--------------------------------------------------------------------------
            */}

            <div
              className="
                relative
                z-20

                mx-3
                -mt-4

                rounded-2xl
                border
                border-storefront-border-light

                bg-storefront-surface

                p-4
                shadow-lg

                sm:mx-6
                sm:-mt-5
                sm:p-6

                lg:mx-10
                lg:-mt-6
              "
            >
              <FlashDealCarousel
                content={
                  content
                }
                settings={
                  settings
                }
              />
            </div>
          </div>
        ) : (
          /*
          |--------------------------------------------------------------------------
          | Standard Banner Top
          |--------------------------------------------------------------------------
          */

          <div className="space-y-4">
            <FlashDealBanner
              content={
                content
              }
              settings={
                settings
              }
              onExpired={
                onExpired
              }
            />

            <div className="rounded-2xl border border-storefront-border-light bg-storefront-surface p-4 sm:p-6">
              <FlashDealCarousel
                content={
                  content
                }
                settings={
                  settings
                }
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}