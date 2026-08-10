import Link from "next/link";

import type {
  CSSProperties,
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

interface AnnouncementItem {
  id?: string;
  text?: string;
  linkText?: string;
  linkUrl?: string;
  isActive?: boolean;
}

const AnnouncementLink = ({
  text,
  url,
}: {
  text: string;
  url: string;
}) => {
  const className =
    "font-black underline-offset-2 transition hover:underline";

  if (
    isExternalUrl(url)
  ) {
    return (
      <a
        href={url}
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
      href={url}
      className={
        className
      }
    >
      {text}
    </Link>
  );
};

export default function AnnouncementBar({
  storefront,
  section,
}: AnnouncementBarProps) {
  const websiteSettings =
    storefront.settings
      .website || {};

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

  if (!enabled) {
    return null;
  }

  const backgroundColor =
    getString(
      sectionSettings.backgroundColor,
      "var(--storefront-primary)"
    );

  const textColor =
    getString(
      sectionSettings.textColor,
      "#FFFFFF"
    );

  const height =
    Math.max(
      getNumber(
        sectionSettings.height,
        34
      ),
      30
    );

  const hideOnMobile =
    getBoolean(
      sectionSettings.hideOnMobile,
      false
    );

  const rawItems =
    Array.isArray(
      sectionContent.items
    )
      ? sectionContent.items
      : [];

  const cmsItems:
    AnnouncementItem[] =
    rawItems
      .map((item) => {
        const record =
          asRecord(item);

        return {
          id:
            getString(
              record.id
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

          isActive:
            getBoolean(
              record.isActive,
              true
            ),
        };
      })
      .filter(
        (item) =>
          item.isActive !==
            false &&
          Boolean(
            item.text ||
              item.linkText
          )
      );

  const fallbackText =
    websiteSettings
      .announcementText ||
    "";

  const fallbackLinkText =
    websiteSettings
      .announcementLinkText ||
    "";

  const fallbackLinkUrl =
    websiteSettings
      .announcementLinkUrl ||
    "";

  const defaultItems:
    AnnouncementItem[] = [
      {
        id:
          "delivery",
        text:
          fallbackText ||
          "Free Delivery in Dubai, Abu Dhabi & Sharjah",
        isActive: true,
      },
      {
        id:
          "discount",
        text:
          "Use code SAVE10 for 10% off mobiles",
        isActive: true,
      },
      {
        id:
          "uae",
        text:
          "🇦🇪 OUR PRIDE OUR UAE",
        isActive: true,
      },
      {
        id:
          "fast-delivery",
        text:
          "2-Hour Delivery",
        linkText:
          fallbackLinkText,
        linkUrl:
          fallbackLinkUrl,
        isActive: true,
      },
    ];

  const effectiveItems =
    cmsItems.length >= 2
      ? cmsItems
      : defaultItems;

  return (
    <div
      className={[
        "w-full",
        hideOnMobile
          ? "hidden sm:block"
          : "",
      ].join(
        " "
      )}
      style={
        {
          backgroundColor,
          color:
            textColor,
          minHeight:
            `${height}px`,
        } as CSSProperties
      }
    >
      <div className="mx-auto flex min-h-[inherit] max-w-[1440px] items-center overflow-x-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-max flex-1 items-center justify-between gap-10 whitespace-nowrap text-xs font-semibold sm:min-w-full sm:text-sm">
          {effectiveItems.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.id ||
                  `${item.text}-${index}`
                }
                className="flex shrink-0 items-center justify-center gap-1.5"
              >
                {item.text ? (
                  <span>
                    {
                      item.text
                    }
                  </span>
                ) : null}

                {item.linkText &&
                item.linkUrl ? (
                  <AnnouncementLink
                    text={
                      item.linkText
                    }
                    url={
                      item.linkUrl
                    }
                  />
                ) : null}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
