"use client";

import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  ImageIcon,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useGetCollectionsQuery,
} from "@/store/api/collectionApi";

import type {
  Collection,
} from "@/types/collection";

interface CollectionGridEditorProps {
  value:
    Record<string, unknown>;

  settings:
    Record<string, unknown>;

  onChange: (
    value:
      Record<string, unknown>
  ) => void;
}

/*
|--------------------------------------------------------------------------
| Backend Base URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_BACKEND_URL ||
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080"
)
  .replace(
    /\/api\/v1\/?$/,
    ""
  )
  .replace(
    /\/$/,
    ""
  );

/*
|--------------------------------------------------------------------------
| Media Helpers
|--------------------------------------------------------------------------
*/

const resolveMediaUrl =
(
  url?:
    string |
    null
): string | null => {
  if (
    !url
  ) {
    return null;
  }

  if (
    url.startsWith(
      "http://"
    ) ||
    url.startsWith(
      "https://"
    ) ||
    url.startsWith(
      "data:"
    )
  ) {
    return url;
  }

  return `${API_BASE_URL}${
    url.startsWith(
      "/"
    )
      ? url
      : `/${url}`
  }`;
};

const getCollectionImageUrl =
(
  collection:
    Collection
): string | null => {
  const candidate =
    collection.thumbnailAsset
      ?.publicUrl ||
    collection.bannerAsset
      ?.publicUrl ||
    collection.mobileBannerAsset
      ?.publicUrl ||
    null;

  return resolveMediaUrl(
    candidate
  );
};

/*
|--------------------------------------------------------------------------
| Value Helpers
|--------------------------------------------------------------------------
*/

const getStringValue =
(
  value:
    unknown,
  fallback =
    ""
): string => {
  return typeof value ===
    "string"
    ? value
    : fallback;
};

/*
|--------------------------------------------------------------------------
| Collection Grid Editor
|--------------------------------------------------------------------------
*/

