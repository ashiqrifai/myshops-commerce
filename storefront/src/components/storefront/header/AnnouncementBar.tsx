"use client";

import Link from "next/link";

import {
  CSSProperties,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  StorefrontData,
  StorefrontSection,
} from "@/types/storefront";

import {
  asRecord,
  getBoolean,
  getNumber,
  getSectionContent,
  getSectionSettings,
  getString,
  isExternalUrl,
} from "./header.utils";

interface AnnouncementBarProps {
  storefront:
    StorefrontData;

  section?:
    | StorefrontSection
    | null;
}

type TransitionType =
  | "FADE"
  | "SLIDE_LEFT"
  | "SLIDE_RIGHT"
  | "SLIDE_UP"
  | "SLIDE_DOWN";

interface ResolvedMediaAsset {
  id?: string;
  publicUrl?: string | null;
  altText?: string | null;
  title?: string | null;
  originalFileName?: string | null;
}

interface AnnouncementSlide {
  id:
    string;

  text:
    string;

  linkText:
    string;

  linkUrl:
    string;

  desktopAssetId:
    string | null;

  mobileAssetId:
    string | null;

  desktopAssetIdResolved:
    ResolvedMediaAsset | null;

  mobileAssetIdResolved:
    ResolvedMediaAsset | null;

  backgroundColor:
    string;

  textColor:
    string;

  isActive:
    boolean;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

const resolvedAsset = (
  value: unknown
): ResolvedMediaAsset | null => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const record =
    value as Record<string, unknown>;

  return {
    id:
      typeof record.id === "string"
        ? record.id
        : undefined,

    publicUrl:
      typeof record.publicUrl === "string"
        ? record.publicUrl
        : null,

    altText:
      typeof record.altText === "string"
        ? record.altText
        : null,

    title:
      typeof record.title === "string"
        ? record.title
        : null,

    originalFileName:
      typeof record.originalFileName === "string"
        ? record.originalFileName
        : null,
  };
};

const AnnouncementLink = ({
  text,
  url,
}: {
  text:
    string;
  url:
    string;
}) => {
  const className =
    "font-black underline-offset-2 transition hover:underline";

  if (
    isExternalUrl(
      url
    )
  ) {
    return (
      <a
        href={
          url
        }
        className={
          className
        }
        target={
          url.startsWith(
            "http"
          )
            ? "_blank"
            : undefined
        }
        rel={
          url.startsWith(
            "http"
          )
            ? "noopener noreferrer"
            : undefined
        }
      >
        {text}
      </a>
    );
  }

  return (
    <Link
      href={
        url
      }
      className={
        className
      }
    >
      {text}
    </Link>
  );
};

const transitionClasses = (
  transition:
    TransitionType
) => {
  switch (
    transition
  ) {
    case "SLIDE_RIGHT":
      return "animate-[announcementSlideRight_450ms_ease-out]";

    case "SLIDE_UP":
      return "animate-[announcementSlideUp_450ms_ease-out]";

    case "SLIDE_DOWN":
      return "animate-[announcementSlideDown_450ms_ease-out]";

    case "SLIDE_LEFT":
      return "animate-[announcementSlideLeft_450ms_ease-out]";

    case "FADE":
    default:
      return "animate-[announcementFade_450ms_ease-out]";
  }
};

