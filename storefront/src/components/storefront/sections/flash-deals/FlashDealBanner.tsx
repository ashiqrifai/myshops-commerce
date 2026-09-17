"use client";

import Link from "next/link";

import FlashDealCountdown from "./FlashDealCountdown";

import {
  getMediaUrl,
  getTextAlignmentClass,
} from "./flashDeals.utils";

import type {
  FlashDealsContent,
  FlashDealsSettings,
} from "./flashDeals.utils";

interface FlashDealBannerProps {
  content:
    FlashDealsContent;

  settings:
    FlashDealsSettings;

  compact?:
    boolean;

  onExpired?:
    () => void;
}

export default function FlashDealBanner({
  content,
  settings,
  compact = false,
  onExpired,
}: FlashDealBannerProps) {
  const desktopImage =
    getMediaUrl(
      content.desktopAssetIdResolved
    );

  const mobileImage =
    getMediaUrl(
      content.mobileAssetIdResolved
    );

  const backgroundColor =
    settings.backgroundColor ||
    "#111827";

  const textColor =
    settings.textColor ||
    "#FFFFFF";

  const overlayColor =
    settings.overlayColor ||
    "#000000";

    const overlayOpacity =
    Math.min(
      100,
      Math.max(
        0,
        Number(
          settings.overlayOpacity ??
            35
        )
      )
    );

  const alignmentClass =
    getTextAlignmentClass(
      settings.contentAlignment
    );

  const showBadge =
    settings.showBadge !==
    false;

  const showTitle =
    settings.showTitle !==
    false;

  const showSubtitle =
    settings.showSubtitle !==
    false;

  const showButton =
    settings.showButton !==
    false;

  const showCountdown =
    settings.showCountdown !==
    false;

  const buttonUrl =
    content.buttonUrl ||
    "/products";

  const buttonLabel =
    content.buttonLabel ||
    "Shop Now";

  const hasTextContent =
    (
      showBadge &&
      Boolean(
        content.badge
      )
    ) ||
    showTitle ||
    (
      showSubtitle &&
      Boolean(
        content.subtitle
      )
    ) ||
    (
      showButton &&
      Boolean(
        buttonLabel
      )
    );

  return (
    <div
      className={[
        "relative",
        "isolate",
        "overflow-hidden",
        "rounded-2xl",

       compact
          ? "w-full h-[300px] sm:aspect-[16/5] sm:h-auto min-h-0"
          : [
              "min-h-[300px]",
              "sm:min-h-[340px]",
              "lg:min-h-[360px]",
            ].join(
              " "
            ),
      ].join(
        " "
      )}
      style={{
        backgroundColor,
        color:
          textColor,
      }}
    >
      {/*
      |--------------------------------------------------------------------------
      | Background Image
      |--------------------------------------------------------------------------
      |
      | Mobile:
      | move image further right so artwork remains visible
      |
      | Desktop:
      | slightly more centered
      |--------------------------------------------------------------------------
      */}

      {desktopImage ||
      mobileImage ? (
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
    desktopImage ||
    mobileImage ||
    ""
  }
  alt={
    content.title ||
    "Flash Deals"
  }
  className="
  absolute
  inset-0
  h-full
  w-full

  object-cover
  object-[72%_center]

  sm:object-center
"
/>
        </picture>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | Overlay
      |--------------------------------------------------------------------------
      |
      | No blur.
      |--------------------------------------------------------------------------
      */}

      <div
        className="absolute inset-0"
        style={{
          backgroundColor:
            overlayColor,

          opacity:
            overlayOpacity /
            100,
        }}
      />

      {compact ? (
        /*
        |--------------------------------------------------------------------------
        | Compact Responsive Layout
        |--------------------------------------------------------------------------
        */

        <div
          className="
            relative
            z-10

            flex
            h-full
            min-h-0
            flex-col

            justify-center

            px-4
            py-3

            sm:px-6
            sm:py-4

            md:px-7

            lg:px-10
            lg:py-4
          "
        >
          {/*
          |--------------------------------------------------------------------------
          | Badge
          |--------------------------------------------------------------------------
          */}

          {showBadge &&
          content.badge ? (
            <span
              className="
                inline-flex
                w-fit

                rounded-full
                border
                border-white/25

                bg-white/15

                px-2.5
                py-1

                text-[9px]
                font-bold
                uppercase
                tracking-[0.14em]

                sm:px-3
                sm:text-[10px]

                lg:text-[11px]
              "
            >
              {
                content.badge
              }
            </span>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Title
          |--------------------------------------------------------------------------
          */}

          {showTitle ? (
            <h2
              className={[
                "max-w-xl",
                "font-bold",
                "tracking-tight",

                showBadge &&
                content.badge
                  ? "mt-1.5 sm:mt-2"
                  : "",

                /*
                 * Responsive compact title
                 */
                "text-[22px]",
                "leading-[1.05]",

                "sm:text-[26px]",
                "md:text-[30px]",
                "lg:text-[32px]",
              ].join(
                " "
              )}
            >
              {content.title ||
                "Flash Deals"}
            </h2>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Subtitle
          |--------------------------------------------------------------------------
          */}

          {showSubtitle &&
          content.subtitle ? (
            <p
              className="
                mt-1
                max-w-lg

                text-[10px]
                leading-4

                opacity-90

                sm:text-xs

                lg:text-sm
              "
            >
              {
                content.subtitle
              }
            </p>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | CTA + Countdown
          |--------------------------------------------------------------------------
          |
          | MOBILE:
          |
          | Shop Now
          | [timer horizontally scrollable if needed]
          |
          | SM+:
          |
          | Shop Now   [timer]
          |--------------------------------------------------------------------------
          */}

          {(showButton ||
            showCountdown) ? (
            <div
              className="
                mt-3

                flex
                min-w-0

                flex-col
                items-start

                gap-2

                sm:mt-3
                sm:flex-row
                sm:items-center
                sm:gap-3

                lg:mt-4
                lg:gap-4
              "
            >
              {/*
              |--------------------------------------------------------------------------
              | Shop Now
              |--------------------------------------------------------------------------
              */}

              {showButton &&
              buttonLabel ? (
                <Link
                  href={
                    buttonUrl
                  }
                  target={
                    content.openInNewTab
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    content.openInNewTab
                      ? "noreferrer"
                      : undefined
                  }
                  className="
                    inline-flex

                    h-9
                    shrink-0

                    items-center
                    justify-center

                    rounded-full
                    bg-white

                    px-4

                    text-[11px]
                    font-bold
                    text-[#111827]

                    shadow-sm

                    transition

                    hover:-translate-y-0.5
                    hover:shadow-md

                    sm:h-10
                    sm:px-5
                    sm:text-xs

                    lg:h-11
                    lg:px-6
                    lg:text-sm
                  "
                >
                  {
                    buttonLabel
                  }
                </Link>
              ) : null}

              {/*
              |--------------------------------------------------------------------------
              | Countdown
              |--------------------------------------------------------------------------
              |
              | On mobile:
              | timer is allowed to scroll horizontally instead of wrapping.
              |--------------------------------------------------------------------------
              */}

              {showCountdown ? (
                <div
                  className="
                    w-full
                    min-w-0

                    overflow-x-auto
                    overflow-y-hidden

                    pb-1

                    sm:w-auto
                    sm:max-w-[calc(100%-120px)]

                    [scrollbar-width:none]
                    [-ms-overflow-style:none]
                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  <div className="w-max">
                    <FlashDealCountdown
                      endAt={
                        content.endAt ||
                        null
                      }
                      textColor={
                        textColor
                      }
                      onExpired={
                        onExpired
                      }
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : (
        /*
        |--------------------------------------------------------------------------
        | Standard Large Banner
        |--------------------------------------------------------------------------
        */

        <>
          {hasTextContent ? (
            <div
              className={[
                "relative",
                "z-10",

                "flex",
                "min-h-[300px]",
                "flex-col",
                "justify-center",

                "p-6",

                "sm:min-h-[340px]",
                "sm:p-8",

                "lg:min-h-[360px]",
                "lg:p-10",

                showCountdown
                  ? "pb-28 sm:pb-30 lg:pb-28"
                  : "",

                alignmentClass,
              ].join(
                " "
              )}
            >
              {showBadge &&
              content.badge ? (
                <span
                  className="
                    inline-flex
                    w-fit

                    rounded-full
                    border
                    border-white/20

                    bg-white/15

                    px-3
                    py-1

                    text-xs
                    font-bold
                    uppercase
                    tracking-[0.15em]
                  "
                >
                  {
                    content.badge
                  }
                </span>
              ) : null}

              {showTitle ? (
                <h2
                  className={[
                    "max-w-3xl",
                    "font-bold",
                    "tracking-tight",

                    showBadge &&
                    content.badge
                      ? "mt-4"
                      : "",

                    "text-3xl",
                    "sm:text-5xl",
                    "lg:text-6xl",
                  ].join(
                    " "
                  )}
                >
                  {content.title ||
                    "Flash Deals"}
                </h2>
              ) : null}

              {showSubtitle &&
              content.subtitle ? (
                <p
                  className={[
                    "max-w-2xl",
                    "text-sm",
                    "font-normal",
                    "leading-6",
                    "opacity-90",
                    "sm:text-lg",

                    showTitle ||
                    (
                      showBadge &&
                      content.badge
                    )
                      ? "mt-3"
                      : "",
                  ].join(
                    " "
                  )}
                >
                  {
                    content.subtitle
                  }
                </p>
              ) : null}

              {showButton &&
              buttonLabel ? (
                <div className="mt-5">
                  <Link
                    href={
                      buttonUrl
                    }
                    target={
                      content.openInNewTab
                        ? "_blank"
                        : undefined
                    }
                    rel={
                      content.openInNewTab
                        ? "noreferrer"
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
                      py-3

                      text-sm
                      font-bold
                      text-[#111827]

                      shadow-md

                      transition

                      hover:-translate-y-0.5
                      hover:shadow-lg
                    "
                  >
                    {
                      buttonLabel
                    }
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          {/*
          |--------------------------------------------------------------------------
          | Standard Countdown
          |--------------------------------------------------------------------------
          */}

          {showCountdown ? (
            <div
              className="
                absolute

                bottom-5
                left-5

                z-20

                sm:bottom-6
                sm:left-8

                lg:bottom-7
                lg:left-10
              "
            >
              <FlashDealCountdown
                endAt={
                  content.endAt ||
                  null
                }
                textColor={
                  textColor
                }
                onExpired={
                  onExpired
                }
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}