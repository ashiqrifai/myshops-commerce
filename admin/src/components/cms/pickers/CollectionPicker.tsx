"use client";

import {
  Check,
  Layers3,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";

import {
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import {
  useGetCollectionByIdQuery,
  useGetCollectionsQuery,
} from "@/store/api/collectionApi";

interface CollectionPickerProps {
  selectedId:
    | string
    | null;

  onChange: (
    collectionId:
      | string
      | null
  ) => void;

  disabled?: boolean;

  title?: string;
  description?: string;
}

export default function CollectionPicker({
  selectedId,
  onChange,
  disabled = false,

  title =
    "View all collection",

  description =
    "Choose the collection opened when the customer clicks View all.",
}: CollectionPickerProps) {
  const [
    searchText,
    setSearchText,
  ] =
    useState("");

  const deferredSearch =
    useDeferredValue(
      searchText.trim()
    );

  const {
    data:
      collectionResponse,

    isLoading,
    isFetching,
    isError,
  } =
    useGetCollectionsQuery({
      page: 1,

      pageSize:
        200,

      search:
        deferredSearch ||
        undefined,

      isActive:
        true,

      sortBy:
        "name",

      sortDirection:
        "ASC",
    });

  const {
    data:
      selectedResponse,

    isLoading:
      selectedLoading,
  } =
    useGetCollectionByIdQuery(
      selectedId || "",
      {
        skip:
          !selectedId,
      }
    );

  const collections =
    collectionResponse?.data ||
    [];

  const selectedCollection =
    useMemo(() => {
      if (!selectedId) {
        return null;
      }

      return (
        collections.find(
          (collection) =>
            collection.id ===
            selectedId
        ) ||
        selectedResponse?.data ||
        null
      );
    }, [
      collections,
      selectedId,
      selectedResponse,
    ]);

  const availableCollections =
    collections.filter(
      (collection) =>
        collection.id !==
        selectedId
    );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <Layers3
                size={
                  20
                }
              />
            </div>

            <div>
            <h3 className="text-sm font-semibold text-[#202223]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              {description}
            </p>
            </div>
          </div>

          <div className="relative mt-5">
            <Search
              size={
                18
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
            />

            <input
              type="search"
              value={
                searchText
              }
              disabled={
                disabled
              }
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
              placeholder="Search collections"
              className="h-11 w-full rounded-lg border border-[#babfc3] bg-white pl-10 pr-10 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
            />

            {isFetching ? (
              <LoaderCircle
                size={
                  18
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6d7175]"
              />
            ) : null}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-[160px] items-center justify-center">
              <LoaderCircle
                size={
                  24
                }
                className="animate-spin"
              />
            </div>
          ) : isError ? (
            <div className="p-6 text-center text-sm">
              Unable to load
              collections
            </div>
          ) : availableCollections.length ===
            0 ? (
            <div className="p-6 text-center text-sm text-[#6d7175]">
              No collections found
            </div>
          ) : (
            <div className="divide-y divide-[#e1e3e5]">
              {availableCollections.map(
                (
                  collection
                ) => (
                  <div
                    key={
                      collection.id
                    }
                    className="flex items-center gap-4 px-5 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#202223]">
                        {
                          collection.name
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-[#6d7175]">
                        /
                        {
                          collection.slug
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        disabled
                      }
                      onClick={() =>
                        onChange(
                          collection.id
                        )
                      }
                      className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium"
                    >
                      <Check
                        size={
                          16
                        }
                      />
                      Select
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {selectedId ? (
        <div className="rounded-xl border border-[#e1e3e5] bg-white p-5">
          {selectedLoading ? (
            <LoaderCircle
              size={
                20
              }
              className="animate-spin"
            />
          ) : (
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#202223]">
                  {selectedCollection
                    ?.name ||
                    "Selected collection"}
                </p>

                <p className="mt-1 text-xs text-[#6d7175]">
                  /
                  {selectedCollection
                    ?.slug ||
                    selectedId}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onChange(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600"
              >
                <Trash2
                  size={
                    16
                  }
                />
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}