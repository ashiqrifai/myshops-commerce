"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Check,
  Film,
  ImageIcon,
  LoaderCircle,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import type {
  DragEndEvent,
} from "@dnd-kit/core";

import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  useGetMediaAssetsQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
} from "@/types/media";

import type {
  ProductImage,
} from "@/types/product";

import SortableProductMediaItem from "./SortableProductMediaItem";

type MediaTab =
  | "IMAGE"
  | "VIDEO";

interface Props {
  images: ProductImage[];

  onChange: (
    images: ProductImage[]
  ) => void;

  variantId?: string | null;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

const isVideoProductMedia = (
  image: ProductImage
): boolean => {
  return (
    image.mediaAsset?.assetType ===
      "VIDEO" ||
    image.imageRole === "VIDEO"
  );
};

const normalizeProductMedia = (
  images: ProductImage[]
): ProductImage[] => {
  let primaryAssigned = false;

  return images.map(
    (image, index) => {
      const isVideo =
        isVideoProductMedia(image);

      if (isVideo) {
        return {
          ...image,
          imageRole: "VIDEO",
          displayOrder: index,
        };
      }

      if (!primaryAssigned) {
        primaryAssigned = true;

        return {
          ...image,
          imageRole: "PRIMARY",
          displayOrder: index,
        };
      }

      return {
        ...image,

        imageRole:
          image.imageRole ===
          "PRIMARY"
            ? "GALLERY"
            : image.imageRole,

        displayOrder: index,
      };
    }
  );
};

export default function ProductMediaManager({
  images,
  onChange,
  variantId = null,
  title = "Add product media",
  description =
    "Choose images or videos from Media Studio.",
  emptyTitle = "Add product media",
  emptyDescription =
    "Select images or videos from Media Studio",
}: Props) {
  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    mediaTab,
    setMediaTab,
  ] = useState<MediaTab>(
    "IMAGE"
  );

