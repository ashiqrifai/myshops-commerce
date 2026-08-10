"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Monitor,
  Package,
  Search,
  ShoppingBag,
  Smartphone,
  X,
  Maximize2,
  Pause,
  Play,
  ZoomIn,
  Star,
  ArrowRight,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  
} from "react";

import type {
  ProductFormValues,
  ProductImage,
  ProductVariant,
} from "@/types/product";

interface ProductPreviewModalProps {
  open: boolean;
  values: ProductFormValues;
  brandName?: string | null;
  categoryName?: string | null;
  onClose: () => void;
}

type PreviewDevice =
  | "DESKTOP"
  | "MOBILE";

interface PreviewMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string | null;
  posterUrl: string | null;
  altText: string;
  title: string;
  displayOrder: number;
}

interface PreviewVariantOption {
    value: string;
    swatchValue: string | null;
  }

export default function ProductPreviewModal({
  open,
  values,
  brandName,
  categoryName,
  onClose,
}: ProductPreviewModalProps) {
  const [
    device,
    setDevice,
  ] = useState<PreviewDevice>(
    "DESKTOP"
  );

  const [
    selectedMediaIndex,
    setSelectedMediaIndex,
  ] = useState(0);

  const [
    selectedVariantId,
    setSelectedVariantId,
  ] = useState<string | null>(
    null
  );

  const mediaItems = useMemo(
    () =>
      values.images
        .filter(
          (item) =>
            item.isActive !== false
        )
        .sort(
          (left, right) =>
            Number(
              left.displayOrder || 0
            ) -
            Number(
              right.displayOrder || 0
            )
        )
        .map(
          mapProductMediaToPreview
        ),
    [values.images]
  );

  const [
    lightboxOpen,
    setLightboxOpen,
  ] = useState(false);

  const activeVariants = useMemo(
    () =>
      values.variants
        .filter(
          (variant) =>
            variant.status !==
            "ARCHIVED"
        )
        .sort(
          (left, right) =>
            Number(
              left.sortOrder || 0
            ) -
            Number(
              right.sortOrder || 0
            )
        ),
    [values.variants]
  );

  const selectedVariant =
    useMemo(() => {
      if (!activeVariants.length) {
        return null;
      }

      return (
        activeVariants.find(
          (variant) =>
            getVariantKey(
              variant
            ) ===
            selectedVariantId
        ) ||
        activeVariants.find(
          (variant) =>
            variant.isDefault
        ) ||
        activeVariants[0]
      );
    }, [
      activeVariants,
      selectedVariantId,
    ]);

  const variantGroups = useMemo(
    () =>
      buildVariantGroups(
        activeVariants
      ),
    [activeVariants]
  );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  useEffect(() => {
    if (!open) {
      return;
    }
  
    setSelectedMediaIndex(0);
  
    // Reset quantity whenever preview opens
    setQuantity(1);
  
    const defaultVariant =
      activeVariants.find(
        (variant) =>
          variant.isDefault
      ) ||
      activeVariants[0];
  
    setSelectedVariantId(
      defaultVariant
        ? getVariantKey(
            defaultVariant
          )
        : null
    );
  }, [
    open,
    activeVariants,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }
  
    const onKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape"
      ) {
        if (lightboxOpen) {
          setLightboxOpen(false);
          return;
        }
  
        onClose();
      }
  
      if (
        lightboxOpen &&
        event.key === "ArrowRight"
      ) {
        setSelectedMediaIndex(
          (current) =>
            mediaItems.length
              ? (current + 1) %
                mediaItems.length
              : 0
        );
      }
  
      if (
        lightboxOpen &&
        event.key === "ArrowLeft"
      ) {
        setSelectedMediaIndex(
          (current) =>
            mediaItems.length
              ? (
                  current -
                  1 +
                  mediaItems.length
                ) %
                mediaItems.length
              : 0
        );
      }
    };
  
    document.addEventListener(
      "keydown",
      onKeyDown
    );
  
    const originalOverflow =
      document.body.style.overflow;
  
    document.body.style.overflow =
      "hidden";
  
    return () => {
      document.removeEventListener(
        "keydown",
        onKeyDown
      );
  
      document.body.style.overflow =
        originalOverflow;
    };
  }, [
    open,
    lightboxOpen,
    mediaItems.length,
    onClose,
  ]);

  if (!open) {
    return null;
  }

  const selectedMedia =
    mediaItems[
      selectedMediaIndex
    ] || null;

  const nextMedia = () => {
    if (
      mediaItems.length <= 1
    ) {
      return;
    }

    setSelectedMediaIndex(
      (current) =>
        (current + 1) %
        mediaItems.length
    );
  };

  const previousMedia = () => {
    if (
      mediaItems.length <= 1
    ) {
      return;
    }

    setSelectedMediaIndex(
      (current) =>
        (current -
          1 +
          mediaItems.length) %
        mediaItems.length
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[200] flex flex-col bg-[#f1f2f3]">
        <PreviewToolbar
          device={device}
          productName={
            values.name ||
            "Untitled product"
          }
          onDeviceChange={
            setDevice
          }
          onClose={onClose}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-6">
          <div
            className={[
              "mx-auto min-h-full overflow-hidden bg-white shadow-xl transition-all duration-300",
              device === "MOBILE"
                ? "max-w-[430px] rounded-[30px] border-[8px] border-[#202124]"
                : "max-w-[1500px] rounded-2xl border border-[#dfe3e8]",
            ].join(" ")}
          >
            <StorefrontHeader
              mobile={
                device === "MOBILE"
              }
            />

            <main
              className={[
                "mx-auto w-full",
                device === "MOBILE"
                  ? "px-4 py-5"
                  : "max-w-[1400px] px-6 py-8 lg:px-10",
              ].join(" ")}
            >
              <div
                className={[
                  "grid gap-8",
                  device === "MOBILE"
                    ? "grid-cols-1"
                    : "lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]",
                ].join(" ")}
              >
                <ProductGallery
                  mediaItems={
                    mediaItems
                  }
                  selectedMedia={
                    selectedMedia
                  }
                  selectedIndex={
                    selectedMediaIndex
                  }
                  mobile={
                    device === "MOBILE"
                  }
                  onSelect={
                    setSelectedMediaIndex
                  }
                  onNext={
                    nextMedia
                  }
                  onPrevious={
                    previousMedia
                  }
                  onOpenLightbox={() =>
                    setLightboxOpen(true)
                  }
                />

<ProductInformation
  values={values}
  brandName={brandName}
  categoryName={categoryName}
  selectedVariant={selectedVariant}
  variants={activeVariants}
  variantGroups={variantGroups}
  quantity={quantity}
  onQuantityChange={setQuantity}
  onSelectVariant={(variant) =>
    setSelectedVariantId(
      getVariantKey(variant)
    )
  }
/>
              </div>

              <ProductDetails
                values={values}
                mobile={
                  device === "MOBILE"
                }
              />

<ProductReviewsSummary />

<RelatedProductsPlaceholder
  mobile={
    device === "MOBILE"
  }
/>
            </main>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <ProductMediaLightbox
          mediaItems={
            mediaItems
          }
          selectedIndex={
            selectedMediaIndex
          }
          onSelect={
            setSelectedMediaIndex
          }
          onPrevious={
            previousMedia
          }
          onNext={
            nextMedia
          }
          onClose={() =>
            setLightboxOpen(false)
          }
        />
      )}
    </>
  );
}

