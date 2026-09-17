"use client";

import {
  Check,
  FileText,
  FileVideo,
  Folder,
  FolderOpen,
  ImageIcon,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useGetMediaAssetsQuery,
  useGetMediaFolderTreeQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
  MediaAssetClassification,
  MediaFolderTreeNode,
} from "@/types/media";

interface MediaAssetPickerProps {
  isOpen: boolean;

  selectedAssetId?: string | null;

  title?: string;
  description?: string;

  classification?: MediaAssetClassification;

  allowPdf?: boolean;
  allowVideo?: boolean;

  onClose: () => void;

  onSelect: (
    asset: MediaAsset
  ) => void;
}

interface FolderNodeProps {
  folder: MediaFolderTreeNode;
  level: number;
  selectedFolderId: string | null;

  onSelectFolder: (
    folderId: string
  ) => void;
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

/*
|--------------------------------------------------------------------------
| Asset thumbnail / preview
|--------------------------------------------------------------------------
|
| IMAGE:
| - Normally has WebP thumbnail/preview.
|
| VIDEO:
| - Video processor generates a JPG THUMBNAIL
|   and JPG PREVIEW/poster.
|
| Therefore we deliberately do NOT restrict
| thumbnail format to WebP.
|--------------------------------------------------------------------------
*/

const getAssetThumbnailUrl = (
  asset: MediaAsset
): string | null => {
  const thumbnailVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.isActive &&
        Boolean(
          variant.publicUrl
        )
    );

  const imagePreviewVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.isActive &&
        Boolean(
          variant.publicUrl
        ) &&
        String(
          variant.mimeType || ""
        ).startsWith(
          "image/"
        )
    );

  const primaryImageVariant =
    asset.variants?.find(
      (variant) =>
        variant.isPrimary &&
        variant.isActive &&
        Boolean(
          variant.publicUrl
        ) &&
        String(
          variant.mimeType || ""
        ).startsWith(
          "image/"
        )
    );

  return resolveMediaUrl(
    thumbnailVariant?.publicUrl ||
      imagePreviewVariant?.publicUrl ||
      primaryImageVariant?.publicUrl ||
      asset.thumbnailPath ||
      asset.previewPath ||
      (
        asset.assetType ===
        "IMAGE"
          ? asset.publicUrl
          : null
      )
  );
};

