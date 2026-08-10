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

  compact?: boolean;
  onExpired?: () => void;
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

  const buttonUrl =
    content.buttonUrl ||
    "/products";

  const buttonLabel =
    content.buttonLabel ||
    "Shop Now";

  return (
    <div
      className={[
        "relative isolate overflow-hidden",
        compact
          ? "min-h-[430px] rounded-2xl"
          : "min-h-[300px] rounded-2xl sm:min-h-[360px]",
      ].join(" ")}
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {desktopImage ||
      mobileImage ? (
        <picture>
          {mobileImage ? (
            <source
              media="(max-width: 639px)"
              srcSet={mobileImage}
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
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
      ) : null}

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

      <div
        className={[
          "relative z-10 flex h-full min-h-inherit flex-col justify-center p-6 sm:p-10 lg:p-12",
          alignmentClass,
        ].join(" ")}
      >
        {content.badge ? (
          <span className="inline-flex rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] backdrop-blur">
            {content.badge}
          </span>
        ) : null}

        <h2
          className={[
            "mt-4 max-w-3xl font-black tracking-tight",
            compact
              ? "text-3xl sm:text-4xl"
              : "text-3xl sm:text-5xl lg:text-6xl",
          ].join(" ")}
        >
          {content.title ||
            "Flash Deals"}
        </h2>

        {content.subtitle ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 opacity-90 sm:text-lg">
            {content.subtitle}
          </p>
        ) : null}

        {settings.showCountdown !==
          false ? (
          <div className="mt-6">
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

        {buttonLabel ? (
          <div className="mt-7">
            <Link
              href={buttonUrl}
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
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-black text-[#111827] shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              {buttonLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