function PreviewToolbar({
  device,
  productName,
  onDeviceChange,
  onClose,
}: {
  device: PreviewDevice;
  productName: string;
  onDeviceChange: (
    device: PreviewDevice
  ) => void;
  onClose: () => void;
}) {
  return (
    <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-[#d8dadd] bg-white px-4 shadow-sm md:px-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6d7175]">
          Product preview
        </p>

        <h1 className="truncate text-sm font-semibold text-[#202223] md:text-base">
          {productName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden rounded-lg border border-[#d8dadd] bg-[#f6f6f7] p-1 sm:flex">
          <button
            type="button"
            onClick={() =>
              onDeviceChange(
                "DESKTOP"
              )
            }
            className={[
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
              device === "DESKTOP"
                ? "bg-white text-[#202223] shadow-sm"
                : "text-[#6d7175]",
            ].join(" ")}
          >
            <Monitor size={16} />
            Desktop
          </button>

          <button
            type="button"
            onClick={() =>
              onDeviceChange(
                "MOBILE"
              )
            }
            className={[
              "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium",
              device === "MOBILE"
                ? "bg-white text-[#202223] shadow-sm"
                : "text-[#6d7175]",
            ].join(" ")}
          >
            <Smartphone size={16} />
            Mobile
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#d8dadd] bg-white hover:bg-[#f6f6f7]"
          aria-label="Close preview"
        >
          <X size={19} />
        </button>
      </div>
    </header>
  );
}

function StorefrontHeader({
  mobile,
}: {
  mobile: boolean;
}) {
  return (
    <header className="border-b border-[#e5e7eb] bg-white">
      <div
        className={[
          "mx-auto flex items-center justify-between gap-4",
          mobile
            ? "px-4 py-4"
            : "max-w-[1400px] px-8 py-5",
        ].join(" ")}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#202223] text-white">
            <ShoppingBag
              size={18}
            />
          </div>

          <span className="text-base font-bold tracking-tight">
            MyShops
          </span>
        </div>

        {!mobile && (
          <nav className="flex items-center gap-7 text-sm font-medium text-[#52565a]">
            <span>Mobiles</span>
            <span>Computing</span>
            <span>Audio</span>
            <span>Gaming</span>
            <span>Accessories</span>
          </nav>
        )}

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f5f6]"
          aria-label="Search"
        >
          <Search size={17} />
        </button>
      </div>

      
    </header>
  );
}

function ProductGallery({
    mediaItems,
    selectedMedia,
    selectedIndex,
    mobile,
    onSelect,
    onNext,
    onPrevious,
    onOpenLightbox,
  }: {
    mediaItems: PreviewMediaItem[];
    selectedMedia:
      | PreviewMediaItem
      | null;
    selectedIndex: number;
    mobile: boolean;
    onSelect: (
      index: number
    ) => void;
    onNext: () => void;
    onPrevious: () => void;
    onOpenLightbox: () => void;
  }) {
    const [
      zoomPosition,
      setZoomPosition,
    ] = useState({
      x: 50,
      y: 50,
    });
  
    const [
      zooming,
      setZooming,
    ] = useState(false);
  
    const [
      videoPlaying,
      setVideoPlaying,
    ] = useState(false);
  
    useEffect(() => {
      setZooming(false);
      setVideoPlaying(false);
    }, [selectedMedia?.id]);
  
    const handleMouseMove = (
      event: React.MouseEvent<
        HTMLDivElement
      >
    ) => {
      if (
        mobile ||
        selectedMedia?.type !==
          "IMAGE"
      ) {
        return;
      }
  
      const rectangle =
        event.currentTarget.getBoundingClientRect();
  
      const x =
        ((event.clientX -
          rectangle.left) /
          rectangle.width) *
        100;
  
      const y =
        ((event.clientY -
          rectangle.top) /
          rectangle.height) *
        100;
  
      setZoomPosition({
        x,
        y,
      });
    };
  
    return (
      <section>
        <div
          className={[
            "group relative overflow-hidden rounded-2xl bg-[#f7f7f8]",
            mobile
              ? "aspect-square"
              : "aspect-[1.05/1]",
          ].join(" ")}
          onMouseMove={
            handleMouseMove
          }
          onMouseEnter={() => {
            if (
              !mobile &&
              selectedMedia?.type ===
                "IMAGE"
            ) {
              setZooming(true);
            }
          }}
          onMouseLeave={() =>
            setZooming(false)
          }
        >
          {selectedMedia?.url ? (
            selectedMedia.type ===
            "VIDEO" ? (
              <VideoPreview
                key={
                  selectedMedia.id
                }
                media={
                  selectedMedia
                }
                playing={
                  videoPlaying
                }
                onPlayingChange={
                  setVideoPlaying
                }
              />
            ) : (
              <button
                type="button"
                onClick={
                  onOpenLightbox
                }
                className="h-full w-full cursor-zoom-in"
                aria-label="Open product image"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    selectedMedia.url
                  }
                  alt={
                    selectedMedia.altText
                  }
                  className={[
                    "h-full w-full object-contain p-5 transition-transform duration-150",
                    zooming
                      ? "scale-[1.8]"
                      : "scale-100",
                  ].join(" ")}
                  style={{
                    transformOrigin:
                      `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }}
                />
              </button>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-[#8c9196]">
              <Package size={52} />
  
              <p className="mt-3 text-sm font-medium">
                No product media
              </p>
            </div>
          )}
  
          {selectedMedia?.type ===
            "VIDEO" && (
            <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">
              <Film size={13} />
              Video
            </span>
          )}
  
          {selectedMedia?.type ===
            "IMAGE" && (
            <div className="pointer-events-none absolute bottom-3 right-3 hidden items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100 md:flex">
              <ZoomIn size={14} />
              Hover to zoom
            </div>
          )}
  
          {selectedMedia && (
            <button
              type="button"
              onClick={
                onOpenLightbox
              }
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 opacity-0 shadow transition hover:bg-white group-hover:opacity-100"
              aria-label="Open fullscreen media"
            >
              <Maximize2 size={17} />
            </button>
          )}
  
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={
                  onPrevious
                }
                className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                aria-label="Previous media"
              >
                <ChevronLeft
                  size={20}
                />
              </button>
  
              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white"
                aria-label="Next media"
              >
                <ChevronRight
                  size={20}
                />
              </button>
            </>
          )}
        </div>
  
        {mediaItems.length > 1 && (
          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {mediaItems.map(
              (item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    onSelect(index)
                  }
                  className={[
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-[#f7f7f8] transition",
                    selectedIndex ===
                    index
                      ? "border-[#202223] shadow-sm"
                      : "border-transparent hover:border-[#c4c7c9]",
                  ].join(" ")}
                >
                  {item.url ? (
                    item.type ===
                    "VIDEO" ? (
                      <>
                        {item.posterUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.posterUrl
                            }
                            alt={
                              item.altText
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <video
                            src={
                              item.url
                            }
                            muted
                            playsInline
                            preload="metadata"
                            className="h-full w-full object-cover"
                          />
                        )}
  
                        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90">
                            <Play
                              size={15}
                              className="ml-0.5 text-black"
                            />
                          </span>
                        </span>
                      </>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.url}
                        alt={
                          item.altText
                        }
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package
                        size={20}
                        className="text-[#8c9196]"
                      />
                    </div>
                  )}
                </button>
              )
            )}
          </div>
        )}
      </section>
    );
  }

  function VideoPreview({
    media,
    playing,
    onPlayingChange,
  }: {
    media: PreviewMediaItem;
    playing: boolean;
    onPlayingChange: (
      playing: boolean
    ) => void;
  }) {
    const [
      videoElement,
      setVideoElement,
    ] =
      useState<HTMLVideoElement | null>(
        null
      );
  
    const togglePlayback =
      async () => {
        if (!videoElement) {
          return;
        }
  
        if (
          videoElement.paused
        ) {
          await videoElement.play();
          return;
        }
  
        videoElement.pause();
      };
  
    return (
      <div className="relative h-full w-full bg-black">
        <video
          ref={
            setVideoElement
          }
          src={media.url || undefined}
          poster={
            media.posterUrl ||
            undefined
          }
          playsInline
          preload="metadata"
          controls={playing}
          onPlay={() =>
            onPlayingChange(true)
          }
          onPause={() =>
            onPlayingChange(false)
          }
          onEnded={() =>
            onPlayingChange(false)
          }
          className="h-full w-full object-contain"
        />
  
        {!playing && (
          <button
            type="button"
            onClick={
              togglePlayback
            }
            className="absolute inset-0 flex items-center justify-center bg-black/15"
            aria-label="Play product video"
          >
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/95 shadow-xl transition hover:scale-105">
              <Play
                size={31}
                className="ml-1 text-black"
                fill="currentColor"
              />
            </span>
          </button>
        )}
  
        {playing && (
          <button
            type="button"
            onClick={
              togglePlayback
            }
            className="absolute bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/65 text-white opacity-0 transition hover:bg-black/80 group-hover:opacity-100"
            aria-label="Pause product video"
          >
            <Pause size={18} />
          </button>
        )}
      </div>
    );
  }

  function ProductMediaLightbox({
    mediaItems,
    selectedIndex,
    onSelect,
    onPrevious,
    onNext,
    onClose,
  }: {
    mediaItems: PreviewMediaItem[];
    selectedIndex: number;
    onSelect: (
      index: number
    ) => void;
    onPrevious: () => void;
    onNext: () => void;
    onClose: () => void;
  }) {
    const selectedMedia =
      mediaItems[
        selectedIndex
      ] || null;
  
    return (
      <div className="fixed inset-0 z-[300] flex flex-col bg-black/95 text-white">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 md:px-6">
          <div>
            <p className="text-sm font-semibold">
              {selectedMedia?.title ||
                "Product media"}
            </p>
  
            <p className="mt-1 text-xs text-white/60">
              {mediaItems.length
                ? `${
                    selectedIndex +
                    1
                  } of ${
                    mediaItems.length
                  }`
                : "No media"}
            </p>
          </div>
  
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close fullscreen media"
          >
            <X size={21} />
          </button>
        </header>
  
        <div className="relative min-h-0 flex-1">
          {selectedMedia?.url ? (
            selectedMedia.type ===
            "VIDEO" ? (
              <video
                key={
                  selectedMedia.id
                }
                src={
                  selectedMedia.url
                }
                poster={
                  selectedMedia
                    .posterUrl ||
                  undefined
                }
                controls
                autoPlay
                playsInline
                className="h-full w-full object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  selectedMedia.url
                }
                alt={
                  selectedMedia.altText
                }
                className="h-full w-full object-contain p-4 md:p-10"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              No media available
            </div>
          )}
  
          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={
                  onPrevious
                }
                className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 md:left-6"
                aria-label="Previous media"
              >
                <ChevronLeft
                  size={25}
                />
              </button>
  
              <button
                type="button"
                onClick={onNext}
                className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 md:right-6"
                aria-label="Next media"
              >
                <ChevronRight
                  size={25}
                />
              </button>
            </>
          )}
        </div>
  
        {mediaItems.length > 1 && (
          <footer className="shrink-0 border-t border-white/10 px-4 py-4">
            <div className="mx-auto flex max-w-4xl justify-center gap-3 overflow-x-auto">
              {mediaItems.map(
                (item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onSelect(index)
                    }
                    className={[
                      "relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-white/5",
                      selectedIndex ===
                      index
                        ? "border-white"
                        : "border-transparent opacity-65 hover:opacity-100",
                    ].join(" ")}
                  >
                    {item.type === "VIDEO" ? (
  item.posterUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={
        item.posterUrl
      }
      alt={
        item.altText
      }
      className="h-full w-full object-cover"
    />
  ) : (
    <div className="flex h-full items-center justify-center">
      <Film size={18} />
    </div>
  )
) : item.url ? (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={item.url}
    alt={
      item.altText
    }
    className="h-full w-full object-cover"
  />
) : (
  <div className="flex h-full items-center justify-center">
    <Package size={18} />
  </div>
)}
                    {item.type ===
                      "VIDEO" && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                        <Film size={16} />
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          </footer>
        )}
      </div>
    );
  }

  function ProductInformation({
    values,
    brandName,
    categoryName,
    selectedVariant,
    variants,
    variantGroups,
    quantity,
    onQuantityChange,
    onSelectVariant,
  }: {
    values: ProductFormValues;
    brandName?: string | null;
    categoryName?: string | null;
    selectedVariant:
      | ProductVariant
      | null;
    variants: ProductVariant[];
    variantGroups: Array<{
      attributeId: string;
      label: string;
      options: PreviewVariantOption[];
    }>;
    quantity: number;
    onQuantityChange: (
      quantity: number
    ) => void;
    onSelectVariant: (
      variant: ProductVariant
    ) => void;
  }) {
  return (
    <section className="flex flex-col lg:sticky lg:top-6 lg:self-start">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.13em] text-[#6d7175]">
        {brandName && (
          <span>{brandName}</span>
        )}

        {brandName &&
          categoryName && (
            <span>•</span>
          )}

        {categoryName && (
          <span>
            {categoryName}
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#202223] lg:text-4xl">
        {values.name ||
          "Untitled product"}
      </h1>

      {values.shortDescription && (
        <p className="mt-4 text-base leading-7 text-[#5c5f62]">
          {
            values.shortDescription
          }
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            values.status ===
            "ACTIVE"
              ? "bg-green-100 text-green-800"
              : values.status ===
                  "DRAFT"
                ? "bg-amber-100 text-amber-800"
                : "bg-[#eceeef] text-[#5c5f62]",
          ].join(" ")}
        >
          {values.status}
        </span>

        {values.isFeatured && (
          <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-800">
            Featured
          </span>
        )}
      </div>

      <div className="mt-7 rounded-2xl bg-[#f7f7f8] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#6d7175]">
          Selling price
        </p>

        <p className="mt-2 text-3xl font-bold text-[#202223]">
          AED —
        </p>

        <p className="mt-2 text-xs leading-5 text-[#6d7175]">
          Pricing will appear here
          after the Pricing Engine is
          configured.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-[#e1e3e5] px-4 py-3">
  <div>
    <p className="text-sm font-semibold">
      Availability
    </p>

    <p className="mt-1 text-xs text-[#6d7175]">
      Inventory integration will update this automatically.
    </p>
  </div>

  <span
    className={[
      "rounded-full px-3 py-1.5 text-xs font-semibold",
      selectedVariant?.status ===
      "ACTIVE"
        ? "bg-green-100 text-green-800"
        : "bg-amber-100 text-amber-800",
    ].join(" ")}
  >
    {selectedVariant?.status ===
    "ACTIVE"
      ? "In stock"
      : "Unavailable"}
  </span>
</div>

      {variantGroups.length > 0 && (
        <div className="mt-7 space-y-5">
          {variantGroups.map(
            (group) => (
              <div
                key={
                  group.attributeId
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">
                    {group.label}
                  </p>

                  <p className="text-xs text-[#6d7175]">
                    {
                      getSelectedAttributeValue(
                        selectedVariant,
                        group.attributeId
                      )
                    }
                  </p>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                {group.options.map(
  (option) => {
    const variant =
      findVariantForAttributeValue(
        variants,
        selectedVariant,
        group.attributeId,
        option.value
      );

    const selected =
      getSelectedAttributeValue(
        selectedVariant,
        group.attributeId
      ) === option.value;

    const disabled =
      !variant ||
      variant.status ===
        "INACTIVE" ||
      variant.status ===
        "ARCHIVED";

    const hasSwatch =
      Boolean(
        option.swatchValue
      );

    if (hasSwatch) {
      return (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (variant) {
              onSelectVariant(
                variant
              );
            }
          }}
          title={option.value}
          aria-label={`Select ${option.value}`}
          className={[
            "group relative flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2 transition",
            selected
              ? "border-[#202223] ring-2 ring-[#202223] ring-offset-2"
              : "border-[#d8dadd] hover:border-[#202223]",
            disabled
              ? "cursor-not-allowed opacity-40"
              : "",
          ].join(" ")}
        >
          <span
            className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/15 shadow-sm"
            style={{
              backgroundColor:
                option.swatchValue ||
                undefined,
            }}
          >
            {selected && (
              <Check
                size={15}
                className={
                  isLightColor(
                    option.swatchValue
                  )
                    ? "text-black"
                    : "text-white"
                }
              />
            )}
          </span>

          <span className="text-sm font-medium text-[#202223]">
            {option.value}
          </span>
        </button>
      );
    }

    return (
      <button
        key={option.value}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (variant) {
            onSelectVariant(
              variant
            );
          }
        }}
        className={[
          "min-h-10 rounded-lg border px-4 text-sm font-medium transition",
          selected
            ? "border-[#202223] bg-[#202223] text-white"
            : "border-[#d8dadd] bg-white hover:border-[#202223]",
          disabled
            ? "cursor-not-allowed opacity-40"
            : "",
        ].join(" ")}
      >
        {option.value}
      </button>
    );
  }
)}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {selectedVariant && (
        <div className="mt-6 space-y-2 rounded-xl border border-[#e1e3e5] p-4 text-sm">
          <InfoRow
            label="Selected variant"
            value={
              selectedVariant.name
            }
          />

          <InfoRow
            label="SKU"
            value={
              selectedVariant.sku ||
              "—"
            }
            mono
          />

          <InfoRow
            label="Barcode"
            value={
              selectedVariant.barcode ||
              "—"
            }
            mono
          />
        </div>
      )}

<PurchasePanel
  quantity={quantity}
  disabled={
    !selectedVariant ||
    selectedVariant.status !==
      "ACTIVE"
  }
  onQuantityChange={
    onQuantityChange
  }
/>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <TrustItem
          title="Secure checkout"
          description="Protected payments"
        />

        <TrustItem
          title="UAE delivery"
          description="Fast fulfilment"
        />
      </div>
    </section>
  );
}

function PurchasePanel({
    quantity,
    disabled,
    onQuantityChange,
  }: {
    quantity: number;
    disabled: boolean;
    onQuantityChange: (
      quantity: number
    ) => void;
  }) {
    const decrease = () => {
      onQuantityChange(
        Math.max(
          1,
          quantity - 1
        )
      );
    };
  
    const increase = () => {
      onQuantityChange(
        Math.min(
          99,
          quantity + 1
        )
      );
    };
  
    return (
      <div className="mt-7 rounded-2xl border border-[#e1e3e5] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">
              Quantity
            </p>
  
            <p className="mt-1 text-xs text-[#6d7175]">
              Choose up to 99 units
            </p>
          </div>
  
          <div className="flex h-11 items-center overflow-hidden rounded-xl border border-[#d8dadd]">
            <button
              type="button"
              onClick={decrease}
              disabled={
                quantity <= 1
              }
              className="flex h-full w-11 items-center justify-center text-lg font-medium hover:bg-[#f6f6f7] disabled:opacity-35"
              aria-label="Decrease quantity"
            >
              −
            </button>
  
            <input
              type="number"
              min={1}
              max={99}
              value={quantity}
              onChange={(event) => {
                const nextValue =
                  Number(
                    event.target.value
                  );
  
                onQuantityChange(
                  Number.isFinite(
                    nextValue
                  )
                    ? Math.min(
                        99,
                        Math.max(
                          1,
                          nextValue
                        )
                      )
                    : 1
                );
              }}
              className="h-full w-14 border-x border-[#d8dadd] bg-white text-center text-sm font-semibold outline-none"
              aria-label="Quantity"
            />
  
            <button
              type="button"
              onClick={increase}
              disabled={
                quantity >= 99
              }
              className="flex h-full w-11 items-center justify-center text-lg font-medium hover:bg-[#f6f6f7] disabled:opacity-35"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
  
        <button
          type="button"
          disabled={disabled}
          className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#202223] px-6 text-base font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-[#c4c7c9]"
        >
          <ShoppingBag size={19} />
          {disabled
            ? "Unavailable"
            : "Add to cart"}
        </button>
  
        <button
          type="button"
          disabled={disabled}
          className="mt-3 flex h-[52px] w-full items-center justify-center rounded-xl border-2 border-[#202223] bg-white px-6 text-base font-semibold text-[#202223] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:border-[#c4c7c9] disabled:text-[#8c9196]"
        >
          Buy now
        </button>
  
        <p className="mt-3 text-center text-xs leading-5 text-[#6d7175]">
          Checkout actions are disabled in preview mode.
        </p>
      </div>
    );
  }

function ProductDetails({
  values,
  mobile,
}: {
  values: ProductFormValues;
  mobile: boolean;
}) {
  const specifications =
    values.attributeValues.filter(
      (value) =>
        value.displayValue ||
        value.textValue ||
        value.numberValue !==
          null ||
        value.booleanValue !==
          null ||
        value.dateValue
    );

  return (
    <section className="mt-12 border-t border-[#e5e7eb] pt-10">
      <div
        className={[
          "grid gap-10",
          mobile
            ? "grid-cols-1"
            : "lg:grid-cols-2",
        ].join(" ")}
      >
        <div>
          <SectionTitle>
            Product details
          </SectionTitle>

          {values.description ? (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#5c5f62]">
              {values.description}
            </p>
          ) : (
            <EmptyDetail text="No full product description has been added." />
          )}

          {values.features.length >
            0 && (
            <div className="mt-8">
              <h3 className="text-base font-semibold">
                Key features
              </h3>

              <ul className="mt-4 space-y-3">
                {values.features
                  .filter(Boolean)
                  .map(
                    (
                      feature,
                      index
                    ) => (
                      <li
                        key={`${feature}-${index}`}
                        className="flex items-start gap-3 text-sm leading-6 text-[#5c5f62]"
                      >
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                          <Check
                            size={
                              13
                            }
                          />
                        </span>

                        {feature}
                      </li>
                    )
                  )}
              </ul>
            </div>
          )}
        </div>

        <div>
          <SectionTitle>
            Specifications
          </SectionTitle>

          {specifications.length >
          0 ? (
            <dl className="mt-4 overflow-hidden rounded-xl border border-[#e5e7eb]">
              {specifications.map(
                (
                  specification,
                  index
                ) => (
                  <div
                    key={
                      specification.id ||
                      `${specification.attributeId}-${index}`
                    }
                    className="grid grid-cols-[minmax(120px,0.8fr)_minmax(0,1.2fr)] border-b border-[#e5e7eb] last:border-b-0"
                  >
                    <dt className="bg-[#f8f8f9] px-4 py-3 text-sm font-medium text-[#5c5f62]">
                      {
                        specification.attribute
                        ?.name ||
                      specification.attribute
                        ?.name ||
                      "Specification"
                      }
                    </dt>

                    <dd className="px-4 py-3 text-sm text-[#202223]">
                      {
                        getSpecificationValue(
                          specification
                        )
                      }
                    </dd>
                  </div>
                )
              )}
            </dl>
          ) : (
            <EmptyDetail text="No product specifications have been added." />
          )}

          {values.whatsInTheBox
            .filter(Boolean)
            .length > 0 && (
            <div className="mt-8">
              <h3 className="text-base font-semibold">
                What&apos;s in the box
              </h3>

              <ul className="mt-4 space-y-2 text-sm text-[#5c5f62]">
                {values.whatsInTheBox
                  .filter(Boolean)
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <li
                        key={`${item}-${index}`}
                        className="flex items-center gap-3"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-[#202223]" />
                        {item}
                      </li>
                    )
                  )}
              </ul>
            </div>
          )}

          {values.warrantyText && (
            <div className="mt-8 rounded-xl bg-[#f7f7f8] p-5">
              <h3 className="text-sm font-semibold">
                Warranty
              </h3>

              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#5c5f62]">
                {
                  values.warrantyText
                }
              </p>
            </div>
          )}
        </div>

        
      </div>

      
    </section>
  );
}


function ProductReviewsSummary() {
    const ratingDistribution = [
      {
        stars: 5,
        percentage: 0,
      },
      {
        stars: 4,
        percentage: 0,
      },
      {
        stars: 3,
        percentage: 0,
      },
      {
        stars: 2,
        percentage: 0,
      },
      {
        stars: 1,
        percentage: 0,
      },
    ];
  
    return (
      <section className="mt-12 border-t border-[#e5e7eb] pt-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7175]">
              Customer feedback
            </p>
  
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202223]">
              Ratings and reviews
            </h2>
  
            <p className="mt-3 text-sm leading-6 text-[#6d7175]">
              Reviews will appear here once the storefront review module is enabled.
            </p>
          </div>
  
          <div className="grid w-full gap-6 rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm lg:max-w-3xl lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="flex flex-col items-center justify-center rounded-xl bg-[#f7f7f8] p-5 text-center">
              <p className="text-5xl font-bold tracking-tight text-[#202223]">
                0.0
              </p>
  
              <div className="mt-3 flex items-center gap-1">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <Star
                    key={index}
                    size={18}
                    className="text-[#c8cbcf]"
                  />
                ))}
              </div>
  
              <p className="mt-3 text-xs text-[#6d7175]">
                No reviews yet
              </p>
            </div>
  
            <div className="space-y-3">
              {ratingDistribution.map(
                (item) => (
                  <div
                    key={item.stars}
                    className="grid grid-cols-[34px_minmax(0,1fr)_42px] items-center gap-3"
                  >
                    <span className="text-sm font-medium text-[#5c5f62]">
                      {item.stars}
                    </span>
  
                    <div className="h-2 overflow-hidden rounded-full bg-[#eceeef]">
                      <div
                        className="h-full rounded-full bg-[#202223]"
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />
                    </div>
  
                    <span className="text-right text-xs text-[#6d7175]">
                      {item.percentage}%
                    </span>
                  </div>
                )
              )}
  
              <button
                type="button"
                disabled
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-[#d8dadd] bg-white px-4 text-sm font-semibold text-[#8c9196] disabled:cursor-not-allowed"
              >
                Write a review
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  function RelatedProductsPlaceholder({
    mobile,
  }: {
    mobile: boolean;
  }) {
    const placeholders = [
      {
        id: "related-1",
        label: "Related product",
      },
      {
        id: "related-2",
        label: "You may also like",
      },
      {
        id: "related-3",
        label: "Recommended",
      },
      {
        id: "related-4",
        label: "Popular choice",
      },
    ];
  
    return (
      <section className="mt-12 border-t border-[#e5e7eb] pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6d7175]">
              Recommendations
            </p>
  
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#202223]">
              Related products
            </h2>
  
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d7175]">
              Recommendations will be populated later using category, brand, pricing and customer-behaviour data.
            </p>
          </div>
  
          <button
            type="button"
            disabled
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d8dadd] bg-white px-4 text-sm font-semibold text-[#8c9196] disabled:cursor-not-allowed"
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>
  
        <div
          className={[
            "mt-6 grid gap-4",
            mobile
              ? "grid-cols-1"
              : "sm:grid-cols-2 xl:grid-cols-4",
          ].join(" ")}
        >
          {placeholders.map(
            (item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm"
              >
                <div className="flex aspect-square items-center justify-center bg-[#f7f7f8]">
                  <Package
                    size={42}
                    className="text-[#b0b4b8]"
                  />
                </div>
  
                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8c9196]">
                    Placeholder
                  </p>
  
                  <h3 className="mt-2 text-sm font-semibold text-[#202223]">
                    {item.label}
                  </h3>
  
                  <p className="mt-2 text-sm text-[#6d7175]">
                    Product data will appear here.
                  </p>
  
                  <div className="mt-4 h-4 w-24 rounded bg-[#eceeef]" />
  
                  <button
                    type="button"
                    disabled
                    className="mt-5 inline-flex h-9 w-full items-center justify-center rounded-lg border border-[#d8dadd] bg-white text-sm font-semibold text-[#8c9196] disabled:cursor-not-allowed"
                  >
                    View product
                  </button>
                </div>
              </article>
            )
          )}
        </div>
      </section>
    );
  }

function SectionTitle({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <h2 className="text-xl font-bold tracking-tight">
      {children}
    </h2>
  );
}

function EmptyDetail({
  text,
}: {
  text: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-[#d8dadd] p-5 text-sm text-[#8c9196]">
      {text}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[#6d7175]">
        {label}
      </span>

      <span
        className={[
          "max-w-[65%] break-words text-right font-medium",
          mono
            ? "font-mono text-xs"
            : "",
        ].join(" ")}
      >
        {value}
      </span>
    </div>
  );
}

function TrustItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] p-3">
      <p className="font-semibold text-[#202223]">
        {title}
      </p>

      <p className="mt-1 text-[#6d7175]">
        {description}
      </p>
    </div>
  );
}

function mapProductMediaToPreview(
  image: ProductImage
): PreviewMediaItem {
  const asset =
    image.mediaAsset || null;

  const isVideo =
    asset?.assetType ===
      "VIDEO" ||
    image.imageRole ===
      "VIDEO";

  return {
    id:
      image.mediaAssetId,

    type: isVideo
      ? "VIDEO"
      : "IMAGE",

    url: asset
      ? getMediaUrl(
          asset,
          isVideo
            ? "VIDEO"
            : "IMAGE"
        )
      : null,

    posterUrl:
      asset && isVideo
        ? getVideoPosterUrl(
            asset
          )
        : null,

    altText:
      image.altText ||
      asset?.altText ||
      asset?.title ||
      asset
        ?.originalFileName ||
      "Product media",

    title:
      image.title ||
      asset?.title ||
      asset
        ?.originalFileName ||
      "Product media",

    displayOrder:
      Number(
        image.displayOrder || 0
      ),
  };
}

function getMediaUrl(
  asset: NonNullable<
    ProductImage["mediaAsset"]
  >,
  type: "IMAGE" | "VIDEO"
): string | null {
  const raw =
    type === "VIDEO"
      ? asset.variants?.find(
          (variant) =>
            variant.variantType ===
              "PREVIEW" &&
            variant.format ===
              "mp4" &&
            variant.publicUrl
        )?.publicUrl ||
        asset.publicUrl ||
        asset.variants?.find(
          (variant) =>
            variant.variantType ===
              "ORIGINAL" &&
            variant.publicUrl
        )?.publicUrl ||
        null
      : asset.variants?.find(
          (variant) =>
            variant.variantType ===
              "PREVIEW" &&
            variant.publicUrl
        )?.publicUrl ||
        asset.variants?.find(
          (variant) =>
            variant.variantType ===
              "LARGE" &&
            variant.publicUrl
        )?.publicUrl ||
        asset.publicUrl ||
        null;

  return buildAbsoluteMediaUrl(
    raw
  );
}

function getVideoPosterUrl(
  asset: NonNullable<
    ProductImage["mediaAsset"]
  >
): string | null {
  const raw =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "PREVIEW" &&
        ["jpg", "jpeg", "webp"].includes(
          String(
            variant.format
          ).toLowerCase()
        ) &&
        variant.publicUrl
    )?.publicUrl ||
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.publicUrl
    )?.publicUrl ||
    asset.previewPath ||
    asset.thumbnailPath ||
    null;

  return buildAbsoluteMediaUrl(
    raw
  );
}

function buildAbsoluteMediaUrl(
  raw?: string | null
): string | null {
  if (!raw) {
    return null;
  }

  if (
    /^(https?:|data:|blob:)/.test(
      raw
    )
  ) {
    return raw;
  }

  const backendUrl =
    process.env
      .NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:5080";

  let mediaPath =
    raw.startsWith("/")
      ? raw
      : `/${raw}`;

  if (
    !mediaPath.startsWith(
      "/media/"
    )
  ) {
    mediaPath =
      `/media${mediaPath}`;
  }

  return `${backendUrl.replace(
    /\/+$/,
    ""
  )}${mediaPath}`;
}

function getVariantKey(
  variant: ProductVariant
): string {
  return (
    variant.id ||
    variant.variantKey ||
    variant.sku
  );
}

function buildVariantGroups(
    variants: ProductVariant[]
  ): Array<{
    attributeId: string;
    label: string;
    options: PreviewVariantOption[];
  }> {
    const groups = new Map<
      string,
      {
        label: string;
        options: Map<
          string,
          PreviewVariantOption
        >;
      }
    >();
  
    variants.forEach(
      (variant) => {
        variant.attributeValues.forEach(
          (attributeValue) => {
            const displayValue =
              attributeValue.displayValue ||
              attributeValue.option
                ?.label;
  
            if (!displayValue) {
              return;
            }
  
            const swatchValue =
              attributeValue.option
                ?.swatchValue ||
              null;
  
              const attributeLabel =
              attributeValue.attribute
                ?.name ||
                attributeValue.attribute
                ?.name ||
              "Option"
  
            const existingGroup =
              groups.get(
                attributeValue.attributeId
              );
  
            if (existingGroup) {
              if (
                !existingGroup.options.has(
                  displayValue
                )
              ) {
                existingGroup.options.set(
                  displayValue,
                  {
                    value:
                      displayValue,
  
                    swatchValue,
                  }
                );
              } else if (
                swatchValue &&
                !existingGroup.options.get(
                  displayValue
                )?.swatchValue
              ) {
                existingGroup.options.set(
                  displayValue,
                  {
                    value:
                      displayValue,
  
                    swatchValue,
                  }
                );
              }
  
              return;
            }
  
            groups.set(
              attributeValue.attributeId,
              {
                label:
                  attributeLabel,
  
                options:
                  new Map([
                    [
                      displayValue,
                      {
                        value:
                          displayValue,
  
                        swatchValue,
                      },
                    ],
                  ]),
              }
            );
          }
        );
      }
    );
  
    return Array.from(
      groups.entries()
    ).map(
      ([
        attributeId,
        group,
      ]) => ({
        attributeId,
        label: group.label,
        options: Array.from(
          group.options.values()
        ),
      })
    );
  }

function getSelectedAttributeValue(
  variant:
    | ProductVariant
    | null,
  attributeId: string
): string {
  if (!variant) {
    return "";
  }

  const value =
    variant.attributeValues.find(
      (item) =>
        item.attributeId ===
        attributeId
    );

  return (
    value?.displayValue ||
    value?.option?.label ||
    ""
  );
}

function findVariantForAttributeValue(
  variants: ProductVariant[],
  selectedVariant:
    | ProductVariant
    | null,
  attributeId: string,
  displayValue: string
): ProductVariant | undefined {
  return variants.find(
    (variant) => {
      const hasRequestedValue =
        variant.attributeValues.some(
          (item) =>
            item.attributeId ===
              attributeId &&
            (
              item.displayValue ||
              item.option?.label
            ) === displayValue
        );

      if (!hasRequestedValue) {
        return false;
      }

      if (!selectedVariant) {
        return true;
      }

      return selectedVariant
        .attributeValues
        .filter(
          (item) =>
            item.attributeId !==
            attributeId
        )
        .every(
          (selectedValue) => {
            const selectedDisplay =
              selectedValue.displayValue ||
              selectedValue.option
                ?.label;

            return variant
              .attributeValues
              .some(
                (item) =>
                  item.attributeId ===
                    selectedValue.attributeId &&
                  (
                    item.displayValue ||
                    item.option?.label
                  ) ===
                    selectedDisplay
              );
          }
        );
    }
  );
}

function isLightColor(
    color?: string | null
  ): boolean {
    if (!color) {
      return false;
    }
  
    const normalized =
      color.trim();
  
    if (
      !normalized.startsWith(
        "#"
      )
    ) {
      return false;
    }
  
    let hex =
      normalized.slice(1);
  
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map(
          (character) =>
            character + character
        )
        .join("");
    }
  
    if (hex.length !== 6) {
      return false;
    }
  
    const red =
      parseInt(
        hex.slice(0, 2),
        16
      );
  
    const green =
      parseInt(
        hex.slice(2, 4),
        16
      );
  
    const blue =
      parseInt(
        hex.slice(4, 6),
        16
      );
  
    if (
      [red, green, blue].some(
        (value) =>
          Number.isNaN(value)
      )
    ) {
      return false;
    }
  
    const brightness =
      (red * 299 +
        green * 587 +
        blue * 114) /
      1000;
  
    return brightness > 180;
  }

function getSpecificationValue(
  value: ProductFormValues["attributeValues"][number]
): string {
  if (value.displayValue) {
    return value.displayValue;
  }

  if (value.textValue) {
    return value.textValue;
  }

  if (
    value.numberValue !==
      null &&
    value.numberValue !==
      undefined
  ) {
    return String(
      value.numberValue
    );
  }

  if (
    value.booleanValue !==
      null &&
    value.booleanValue !==
      undefined
  ) {
    return value.booleanValue
      ? "Yes"
      : "No";
  }

  if (value.dateValue) {
    return value.dateValue;
  }

  return "—";
}