const formatFileSize = (
  value: string | number
): string => {
  const bytes = Number(
    value || 0
  );

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(2)} MB`;
};

const formatDuration = (
  value:
    | string
    | number
    | null
    | undefined
): string | null => {
  const seconds =
    Number(value);

  if (
    !Number.isFinite(
      seconds
    ) ||
    seconds <= 0
  ) {
    return null;
  }

  const totalSeconds =
    Math.round(seconds);

  const minutes =
    Math.floor(
      totalSeconds / 60
    );

  const remainder =
    totalSeconds % 60;

  if (minutes <= 0) {
    return `${remainder}s`;
  }

  return `${minutes}:${String(
    remainder
  ).padStart(2, "0")}`;
};

function FolderNode({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
}: FolderNodeProps) {
  const [
    expanded,
    setExpanded,
  ] =
    useState(
      level === 0
    );

  const hasChildren =
    Array.isArray(
      folder.children
    ) &&
    folder.children.length >
      0;

  const selected =
    selectedFolderId ===
    folder.id;

  return (
    <div>
      <div
        className={[
          "flex items-center rounded-lg",
          selected
            ? "bg-[#ebebeb]"
            : "hover:bg-[#f6f6f7]",
        ].join(" ")}
        style={{
          paddingLeft:
            `${level * 12}px`,
        }}
      >
        <button
          type="button"
          disabled={!hasChildren}
          onClick={() =>
            setExpanded(
              (current) =>
                !current
            )
          }
          className="flex h-9 w-7 shrink-0 items-center justify-center text-[#6d7175] disabled:opacity-30"
          aria-label={
            expanded
              ? "Collapse folder"
              : "Expand folder"
          }
        >
          {hasChildren ? (
            <span className="text-xs">
              {expanded
                ? "−"
                : "+"}
            </span>
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectFolder(
              folder.id
            )
          }
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
        >
          {selected ||
          expanded ? (
            <FolderOpen
              size={16}
              className="shrink-0 text-[#6d7175]"
            />
          ) : (
            <Folder
              size={16}
              className="shrink-0 text-[#6d7175]"
            />
          )}

          <span className="min-w-0 flex-1 truncate text-sm">
            {folder.name}
          </span>

          {folder.assetCount !==
            undefined && (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-[#6d7175]">
              {Number(
                folder.assetCount
              )}
            </span>
          )}
        </button>
      </div>

      {expanded &&
      hasChildren && (
        <div>
          {folder.children.map(
            (
              childFolder
            ) => (
              <FolderNode
                key={
                  childFolder.id
                }
                folder={
                  childFolder
                }
                level={
                  level + 1
                }
                selectedFolderId={
                  selectedFolderId
                }
                onSelectFolder={
                  onSelectFolder
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function MediaAssetPicker({
  isOpen,
  selectedAssetId = null,

  title =
    "Select media",

  description =
    "Choose an asset from the shared digital asset library.",

  classification,

  allowPdf = false,
  allowVideo = false,

  onClose,
  onSelect,
}: MediaAssetPickerProps) {
  const [
    selectedFolderId,
    setSelectedFolderId,
  ] =
    useState<
      string | null
    >(null);

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    classificationFilter,
    setClassificationFilter,
  ] =
    useState<
      | MediaAssetClassification
      | ""
    >(
      classification ||
        ""
    );

  const [
    temporarySelectedAssetId,
    setTemporarySelectedAssetId,
  ] =
    useState<
      string | null
    >(
      selectedAssetId
    );

  const {
    data:
      folderResponse,

    isLoading:
      isLoadingFolders,
  } =
    useGetMediaFolderTreeQuery(
      undefined,
      {
        skip:
          !isOpen,
      }
    );

  /*
  |--------------------------------------------------------------------------
  | Asset query
  |--------------------------------------------------------------------------
  |
  | API currently has one assetType filter.
  |
  | IMAGE only:
  |   assetType=IMAGE
  |
  | IMAGE + VIDEO / PDF:
  |   retrieve eligible READY assets and filter
  |   locally below.
  |--------------------------------------------------------------------------
  */

  const {
    data:
      assetResponse,

    isLoading:
      isLoadingAssets,

    isFetching:
      isFetchingAssets,
  } =
    useGetMediaAssetsQuery(
      {
        page: 1,

        /*
         * Keep within backend validator maximum.
         */
        pageSize: 60,

        folderId:
          selectedFolderId ||
          undefined,

        search:
          search.trim() ||
          undefined,

        assetType:
          allowPdf ||
          allowVideo
            ? undefined
            : "IMAGE",

        classification:
          classificationFilter ||
          undefined,

        isActive: true,
        status: "READY",

        sortBy:
          "createdAt",

        sortDirection:
          "DESC",
      },
      {
        skip:
          !isOpen,
      }
    );

  const folders =
    useMemo(
      () =>
        folderResponse?.data ||
        [],
      [
        folderResponse
          ?.data,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Allowed assets
  |--------------------------------------------------------------------------
  |
  | Default:
  |   IMAGE
  |
  | allowVideo:
  |   IMAGE + VIDEO
  |
  | allowPdf:
  |   IMAGE + PDF
  |
  | Both:
  |   IMAGE + VIDEO + PDF
  |--------------------------------------------------------------------------
  */

  const assets =
    useMemo(() => {
      const rawAssets =
        assetResponse
          ?.data ||
        [];

      return rawAssets.filter(
        (asset) => {
          if (
            asset.assetType ===
            "IMAGE"
          ) {
            return true;
          }

          if (
            allowVideo &&
            asset.assetType ===
              "VIDEO"
          ) {
            return true;
          }

          if (
            allowPdf &&
            asset.assetType ===
              "PDF"
          ) {
            return true;
          }

          return false;
        }
      );
    }, [
      assetResponse?.data,
      allowPdf,
      allowVideo,
    ]);

  const selectedAsset =
    useMemo(
      () =>
        assets.find(
          (asset) =>
            asset.id ===
            temporarySelectedAssetId
        ) ||
        null,
      [
        assets,
        temporarySelectedAssetId,
      ]
    );

  const handleConfirm =
    () => {
      if (
        !selectedAsset
      ) {
        return;
      }

      onSelect(
        selectedAsset
      );
    };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4">
      <div className="flex h-[88vh] w-full max-w-[1180px] flex-col overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-2xl">
        {/*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */}

        <header className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              {title}
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              {
                description
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
            aria-label="Close media picker"
          >
            <X
              size={19}
            />
          </button>
        </header>

        {/*
        |--------------------------------------------------------------------------
        | Body
        |--------------------------------------------------------------------------
        */}

        <div className="grid min-h-0 flex-1 grid-cols-[230px_minmax(0,1fr)]">
          {/*
          |--------------------------------------------------------------------------
          | Folders
          |--------------------------------------------------------------------------
          */}

          <aside className="overflow-y-auto border-r border-[#e1e3e5] p-4">
            <button
              type="button"
              onClick={() =>
                setSelectedFolderId(
                  null
                )
              }
              className={[
                "mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm",

                selectedFolderId ===
                null
                  ? "bg-[#ebebeb] font-medium"
                  : "hover:bg-[#f6f6f7]",
              ].join(
                " "
              )}
            >
              <ImageIcon
                size={16}
                className="text-[#6d7175]"
              />

              All assets
            </button>

            {isLoadingFolders ? (
              <div className="flex justify-center py-8">
                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />
              </div>
            ) : (
              <div className="space-y-1">
                {folders.map(
                  (
                    folder
                  ) => (
                    <FolderNode
                      key={
                        folder.id
                      }
                      folder={
                        folder
                      }
                      level={
                        0
                      }
                      selectedFolderId={
                        selectedFolderId
                      }
                      onSelectFolder={
                        setSelectedFolderId
                      }
                    />
                  )
                )}
              </div>
            )}
          </aside>

          {/*
          |--------------------------------------------------------------------------
          | Asset area
          |--------------------------------------------------------------------------
          */}

          <main className="flex min-w-0 flex-col">
            {/*
            |--------------------------------------------------------------------------
            | Search / Classification
            |--------------------------------------------------------------------------
            */}

            <div className="border-b border-[#e1e3e5] p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_200px]">
                <div className="relative">
                  <Search
                    size={
                      17
                    }
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />

                  <input
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                    className="admin-input pl-10"
                    placeholder="Search media"
                  />
                </div>

                <select
                  value={
                    classificationFilter
                  }
                  onChange={(
                    event
                  ) =>
                    setClassificationFilter(
                      event
                        .target
                        .value as
                        | MediaAssetClassification
                        | ""
                    )
                  }
                  className="admin-input"
                >
                  <option value="">
                    All classifications
                  </option>

                  <option value="PRODUCT">
                    Product
                  </option>

                  <option value="CMS">
                    CMS
                  </option>

                  <option value="MARKETING">
                    Marketing
                  </option>

                  <option value="BRAND">
                    Brand
                  </option>

                  <option value="CATEGORY">
                    Category
                  </option>

                  <option value="PROMOTION">
                    Promotion
                  </option>

                  <option value="STORE">
                    Store
                  </option>

                  <option value="AI">
                    AI
                  </option>

                  <option value="DOWNLOAD">
                    Download
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>
              </div>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Assets
            |--------------------------------------------------------------------------
            */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {isLoadingAssets ? (
                <div className="flex h-full min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <LoaderCircle className="mx-auto animate-spin" />

                    <p className="mt-3 text-sm text-[#6d7175]">
                      Loading media assets...
                    </p>
                  </div>
                </div>
              ) : assets.length ===
                0 ? (
                <div className="flex h-full min-h-[320px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
                      <ImageIcon
                        size={
                          26
                        }
                      />
                    </div>

                    <h3 className="mt-4 text-base font-semibold">
                      No assets found
                    </h3>

                    <p className="mt-1 text-sm text-[#6d7175]">
                      Adjust the folder,
                      search, or
                      classification.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#6d7175]">
                      {
                        assets.length
                      }{" "}
                      assets
                    </p>

                    {isFetchingAssets && (
                      <div className="flex items-center gap-2 text-xs text-[#6d7175]">
                        <LoaderCircle
                          size={
                            14
                          }
                          className="animate-spin"
                        />

                        Updating
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {assets.map(
                      (
                        asset
                      ) => {
                        const thumbnailUrl =
                          getAssetThumbnailUrl(
                            asset
                          );

                        const selected =
                          temporarySelectedAssetId ===
                          asset.id;

                        const duration =
                          formatDuration(
                            asset.durationSeconds
                          );

                        return (
                          <button
                            key={
                              asset.id
                            }
                            type="button"
                            onClick={() =>
                              setTemporarySelectedAssetId(
                                asset.id
                              )
                            }
                            className={[
                              "group overflow-hidden rounded-xl border bg-white text-left transition",

                              selected
                                ? "border-[#303030] ring-2 ring-[#303030]"
                                : "border-[#e1e3e5] hover:border-[#babfc3] hover:shadow-md",
                            ].join(
                              " "
                            )}
                          >
                            <div className="relative aspect-square bg-[#f6f6f7]">
                              {/*
                              |--------------------------------------------------------------------------
                              | Image / Video thumbnail
                              |--------------------------------------------------------------------------
                              */}

                              {(asset.assetType ===
                                "IMAGE" ||
                                asset.assetType ===
                                  "VIDEO") &&
                              thumbnailUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={
                                    thumbnailUrl
                                  }
                                  alt={
                                    asset.altText ||
                                    asset.title ||
                                    asset.originalFileName
                                  }
                                  className="h-full w-full object-contain p-3"
                                />
                              ) : asset.assetType ===
                                "VIDEO" ? (
                                <div className="flex h-full flex-col items-center justify-center gap-2">
                                  <FileVideo
                                    size={
                                      42
                                    }
                                    className="text-[#8c9196]"
                                  />

                                  <span className="text-xs font-medium text-[#6d7175]">
                                    Video
                                  </span>
                                </div>
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <FileText
                                    size={
                                      38
                                    }
                                    className="text-[#8c9196]"
                                  />
                                </div>
                              )}

                              {/*
                              |--------------------------------------------------------------------------
                              | Video badge
                              |--------------------------------------------------------------------------
                              */}

                              {asset.assetType ===
                              "VIDEO" ? (
                                <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-[10px] font-medium text-white">
                                  <FileVideo
                                    size={
                                      12
                                    }
                                  />

                                  MP4

                                  {duration
                                    ? ` · ${duration}`
                                    : ""}
                                </div>
                              ) : null}

                              {/*
                              |--------------------------------------------------------------------------
                              | Selected
                              |--------------------------------------------------------------------------
                              */}

                              {selected && (
                                <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#303030] text-white">
                                  <Check
                                    size={
                                      15
                                    }
                                  />
                                </div>
                              )}
                            </div>

                            <div className="p-3">
                              <p className="truncate text-sm font-medium">
                                {asset.title ||
                                  asset.originalFileName}
                              </p>

                              <div className="mt-1 flex items-center justify-between gap-2">
                                <p className="truncate text-xs text-[#6d7175]">
                                  {
                                    asset.classification
                                  }
                                  {" · "}
                                  {
                                    asset.assetType
                                  }
                                </p>

                                <p className="shrink-0 text-xs text-[#8c9196]">
                                  {formatFileSize(
                                    asset.fileSize
                                  )}
                                </p>
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </div>
          </main>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Footer
        |--------------------------------------------------------------------------
        */}

        <footer className="flex items-center justify-between gap-4 border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4">
          <div className="min-w-0">
            {selectedAsset ? (
              <>
                <p className="truncate text-sm font-medium">
                  {selectedAsset.title ||
                    selectedAsset.originalFileName}
                </p>

                <p className="mt-0.5 text-xs text-[#6d7175]">
                  {
                    selectedAsset.classification
                  }

                  {" · "}

                  {
                    selectedAsset.assetType
                  }

                  {selectedAsset.width &&
                  selectedAsset.height
                    ? ` · ${selectedAsset.width} × ${selectedAsset.height}`
                    : ""}

                  {selectedAsset.assetType ===
                    "VIDEO" &&
                  selectedAsset.durationSeconds
                    ? ` · ${
                        formatDuration(
                          selectedAsset.durationSeconds
                        ) || ""
                      }`
                    : ""}
                </p>
              </>
            ) : (
              <p className="text-sm text-[#6d7175]">
                Select one asset to continue.
              </p>
            )}
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={
                onClose
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7]"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                !selectedAsset
              }
              onClick={
                handleConfirm
              }
              className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check
                size={
                  16
                }
              />

              Select asset
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}