export default function CollectionGridEditor({
  value,
  settings,
  onChange,
}: CollectionGridEditorProps) {
  const [
    search,
    setSearch,
  ] =
    useState(
      ""
    );

  const [
    pickerExpanded,
    setPickerExpanded,
  ] =
    useState(
      true
    );

  /*
  |--------------------------------------------------------------------------
  | Load Collections
  |--------------------------------------------------------------------------
  */

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } =
    useGetCollectionsQuery({
      page:
        1,

      pageSize:
        200,

      isActive:
        true,

      sortBy:
        "sortOrder",

      sortDirection:
        "ASC",
    });

  const allCollections =
    useMemo(
      () =>
        data?.data ||
        [],
      [
        data,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Collection Lookup
  |--------------------------------------------------------------------------
  */

  const collectionMap =
    useMemo(
      () =>
        new Map(
          allCollections.map(
            (
              collection
            ) => [
              collection.id,
              collection,
            ]
          )
        ),
      [
        allCollections,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Selected Collection IDs
  |--------------------------------------------------------------------------
  */

  const collectionIds =
    useMemo(
      () => {
        if (
          !Array.isArray(
            value.collectionIds
          )
        ) {
          return [];
        }

        return value.collectionIds.filter(
          (
            collectionId
          ): collectionId is string =>
            typeof collectionId ===
              "string" &&
            Boolean(
              collectionId.trim()
            )
        );
      },
      [
        value.collectionIds,
      ]
    );

  const selectedIdSet =
    useMemo(
      () =>
        new Set(
          collectionIds
        ),
      [
        collectionIds,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Search Collections
  |--------------------------------------------------------------------------
  */

  const filteredCollections =
    useMemo(
      () => {
        const normalizedSearch =
          search
            .trim()
            .toLowerCase();

        if (
          !normalizedSearch
        ) {
          return allCollections;
        }

        return allCollections.filter(
          (
            collection
          ) => {
            const name =
              String(
                collection.name ||
                ""
              )
                .toLowerCase();

            const slug =
              String(
                collection.slug ||
                ""
              )
                .toLowerCase();

            const shortDescription =
              String(
                collection.shortDescription ||
                ""
              )
                .toLowerCase();

            return (
              name.includes(
                normalizedSearch
              ) ||
              slug.includes(
                normalizedSearch
              ) ||
              shortDescription.includes(
                normalizedSearch
              )
            );
          }
        );
      },
      [
        allCollections,
        search,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Resolve Selected Collections
  |--------------------------------------------------------------------------
  */

  const selectedCollections =
    useMemo(
      () =>
        collectionIds.map(
          (
            collectionId
          ) => ({
            id:
              collectionId,

            collection:
              collectionMap.get(
                collectionId
              ) ||
              null,
          })
        ),
      [
        collectionIds,
        collectionMap,
      ]
    );

  /*
  |--------------------------------------------------------------------------
  | Source Type
  |--------------------------------------------------------------------------
  */

  const sourceType =
    getStringValue(
      settings.sourceType,
      "MANUAL"
    )
      .trim()
      .toUpperCase();

  /*
  |--------------------------------------------------------------------------
  | Update Content
  |--------------------------------------------------------------------------
  */

  const updateField =
    (
      field:
        string,
      fieldValue:
        unknown
    ) => {
      onChange({
        ...value,

        [field]:
          fieldValue,
      });
    };

  /*
  |--------------------------------------------------------------------------
  | Toggle Collection
  |--------------------------------------------------------------------------
  */

  const handleToggleCollection =
    (
      collectionId:
        string
    ) => {
      if (
        selectedIdSet.has(
          collectionId
        )
      ) {
        updateField(
          "collectionIds",

          collectionIds.filter(
            (
              id
            ) =>
              id !==
              collectionId
          )
        );

        return;
      }

      updateField(
        "collectionIds",

        [
          ...collectionIds,
          collectionId,
        ]
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Remove Collection
  |--------------------------------------------------------------------------
  */

  const handleRemoveCollection =
    (
      collectionId:
        string
    ) => {
      updateField(
        "collectionIds",

        collectionIds.filter(
          (
            id
          ) =>
            id !==
            collectionId
        )
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Reorder Collections
  |--------------------------------------------------------------------------
  */

  const moveCollection =
    (
      index:
        number,
      direction:
        -1 |
        1
    ) => {
      const targetIndex =
        index +
        direction;

      if (
        targetIndex <
          0 ||
        targetIndex >=
          collectionIds.length
      ) {
        return;
      }

      const reordered = [
        ...collectionIds,
      ];

      const [
        movedId,
      ] =
        reordered.splice(
          index,
          1
        );

      reordered.splice(
        targetIndex,
        0,
        movedId
      );

      updateField(
        "collectionIds",
        reordered
      );
    };

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <section className="admin-card overflow-hidden">
      {/*
      |--------------------------------------------------------------------------
      | Header
      |--------------------------------------------------------------------------
      */}

      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <h2 className="text-base font-semibold">
          Section content
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Select and arrange the collections displayed in this section.
        </p>
      </div>

      <div className="space-y-6 p-6">
        {/*
        |--------------------------------------------------------------------------
        | Title / Subtitle
        |--------------------------------------------------------------------------
        */}

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="collection-grid-title"
              className="mb-1.5 block text-sm font-medium"
            >
              Title
            </label>

            <input
              id="collection-grid-title"
              value={
                getStringValue(
                  value.title
                )
              }
              onChange={(
                event
              ) =>
                updateField(
                  "title",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="Shop Collections"
            />
          </div>

          <div>
            <label
              htmlFor="collection-grid-subtitle"
              className="mb-1.5 block text-sm font-medium"
            >
              Subtitle
            </label>

            <input
              id="collection-grid-subtitle"
              value={
                getStringValue(
                  value.subtitle
                )
              }
              onChange={(
                event
              ) =>
                updateField(
                  "subtitle",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="Explore our latest collections"
            />
          </div>
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Dynamic Source Information
        |--------------------------------------------------------------------------
        */}

        {sourceType !==
        "MANUAL" ? (
          <div className="rounded-xl border border-[#e1e3e5] bg-[#f6f6f7] p-4">
            <p className="text-sm font-semibold">
              Dynamic collection source
            </p>

            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              This section currently uses the{" "}
              <span className="font-mono font-semibold">
                {sourceType}
              </span>{" "}
              source. Manual collection selection is available when Source Type
              is set to{" "}
              <span className="font-mono font-semibold">
                MANUAL
              </span>
              .
            </p>
          </div>
        ) : (
          <>
            {/*
            |--------------------------------------------------------------------------
            | Selected Collections
            |--------------------------------------------------------------------------
            */}

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    Selected collections
                  </h3>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Collections are rendered in the order shown below.
                  </p>
                </div>

                <span className="rounded-full bg-[#f1f2f3] px-3 py-1 text-xs font-semibold text-[#5c5f62]">
                  {
                    collectionIds.length
                  }{" "}
                  selected
                </span>
              </div>

              {selectedCollections.length ===
              0 ? (
                <div className="rounded-xl border border-dashed border-[#babfc3] bg-[#f6f6f7] px-5 py-8 text-center">
                  <ImageIcon
                    size={
                      25
                    }
                    className="mx-auto text-[#8c9196]"
                  />

                  <p className="mt-3 text-sm font-semibold">
                    No collections selected
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Select collections from the list below.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedCollections.map(
                    (
                      {
                        id,
                        collection,
                      },
                      index
                    ) => {
                      const imageUrl =
                        collection
                          ? getCollectionImageUrl(
                              collection
                            )
                          : null;

                      return (
                        <div
                          key={
                            id
                          }
                          className="flex items-center gap-3 rounded-xl border border-[#e1e3e5] bg-white p-3"
                        >
                          <GripVertical
                            size={
                              18
                            }
                            className="shrink-0 text-[#8c9196]"
                          />

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                            {imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  imageUrl
                                }
                                alt={
                                  collection
                                    ?.name ||
                                  "Collection"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon
                                size={
                                  19
                                }
                                className="text-[#8c9196]"
                              />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {collection
                                ?.name ||
                                "Collection unavailable"}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                              {collection
                                ?.slug ||
                                id}
                            </p>

                            {collection
                              ?.collectionType ? (
                              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-[#8c9196]">
                                {
                                  collection.collectionType
                                }
                              </p>
                            ) : null}
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            {/*
                            |--------------------------------------------------------------------------
                            | Move Up
                            |--------------------------------------------------------------------------
                            */}

                            <button
                              type="button"
                              onClick={() =>
                                moveCollection(
                                  index,
                                  -1
                                )
                              }
                              disabled={
                                index ===
                                0
                              }
                              aria-label="Move collection up"
                              title="Move up"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] bg-white text-[#5c5f62] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ChevronDown
                                size={
                                  16
                                }
                                className="rotate-180"
                              />
                            </button>

                            {/*
                            |--------------------------------------------------------------------------
                            | Move Down
                            |--------------------------------------------------------------------------
                            */}

                            <button
                              type="button"
                              onClick={() =>
                                moveCollection(
                                  index,
                                  1
                                )
                              }
                              disabled={
                                index ===
                                selectedCollections.length -
                                  1
                              }
                              aria-label="Move collection down"
                              title="Move down"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] bg-white text-[#5c5f62] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-35"
                            >
                              <ChevronDown
                                size={
                                  16
                                }
                              />
                            </button>

                            {/*
                            |--------------------------------------------------------------------------
                            | Remove
                            |--------------------------------------------------------------------------
                            */}

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveCollection(
                                  id
                                )
                              }
                              aria-label="Remove collection"
                              title="Remove"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 hover:bg-red-50"
                            >
                              <Trash2
                                size={
                                  16
                                }
                              />
                            </button>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Collection Picker
            |--------------------------------------------------------------------------
            */}

            <div className="rounded-xl border border-[#e1e3e5]">
              <button
                type="button"
                onClick={() =>
                  setPickerExpanded(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
              >
                <div>
                  <p className="text-sm font-semibold">
                    Choose collections
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Search active collections and select multiple records.
                  </p>
                </div>

                {pickerExpanded ? (
                  <ChevronDown
                    size={
                      18
                    }
                  />
                ) : (
                  <ChevronRight
                    size={
                      18
                    }
                  />
                )}
              </button>

              {pickerExpanded ? (
                <div className="border-t border-[#e1e3e5] p-4">
                  {/*
                  |--------------------------------------------------------------------------
                  | Search
                  |--------------------------------------------------------------------------
                  */}

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
                          event.target
                            .value
                        )
                      }
                      className="admin-input pl-10"
                      placeholder="Search collections..."
                    />
                  </div>

                  {/*
                  |--------------------------------------------------------------------------
                  | Loading
                  |--------------------------------------------------------------------------
                  */}

                  {isLoading ||
                  isFetching ? (
                    <div className="flex min-h-40 items-center justify-center">
                      <LoaderCircle
                        size={
                          22
                        }
                        className="animate-spin text-[#6d7175]"
                      />
                    </div>
                  ) : error ? (
                    /*
                    |--------------------------------------------------------------------------
                    | Error
                    |--------------------------------------------------------------------------
                    */

                    <div className="py-8 text-center">
                      <p className="text-sm font-semibold text-red-700">
                        Unable to load collections.
                      </p>

                      <p className="mt-1 text-xs text-[#6d7175]">
                        Check the Collections API and your permissions.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          refetch()
                        }
                        className="mt-3 rounded-lg border border-[#babfc3] bg-white px-4 py-2 text-sm font-medium hover:bg-[#f6f6f7]"
                      >
                        Try again
                      </button>
                    </div>
                  ) : filteredCollections.length ===
                    0 ? (
                    /*
                    |--------------------------------------------------------------------------
                    | Empty Search
                    |--------------------------------------------------------------------------
                    */

                    <div className="py-8 text-center">
                      <ImageIcon
                        size={
                          24
                        }
                        className="mx-auto text-[#8c9196]"
                      />

                      <p className="mt-3 text-sm font-semibold">
                        No collections found
                      </p>

                      <p className="mt-1 text-xs text-[#6d7175]">
                        Try a different search term.
                      </p>
                    </div>
                  ) : (
                    /*
                    |--------------------------------------------------------------------------
                    | Collection List
                    |--------------------------------------------------------------------------
                    */

                    <div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto pr-1">
                      {filteredCollections.map(
                        (
                          collection
                        ) => {
                          const selected =
                            selectedIdSet.has(
                              collection.id
                            );

                          const imageUrl =
                            getCollectionImageUrl(
                              collection
                            );

                          return (
                            <button
                              key={
                                collection.id
                              }
                              type="button"
                              onClick={() =>
                                handleToggleCollection(
                                  collection.id
                                )
                              }
                              className={[
                                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition",

                                selected
                                  ? "border-[#303030] bg-[#f1f2f3]"
                                  : "border-transparent hover:border-[#d2d5d8] hover:bg-[#f6f6f7]",
                              ].join(
                                " "
                              )}
                            >
                              {/*
                              |--------------------------------------------------------------------------
                              | Image
                              |--------------------------------------------------------------------------
                              */}

                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                                {imageUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      imageUrl
                                    }
                                    alt={
                                      collection.name
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon
                                    size={
                                      18
                                    }
                                    className="text-[#8c9196]"
                                  />
                                )}
                              </div>

                              {/*
                              |--------------------------------------------------------------------------
                              | Collection Details
                              |--------------------------------------------------------------------------
                              */}

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-[#202223]">
                                    {
                                      collection.name
                                    }
                                  </p>

                                  {collection.isFeatured ? (
                                    <span className="rounded-full bg-[#fff3cd] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#856404]">
                                      Featured
                                    </span>
                                  ) : null}
                                </div>

                                <p className="mt-0.5 truncate text-xs text-[#6d7175]">
                                  /
                                  {
                                    collection.slug
                                  }
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#8c9196]">
                                  <span>
                                    {
                                      collection.collectionType
                                    }
                                  </span>

                                  {collection.showOnHome ? (
                                    <>
                                      <span>
                                        •
                                      </span>

                                      <span>
                                        Home
                                      </span>
                                    </>
                                  ) : null}

                                  {collection.showInMenu ? (
                                    <>
                                      <span>
                                        •
                                      </span>

                                      <span>
                                        Menu
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              </div>

                              {/*
                              |--------------------------------------------------------------------------
                              | Selected Indicator
                              |--------------------------------------------------------------------------
                              */}

                              <span
                                className={[
                                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs font-bold",

                                  selected
                                    ? "border-[#303030] bg-[#303030] text-white"
                                    : "border-[#babfc3] bg-white text-transparent",
                                ].join(
                                  " "
                                )}
                              >
                                ✓
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Helper Text
            |--------------------------------------------------------------------------
            */}

            <div className="rounded-xl border border-[#dfe3e8] bg-[#f6f6f7] px-4 py-3">
              <p className="text-xs leading-5 text-[#6d7175]">
                Only active collections are shown here. The order under{" "}
                <span className="font-semibold text-[#202223]">
                  Selected collections
                </span>{" "}
                controls the order in which collection cards will appear on
                the storefront.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}