export default function AnnouncementBar({
  storefront,
  section,
}: AnnouncementBarProps) {
  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      0
    );

  const websiteSettings =
    storefront.settings
      .website ||
    {};

  const sectionSettings =
    getSectionSettings(
      section
    );

  const sectionContent =
    getSectionContent(
      section
    );

  const enabled =
    getBoolean(
      sectionSettings.enabled,
      websiteSettings
        .announcementBarEnabled !==
        false
    );

  const height =
    Math.max(
      getNumber(
        sectionSettings.height,
        36
      ),
      30
    );

  const mobileHeight =
    Math.max(
      getNumber(
        sectionSettings.mobileHeight,
        height
      ),
      30
    );

  const autoplay =
    getBoolean(
      sectionSettings.autoplay,
      true
    );

  const autoplayDelayMs =
    Math.max(
      getNumber(
        sectionSettings.autoplayDelayMs,
        4000
      ),
      1500
    );

  const transition =
    getString(
      sectionSettings.transition,
      "FADE"
    )
      .trim()
      .toUpperCase() as
      TransitionType;

  const hideOnMobile =
    getBoolean(
      sectionSettings.hideOnMobile,
      false
    );

  const defaultBackgroundColor =
    getString(
      sectionSettings.backgroundColor,
      "var(--storefront-primary)"
    );

  const defaultTextColor =
    getString(
      sectionSettings.textColor,
      "#FFFFFF"
    );

  const rawSlides =
    Array.isArray(
      sectionContent.slides
    )
      ? sectionContent.slides
      : Array.isArray(
          sectionContent.items
        )
        ? sectionContent.items
        : [];

  const slides =
    useMemo(
      () =>
        rawSlides
          .map(
            (
              item,
              index
            ) => {
              const record =
                asRecord(
                  item
                );

              return {
                id:
                  getString(
                    record.id,
                    `announcement-${index + 1}`
                  ),

                text:
                  getString(
                    record.text
                  ),

                linkText:
                  getString(
                    record.linkText
                  ),

                linkUrl:
                  getString(
                    record.linkUrl
                  ),

                desktopAssetId:
                  getString(
                    record.desktopAssetId
                  ) || null,

                mobileAssetId:
                  getString(
                    record.mobileAssetId
                  ) || null,

                desktopAssetIdResolved:
                  resolvedAsset(
                    record.desktopAssetIdResolved
                  ),

                mobileAssetIdResolved:
                  resolvedAsset(
                    record.mobileAssetIdResolved
                  ),

                backgroundColor:
                  getString(
                    record.backgroundColor,
                    defaultBackgroundColor
                  ),

                textColor:
                  getString(
                    record.textColor,
                    defaultTextColor
                  ),

                isActive:
                  getBoolean(
                    record.isActive,
                    true
                  ),
              } satisfies
                AnnouncementSlide;
            }
          )
          .filter(
            (
              item
            ) =>
              item.isActive &&
              Boolean(
                item.text ||
                item.linkText ||
                item.desktopAssetIdResolved?.publicUrl ||
                item.mobileAssetIdResolved?.publicUrl
              )
          ),
      [
        rawSlides,
        defaultBackgroundColor,
        defaultTextColor,
      ]
    );

  const fallbackSlides:
    AnnouncementSlide[] =
    [
      {
        id:
          "fallback",
        text:
          websiteSettings
            .announcementText ||
          "Free Delivery in Dubai, Abu Dhabi & Sharjah",
        linkText:
          websiteSettings
            .announcementLinkText ||
          "",
        linkUrl:
          websiteSettings
            .announcementLinkUrl ||
          "",
        desktopAssetId:
          null,
        mobileAssetId:
          null,
        desktopAssetIdResolved:
          null,
        mobileAssetIdResolved:
          null,
        backgroundColor:
          defaultBackgroundColor,
        textColor:
          defaultTextColor,
        isActive:
          true,
      },
    ];

  const effectiveSlides =
    slides.length
      ? slides
      : fallbackSlides;

  useEffect(
    () => {
      setActiveIndex(
        (
          current
        ) =>
          current <
          effectiveSlides.length
            ? current
            : 0
      );
    },
    [
      effectiveSlides.length,
    ]
  );

  useEffect(
    () => {
      if (
        !autoplay ||
        effectiveSlides.length <=
          1
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setActiveIndex(
              (
                current
              ) =>
                (
                  current +
                  1
                ) %
                effectiveSlides.length
            );
          },
          autoplayDelayMs
        );

      return () =>
        window.clearInterval(
          timer
        );
    },
    [
      autoplay,
      autoplayDelayMs,
      effectiveSlides.length,
    ]
  );

  if (
    !enabled ||
    effectiveSlides.length ===
      0
  ) {
    return null;
  }

  const activeSlide =
    effectiveSlides[
      activeIndex
    ] ||
    effectiveSlides[0];

  const desktopImageUrl =
    resolveMediaUrl(
      activeSlide
        .desktopAssetIdResolved
        ?.publicUrl
    );

  const mobileImageUrl =
    resolveMediaUrl(
      activeSlide
        .mobileAssetIdResolved
        ?.publicUrl
    );

  const hasDesktopImage =
    Boolean(
      desktopImageUrl
    );

  const hasMobileImage =
    Boolean(
      mobileImageUrl
    );

  return (
    <>
      <style jsx global>{`
        @keyframes announcementFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes announcementSlideLeft {
          from {
            opacity: 0;
            transform: translateX(24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes announcementSlideRight {
          from {
            opacity: 0;
            transform: translateX(-24px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes announcementSlideUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes announcementSlideDown {
          from {
            opacity: 0;
            transform: translateY(-14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div
        className={[
          "relative w-full overflow-hidden",
          hideOnMobile
            ? "hidden sm:block"
            : "",
        ].join(
          " "
        )}
        style={
          {
            backgroundColor:
              activeSlide
                .backgroundColor,
            color:
              activeSlide
                .textColor,
            minHeight:
              `${height}px`,
            "--announcement-mobile-height":
              `${mobileHeight}px`,
          } as CSSProperties
        }
      >
        <div
          key={
            activeSlide.id
          }
          className={[
            "relative flex w-full items-center justify-center overflow-hidden",
            transitionClasses(
              transition
            ),
          ].join(
            " "
          )}
          style={{
            minHeight:
              `${height}px`,
          }}
        >
          {hasDesktopImage ? (
            <div
              className="absolute inset-0 hidden bg-cover bg-center sm:block"
              style={{
                backgroundImage:
                  `url("${desktopImageUrl}")`,
              }}
            />
          ) : null}

          {hasMobileImage ||
          hasDesktopImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center sm:hidden"
              style={{
                backgroundImage:
                  `url("${mobileImageUrl || desktopImageUrl}")`,
              }}
            />
          ) : null}

          <div className="relative z-10 mx-auto flex min-h-[inherit] w-full max-w-[1440px] items-center justify-center gap-2 px-4 text-center text-xs font-semibold sm:px-6 sm:text-sm lg:px-8">
            {activeSlide.text ? (
              <span>
                {
                  activeSlide.text
                }
              </span>
            ) : null}

            {activeSlide
              .linkText &&
            activeSlide
              .linkUrl ? (
              <AnnouncementLink
                text={
                  activeSlide
                    .linkText
                }
                url={
                  activeSlide
                    .linkUrl
                }
              />
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
