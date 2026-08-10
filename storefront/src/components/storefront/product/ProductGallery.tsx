"use client";

import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ImageIcon,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  PublicProductImage,
} from "@/types/publicProduct";

interface ProductGalleryProps {
  images:
    PublicProductImage[];

  productName:
    string;

  variantName?:
    | string
    | null;

  isWishlisted?:
    boolean;

  onToggleWishlist?:
    () => void;
}

const getUrl = (
  image?:
    PublicProductImage
): string | null => {
  const asset =
    image?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "LARGE" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "MEDIUM" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "SMALL" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.isPrimary &&
        variant.publicUrl
    );

  return (
    preferred?.publicUrl ||
    asset.publicUrl ||
    asset.previewUrl ||
    asset.thumbnailUrl ||
    null
  );
};

export default function ProductGallery({
  images,
  productName,
  variantName,
  isWishlisted =
    false,
  onToggleWishlist,
}: ProductGalleryProps) {
  const usable =
    useMemo(
      () =>
        (
          Array.isArray(
            images
          )
            ? images
            : []
        ).filter(
          (image) =>
            Boolean(
              getUrl(
                image
              )
            )
        ),
      [
        images,
      ]
    );

  const imageSignature =
    useMemo(
      () =>
        usable
          .map(
            (image) =>
              `${image.id}:${getUrl(
                image
              ) || ""}`
          )
          .join(
            "|"
          ),
      [
        usable,
      ]
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      0
    );

  useEffect(
    () => {
      setActiveIndex(
        0
      );
    },
    [
      imageSignature,
    ]
  );

  useEffect(
    () => {
      if (
        activeIndex >=
        usable.length
      ) {
        setActiveIndex(
          0
        );
      }
    },
    [
      activeIndex,
      usable.length,
    ]
  );

  const active =
    usable[
      activeIndex
    ];

  const activeUrl =
    getUrl(
      active
    );

  const previous =
    () => {
      if (
        usable.length ===
        0
      ) {
        return;
      }

      setActiveIndex(
        (
          currentIndex
        ) =>
          currentIndex ===
          0
            ? usable.length -
              1
            : currentIndex -
              1
      );
    };

  const next =
    () => {
      if (
        usable.length ===
        0
      ) {
        return;
      }

      setActiveIndex(
        (
          currentIndex
        ) =>
          currentIndex ===
          usable.length -
            1
            ? 0
            : currentIndex +
              1
      );
    };

  const altText =
    variantName
      ? `${productName} - ${variantName}`
      : productName;

  return (
    <div className="min-w-0">
      <div className="relative flex min-h-[430px] items-center justify-center overflow-hidden rounded-[24px] border border-storefront bg-white p-6 lg:min-h-[560px]">
        <button
          type="button"
          onClick={
            onToggleWishlist
          }
          disabled={
            !onToggleWishlist
          }
          aria-pressed={
            isWishlisted
          }
          aria-label={
            isWishlisted
              ? `Remove ${productName} from wishlist`
              : `Add ${productName} to wishlist`
          }
          className={[
            "absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm transition",
            isWishlisted
              ? "border-storefront-primary bg-storefront-primary text-white"
              : "border-storefront bg-white text-storefront-text hover:border-storefront-primary hover:text-storefront-primary",
            !onToggleWishlist
              ? "cursor-not-allowed opacity-50"
              : "",
          ].join(
            " "
          )}
        >
          <Heart
            size={
              20
            }
            fill={
              isWishlisted
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {usable.length >
        1 ? (
          <>
            <button
              type="button"
              onClick={
                previous
              }
              aria-label="Previous image"
              className="absolute left-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <ChevronLeft
                size={
                  22
                }
              />
            </button>

            <button
              type="button"
              onClick={
                next
              }
              aria-label="Next image"
              className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
            >
              <ChevronRight
                size={
                  22
                }
              />
            </button>
          </>
        ) : null}

        {activeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={
              activeUrl
            }
            src={
              activeUrl
            }
            alt={
              active?.altText ||
              altText
            }
            className="max-h-[510px] w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-storefront-muted">
            <ImageIcon
              size={
                44
              }
            />

            <span className="text-sm">
              Product image unavailable
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {usable.map(
          (
            image,
            index
          ) => {
            const url =
              getUrl(
                image
              );

            return (
              <button
                key={`${image.id}-${url}`}
                type="button"
                onClick={() =>
                  setActiveIndex(
                    index
                  )
                }
                aria-label={`View image ${
                  index +
                  1
                } for ${altText}`}
                className={[
                  "h-24 w-24 shrink-0 overflow-hidden rounded-2xl border bg-white p-2 transition",
                  index ===
                  activeIndex
                    ? "border-storefront-primary ring-1 ring-storefront-primary"
                    : "border-storefront hover:border-storefront-primary/60",
                ].join(
                  " "
                )}
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={
                      url
                    }
                    alt={
                      image.altText ||
                      altText
                    }
                    className="h-full w-full object-contain"
                  />
                ) : null}
              </button>
            );
          }
        )}
      </div>

      <button
        type="button"
        className="mx-auto mt-4 flex h-12 min-w-48 items-center justify-center rounded-xl border border-storefront bg-white px-6 text-lg font-black text-storefront-primary"
      >
        360° View
      </button>
    </div>
  );
}