  const {
    data,
    isLoading,
    isFetching,
  } = useGetMediaAssetsQuery({
    page: 1,
    pageSize: 100,

    search:
      open &&
      search.trim()
        ? search.trim()
        : undefined,

    assetType: mediaTab,

    status: "READY",
    isActive: true,

    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  const assets =
    data?.data || [];

  const selectedIds = useMemo(
    () =>
      new Set(
        images.map(
          (item) =>
            item.mediaAssetId
        )
      ),
    [images]
  );

  /*
   * A product cannot contain the same
   * Media Studio asset twice, so
   * mediaAssetId is a stable sortable ID.
   */
  const sortableIds = useMemo(
    () =>
      images.map(
        (image) =>
          image.mediaAssetId
      ),
    [images]
  );

  const sensors = useSensors(
    useSensor(
      PointerSensor,
      {
        activationConstraint: {
          distance: 6,
        },
      }
    ),

    useSensor(
      KeyboardSensor,
      {
        coordinateGetter:
          sortableKeyboardCoordinates,
      }
    )
  );

  const addAsset = (
    asset: MediaAsset
  ) => {
    if (
      selectedIds.has(asset.id)
    ) {
      return;
    }

    const isVideo =
      asset.assetType ===
      "VIDEO";

    const hasPrimary =
      images.some(
        (image) =>
          image.imageRole ===
          "PRIMARY" &&
          !isVideoProductMedia(
            image
          )
      );

    const next: ProductImage[] = [
      ...images,

      {
        mediaAssetId: asset.id,

        variantId:
          variantId || null,

        imageRole:
          isVideo
            ? "VIDEO"
            : hasPrimary
              ? "GALLERY"
              : "PRIMARY",

        altText:
          asset.altText ||
          asset.title ||
          asset.originalFileName,

        title:
          asset.title ||
          asset.originalFileName,

        displayOrder:
          images.length,

        isActive: true,

        mediaAsset: asset,
      },
    ];

    onChange(
      normalizeProductMedia(next)
    );
  };

  const update = (
    index: number,
    patch: Partial<ProductImage>
  ) => {
    const currentImage =
      images[index];

    if (!currentImage) {
      return;
    }

    const currentIsVideo =
      isVideoProductMedia(
        currentImage
      );

    /*
     * Videos may only have the VIDEO role.
     */
    const safePatch:
      Partial<ProductImage> =
      currentIsVideo
        ? {
            ...patch,
            imageRole: "VIDEO",
          }
        : patch;

    let next = images.map(
      (image, itemIndex) =>
        itemIndex === index
          ? {
              ...image,
              ...safePatch,
            }
          : image
    );

    /*
     * When an image is manually made
     * primary, demote the previous primary.
     */
    if (
      safePatch.imageRole ===
      "PRIMARY" &&
      !currentIsVideo
    ) {
      next = next.map(
        (image, itemIndex) => {
          if (
            isVideoProductMedia(
              image
            )
          ) {
            return {
              ...image,
              imageRole: "VIDEO",
            };
          }

          if (
            itemIndex === index
          ) {
            return {
              ...image,
              imageRole: "PRIMARY",
            };
          }

          if (
            image.imageRole ===
            "PRIMARY"
          ) {
            return {
              ...image,
              imageRole: "GALLERY",
            };
          }

          return image;
        }
      );
    }

    onChange(
      next.map(
        (image, itemIndex) => ({
          ...image,
          displayOrder:
            itemIndex,
        })
      )
    );
  };

  const remove = (
    index: number
  ) => {
    const next = images
      .filter(
        (_, itemIndex) =>
          itemIndex !== index
      )
      .map(
        (image, itemIndex) => ({
          ...image,
          displayOrder:
            itemIndex,
        })
      );

    onChange(
      normalizeProductMedia(next)
    );
  };

  const handleDragEnd = (
    event: DragEndEvent
  ) => {
    const {
      active,
      over,
    } = event;

    if (
      !over ||
      active.id === over.id
    ) {
      return;
    }

    const oldIndex =
      sortableIds.indexOf(
        String(active.id)
      );

    const newIndex =
      sortableIds.indexOf(
        String(over.id)
      );

    if (
      oldIndex === -1 ||
      newIndex === -1
    ) {
      return;
    }

    const reordered =
      arrayMove(
        images,
        oldIndex,
        newIndex
      );

    /*
     * The first non-video media item becomes
     * the product's primary image.
     */
    onChange(
      normalizeProductMedia(
        reordered
      )
    );
  };

  return (
    <div className="space-y-4">
      {images.length === 0 ? (
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#babfc3] bg-[#fafbfb] px-5 py-8 hover:bg-[#f6f6f7]"
        >
          <div className="flex items-center gap-2 text-[#6d7175]">
            <ImageIcon
              size={29}
            />

            <Film size={27} />
          </div>

          <span className="mt-3 text-sm font-semibold">
            {emptyTitle}
          </span>

          <span className="mt-1 text-xs text-[#6d7175]">
            {emptyDescription}
          </span>
        </button>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={
            closestCenter
          }
          onDragEnd={
            handleDragEnd
          }
        >
          <SortableContext
            items={sortableIds}
            strategy={
              verticalListSortingStrategy
            }
          >
            <div className="space-y-3">
              {images.map(
                (
                  image,
                  index
                ) => {
                  const asset =
                    image.mediaAsset ||
                    null;

                  const isVideo =
                    isVideoProductMedia(
                      image
                    );

                  const url = asset
                    ? getAssetUrl(
                        asset
                      )
                    : null;

                  return (
                    <SortableProductMediaItem
                      key={
                        image.mediaAssetId
                      }
                      image={image}
                      index={index}
                      url={url}
                      isVideo={
                        isVideo
                      }
                      onUpdate={
                        update
                      }
                      onRemove={
                        remove
                      }
                    />
                  );
                }
              )}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setOpen(true)
          }
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
        >
          <Plus size={17} />

          Add media
        </button>

        {images.length > 1 && (
          <p className="text-xs text-[#6d7175]">
            Drag the handle to
            reorder media. The first
            image becomes the primary
            product image.
          </p>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {title}
                </h2>

                <p className="mt-1 text-sm text-[#6d7175]">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                }}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
                aria-label="Close media selector"
              >
                <X size={19} />
              </button>
            </header>

            <div className="border-b border-[#e1e3e5] px-4 pt-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMediaTab(
                      "IMAGE"
                    );
                    setSearch("");
                  }}
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-t-lg border border-b-0 px-4 text-sm font-semibold",
                    mediaTab ===
                    "IMAGE"
                      ? "border-[#babfc3] bg-white text-[#303030]"
                      : "border-transparent bg-[#f6f6f7] text-[#6d7175]",
                  ].join(" ")}
                >
                  <ImageIcon
                    size={17}
                  />

                  Images
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaTab(
                      "VIDEO"
                    );
                    setSearch("");
                  }}
                  className={[
                    "inline-flex h-10 items-center gap-2 rounded-t-lg border border-b-0 px-4 text-sm font-semibold",
                    mediaTab ===
                    "VIDEO"
                      ? "border-[#babfc3] bg-white text-[#303030]"
                      : "border-transparent bg-[#f6f6f7] text-[#6d7175]",
                  ].join(" ")}
                >
                  <Film size={17} />

                  Videos
                </button>
              </div>
            </div>

            <div className="border-b border-[#e1e3e5] p-4">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value
                    )
                  }
                  className="admin-input pl-10"
                  placeholder={
                    mediaTab ===
                    "VIDEO"
                      ? "Search video assets..."
                      : "Search image assets..."
                  }
                  autoFocus
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isLoading ||
              isFetching ? (
                <div className="flex min-h-80 items-center justify-center">
                  <LoaderCircle className="animate-spin" />
                </div>
              ) : assets.length ===
                0 ? (
                <div className="flex min-h-80 items-center justify-center text-center">
                  <div>
                    {mediaTab ===
                    "VIDEO" ? (
                      <Film
                        size={32}
                        className="mx-auto text-[#8c9196]"
                      />
                    ) : (
                      <ImageIcon
                        size={32}
                        className="mx-auto text-[#8c9196]"
                      />
                    )}

                    <p className="mt-3 text-sm font-semibold">
                      No ready{" "}
                      {mediaTab ===
                      "VIDEO"
                        ? "videos"
                        : "images"}{" "}
                      found
                    </p>

                    <p className="mt-1 text-xs text-[#6d7175]">
                      Upload the media
                      in Media Studio
                      first.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {assets.map(
                    (asset) => {
                      const selected =
                        selectedIds.has(
                          asset.id
                        );

                      const url =
                        getAssetUrl(
                          asset
                        );

                      const isVideo =
                        asset.assetType ===
                        "VIDEO";

                      return (
                        <button
                          key={asset.id}
                          type="button"
                          disabled={
                            selected
                          }
                          onClick={() =>
                            addAsset(
                              asset
                            )
                          }
                          className={[
                            "overflow-hidden rounded-xl border bg-white text-left transition",
                            selected
                              ? "cursor-not-allowed border-[#005bd3] opacity-65"
                              : "border-[#e1e3e5] hover:border-[#babfc3] hover:shadow-md",
                          ].join(
                            " "
                          )}
                        >
                          <div className="relative aspect-square overflow-hidden bg-[#f6f6f7]">
                            {url ? (
                              isVideo ? (
                                <video
                                  src={
                                    url
                                  }
                                  muted
                                  preload="metadata"
                                  playsInline
                                  onMouseEnter={(
                                    event
                                  ) => {
                                    void event.currentTarget.play();
                                  }}
                                  onMouseLeave={(
                                    event
                                  ) => {
                                    event.currentTarget.pause();
                                    event.currentTarget.currentTime =
                                      0;
                                  }}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    url
                                  }
                                  alt={
                                    asset.altText ||
                                    asset.title ||
                                    asset.originalFileName
                                  }
                                  className="h-full w-full object-cover"
                                />
                              )
                            ) : isVideo ? (
                              <div className="flex h-full items-center justify-center">
                                <Film
                                  size={
                                    30
                                  }
                                  className="text-[#8c9196]"
                                />
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center">
                                <ImageIcon
                                  size={
                                    28
                                  }
                                  className="text-[#8c9196]"
                                />
                              </div>
                            )}

                            <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                              {isVideo
                                ? "Video"
                                : "Image"}
                            </span>

                            {selected && (
                              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#005bd3] text-white">
                                <Check
                                  size={
                                    16
                                  }
                                />
                              </span>
                            )}
                          </div>

                          <div className="p-3">
                            <p className="truncate text-sm font-semibold">
                              {asset.title ||
                                asset.originalFileName}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#6d7175]">
                              {
                                asset.originalFileName
                              }
                            </p>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAssetUrl(
  asset: MediaAsset
): string | null {
  /*
   * For videos, prefer the original playable
   * media URL until FFmpeg preview variants
   * are introduced.
   *
   * For images, prefer optimized preview and
   * thumbnail variants.
   */
  const isVideo =
    asset.assetType === "VIDEO";

  const raw = isVideo
    ? asset.publicUrl ||
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
            "THUMBNAIL" &&
          variant.publicUrl
      )?.publicUrl ||
      asset.previewPath ||
      asset.thumbnailPath ||
      asset.publicUrl ||
      null;

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