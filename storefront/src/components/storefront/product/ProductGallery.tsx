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
  images: PublicProductImage[];
  productName: string;
  variantName?: string | null;
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
}

const getUrl = (
  image?: PublicProductImage
): string | null => {
  const asset = image?.mediaAsset;

  if (!asset) {
    return null;
  }

  const preferred =
    asset.variants?.find(
      (variant) =>
        variant.variantType === "LARGE" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType === "MEDIUM" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType === "SMALL" &&
        variant.publicUrl
    ) ||
    asset.variants?.find(
      (variant) =>
        variant.variantType === "THUMBNAIL" &&
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
  isWishlisted = false,
  onToggleWishlist,
}: ProductGalleryProps) {
  const usable = useMemo(
    () =>
      (Array.isArray(images) ? images : []).filter(
        (image) => Boolean(getUrl(image))
      ),
    [images]
  );

  const imageSignature = useMemo(
    () =>
      usable
        .map(
          (image) =>
            `${image.id}:${getUrl(image) || ""}`
        )
        .join("|"),
    [usable]
  );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [imageSignature]);

  useEffect(() => {
    if (
      activeIndex >= usable.length
    ) {
      setActiveIndex(0);
    }
  }, [
    activeIndex,
    usable.length,
  ]);

  const active =
    usable[activeIndex];

  const activeUrl =
    getUrl(active);

  const previous = () => {
    if (!usable.length) {
      return;
    }

    setActiveIndex(
      (currentIndex) =>
        currentIndex === 0
          ? usable.length - 1
          : currentIndex - 1
    );
  };

  const next = () => {
    if (!usable.length) {
      return;
    }

    setActiveIndex(
      (currentIndex) =>
        currentIndex === usable.length - 1
          ? 0
          : currentIndex + 1
    );
  };

  const altText =
    variantName
      ? `${productName} - ${variantName}`
      : productName;

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="relative flex h-[360px] w-full min-w-0 items-center justify-center overflow-hidden rounded-[20px] border border-[#d9dde3] bg-white p-4 sm:h-[430px] sm:p-5 lg:h-[560px] lg:p-6">
        <button
          type="button"
          onClick={onToggleWishlist}
          disabled={!onToggleWishlist}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? `Remove ${productName} from wishlist`
              : `Add ${productName} to wishlist`
          }
          className={[
            "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition",
            "sm:right-4 sm:top-4 sm:h-11 sm:w-11",
            isWishlisted
              ? "border-[#bfc5cc] bg-storefront-primary text-white"
              : "border-[#d9dde3] bg-white text-storefront-text hover:border-[#bfc5cc] hover:text-storefront-primary",
            !onToggleWishlist
              ? "cursor-not-allowed opacity-50"
              : "",
          ].join(" ")}
        >
          <Heart
            size={19}
            fill={
              isWishlisted
                ? "currentColor"
                : "none"
            }
          />
        </button>

        {usable.length > 1 ? (
          <>
            <button
              type="button"
              onClick={previous}
              aria-label="Previous image"
              className="absolute left-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md sm:left-4 sm:h-11 sm:w-11"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md sm:right-4 sm:h-11 sm:w-11"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}

        {activeUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={activeUrl}
            src={activeUrl}
            alt={
              active?.altText ||
              altText
            }
            className="h-full w-full max-w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-storefront-muted">
            <ImageIcon size={40} />
            <span className="text-sm">
              Product image unavailable
            </span>
          </div>
        )}
      </div>

      {usable.length > 1 ? (
        <div className="mt-3 flex w-full min-w-0 gap-2.5 overflow-x-auto overscroll-x-contain pb-1 sm:mt-4 sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {usable.map(
            (image, index) => {
              const url =
                getUrl(image);

              return (
                <button
                  key={`${image.id}-${url}`}
                  type="button"
                  onClick={() =>
                    setActiveIndex(index)
                  }
                  aria-label={`View image ${index + 1} for ${altText}`}
                  className={[
                    "h-[74px] w-[74px] shrink-0 overflow-hidden rounded-xl border bg-white p-1.5 transition",
                    "sm:h-24 sm:w-24 sm:rounded-2xl sm:p-2",
                    index === activeIndex
                      ? "border-[#111111] ring-0"
                      : "border-[#d9dde3] hover:border-[#bfc5cc]",
                  ].join(" ")}
                >
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={url}
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
      ) : null}
    </div>
  );
}
