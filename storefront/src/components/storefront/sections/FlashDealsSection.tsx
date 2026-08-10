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
  section: StorefrontSection;
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
      className="w-full py-8 sm:py-10 lg:py-12"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {expired &&
        !hideWhenExpired ? (
          <div className="rounded-2xl border border-storefront bg-storefront-surface p-8 text-center">
            <p className="text-lg font-black text-storefront-text">
              This offer has ended
            </p>
          </div>
        ) : layout ===
          "SIDE_BANNER" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.34fr)_minmax(0,0.66fr)]">
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

            <div className="min-w-0 rounded-2xl border border-storefront bg-storefront-surface p-4 sm:p-6">
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
          <div className="overflow-hidden rounded-2xl">
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

            <div
              className="-mt-10 relative z-20 mx-3 rounded-2xl border border-storefront bg-storefront-surface p-4 shadow-xl sm:mx-6 sm:p-6 lg:mx-10"
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
          <div className="space-y-6">
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

            <div className="rounded-2xl border border-storefront bg-storefront-surface p-4 sm:p-6">
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
