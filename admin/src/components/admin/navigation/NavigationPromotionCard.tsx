"use client";

import {
  ArrowRight,
  ImageIcon,
} from "lucide-react";

import type {
  CSSProperties,
} from "react";

import {
  getPromotionSettings,
} from "./navigationPromotion";

import type {
  NavigationItem,
} from "@/types/navigation";

interface NavigationPromotionCardProps {
  item:
    NavigationItem;

  imageUrl?:
    string | null;

  compact?:
    boolean;

  interactive?:
    boolean;

  className?:
    string;

  onClick?:
    () => void;
}

export default function NavigationPromotionCard({
  item,
  imageUrl,
  compact = false,
  interactive = false,
  className = "",
  onClick,
}: NavigationPromotionCardProps) {
  const promotion =
    getPromotionSettings(
      item.settings
    );

  const title =
    promotion.title?.trim() ||
    item.label;

  const destination =
    promotion.ctaUrl?.trim() ||
    item.url;

  const cardStyle:
    CSSProperties = {
      backgroundColor:
        promotion.backgroundColor ||
        "#303030",

      color:
        promotion.textColor ||
        "#FFFFFF",
    };

  const content = (
    <>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            imageUrl
          }
          alt={
            item.mediaAsset?.altText ||
            title
          }
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <ImageIcon
            size={
              compact
                ? 24
                : 34
            }
            className="opacity-35"
          />
        </div>
      )}

      <div
        className={[
          "absolute inset-0",
          getOverlayClass(
            promotion.overlay
          ),
        ].join(
          " "
        )}
      />

      <div
        className={[
          "relative z-10 flex h-full flex-col justify-end",
          compact
            ? "min-h-[180px] p-4"
            : "min-h-[290px] p-6",
          getAlignmentClass(
            promotion.textAlign
          ),
        ].join(
          " "
        )}
      >
        {promotion.eyebrow && (
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] opacity-80">
            {
              promotion.eyebrow
            }
          </p>
        )}

        <h3
          className={[
            "font-semibold leading-tight",
            compact
              ? "mt-1 text-base"
              : "mt-2 text-2xl",
          ].join(
            " "
          )}
        >
          {title}
        </h3>

        {promotion.subtitle && (
          <p
            className={[
              "font-medium opacity-90",
              compact
                ? "mt-1 text-xs"
                : "mt-2 text-sm",
            ].join(
              " "
            )}
          >
            {
              promotion.subtitle
            }
          </p>
        )}

        {promotion.description &&
          !compact && (
            <p className="mt-2 max-w-md text-xs leading-5 opacity-80">
              {
                promotion.description
              }
            </p>
          )}

        {promotion.ctaText && (
          <span
            className={[
              "mt-4 inline-flex items-center gap-2 font-semibold",
              compact
                ? "text-[11px]"
                : "text-sm",
            ].join(
              " "
            )}
          >
            {
              promotion.ctaText
            }

            <ArrowRight
              size={
                compact
                  ? 12
                  : 15
              }
            />
          </span>
        )}

        {destination &&
          !compact && (
            <span className="mt-2 truncate text-[10px] opacity-60">
              {destination}
            </span>
          )}
      </div>
    </>
  );

  const sharedClassName = [
    "relative block w-full overflow-hidden rounded-2xl text-left shadow-sm",
    interactive
      ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-lg"
      : "",
    className,
  ].join(
    " "
  );

  if (
    interactive &&
    onClick
  ) {
    return (
      <button
        type="button"
        onClick={
          onClick
        }
        className={
          sharedClassName
        }
        style={
          cardStyle
        }
      >
        {content}
      </button>
    );
  }

  return (
    <div
      className={
        sharedClassName
      }
      style={
        cardStyle
      }
    >
      {content}
    </div>
  );
}

function getOverlayClass(
  overlay:
    "NONE" | "LIGHT" | "DARK"
): string {
  if (
    overlay ===
    "LIGHT"
  ) {
    return "bg-white/35";
  }

  if (
    overlay ===
    "DARK"
  ) {
    return "bg-black/45";
  }

  return "";
}

function getAlignmentClass(
  alignment:
    "LEFT" | "CENTER" | "RIGHT"
): string {
  if (
    alignment ===
    "CENTER"
  ) {
    return "items-center text-center";
  }

  if (
    alignment ===
    "RIGHT"
  ) {
    return "items-end text-right";
  }

  return "items-start text-left";
}