"use client";

import {
  Check,
  ImageIcon,
  LoaderCircle,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

import {
  useDeferredValue,
  useMemo,
  useState,
} from "react";

import {
  useGetBrandByIdQuery,
  useGetBrandsQuery,
} from "@/store/api/brandApi";

import type {
  Brand,
} from "@/types/brand";

interface BrandPickerProps {
  selectedId:
    | string
    | null;

  onChange: (
    brandId:
      | string
      | null
  ) => void;

  title?: string;
  description?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

const BACKEND_URL = (
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
  .replace(/\/$/, "");

function toAbsoluteUrl(
  value?:
    | string
    | null
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.startsWith(
      "http://"
    ) ||
    normalized.startsWith(
      "https://"
    ) ||
    normalized.startsWith(
      "data:"
    )
  ) {
    return normalized;
  }

  return `${BACKEND_URL}${
    normalized.startsWith("/")
      ? normalized
      : `/${normalized}`
  }`;
}

function getBrandImageUrl(
  brand: Brand
): string | null {
  const asset =
    brand.logoAsset ||
    brand.bannerAsset ||
    null;

  if (!asset) {
    return null;
  }

  const normalized =
    asset as typeof asset & {
      previewUrl?:
        | string
        | null;

      thumbnailUrl?:
        | string
        | null;

      previewPath?:
        | string
        | null;

      thumbnailPath?:
        | string
        | null;
    };

  return (
    toAbsoluteUrl(
      normalized.publicUrl
    ) ||
    toAbsoluteUrl(
      normalized.previewUrl
    ) ||
    toAbsoluteUrl(
      normalized.thumbnailUrl
    ) ||
    (normalized.previewPath
      ? toAbsoluteUrl(
          `/media/${normalized.previewPath}`
        )
      : null) ||
    (normalized.thumbnailPath
      ? toAbsoluteUrl(
          `/media/${normalized.thumbnailPath}`
        )
      : null)
  );
}

function getBrandsFromResponse(
  response: unknown
): Brand[] {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return [];
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  const data =
    root.data;

  if (Array.isArray(data)) {
    return data as Brand[];
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        objectData.brands
      )
    ) {
      return objectData
        .brands as Brand[];
    }
  }

  return [];
}

function getBrandFromResponse(
  response: unknown
): Brand | null {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return null;
  }

  const root =
    response as Record<
      string,
      unknown
    >;

  const data =
    root.data;

  if (
    data &&
    typeof data ===
      "object" &&
    !Array.isArray(data)
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    if (
      objectData.brand &&
      typeof objectData.brand ===
        "object"
    ) {
      return objectData
        .brand as Brand;
    }

    if (
      typeof objectData.id ===
      "string"
    ) {
      return objectData as unknown as Brand;
    }
  }

  return null;
}

export default function BrandPicker({
  selectedId,
  onChange,
  title = "Select brand",
  description =
    "Search the catalogue and choose the brand used by this section.",
  searchPlaceholder =
    "Search by brand name or code",
  disabled = false,
}: BrandPickerProps) {
  const [
    searchText,
    setSearchText,
  ] = useState("");

  const deferredSearch =
    useDeferredValue(
      searchText.trim()
    );

  const {
    data:
      brandsResponse,

    isLoading,
    isFetching,
    isError,
  } =
    useGetBrandsQuery({
      page: 1,
      pageSize: 200,
      search:
        deferredSearch ||
        undefined,
      isActive: true,
      sortBy: "name",
      sortDirection: "ASC",
    });

  const {
    data:
      selectedResponse,

    isLoading:
      isSelectedLoading,
  } =
    useGetBrandByIdQuery(
      selectedId || "",
      {
        skip: !selectedId,
      }
    );

  const brands =
    useMemo(
      () =>
        getBrandsFromResponse(
          brandsResponse
        ),
      [brandsResponse]
    );

  const selectedBrand =
    useMemo(() => {
      if (!selectedId) {
        return null;
      }

      return (
        brands.find(
          (brand) =>
            brand.id ===
            selectedId
        ) ||
        getBrandFromResponse(
          selectedResponse
        )
      );
    }, [
      brands,
      selectedId,
      selectedResponse,
    ]);

  const availableBrands =
    useMemo(() => {
      return brands.filter(
        (brand) =>
          brand.id !==
          selectedId
      );
    }, [
      brands,
      selectedId,
    ]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="border-b border-[#e1e3e5] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
              <Tags
                size={20}
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
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
            />

            <input
              type="search"
              value={searchText}
              disabled={disabled}
              onChange={(
                event
              ) =>
                setSearchText(
                  event.target
                    .value
                )
              }
              placeholder={
                searchPlaceholder
              }
              className="h-11 w-full rounded-lg border border-[#babfc3] bg-white pl-10 pr-10 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff] disabled:cursor-not-allowed disabled:bg-[#f6f6f7]"
            />

            {isFetching ? (
              <LoaderCircle
                size={18}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6d7175]"
              />
            ) : null}
          </div>
        </div>

        <div className="max-h-[430px] overflow-y-auto">
          {isLoading ? (
            <div className="flex min-h-[220px] items-center justify-center">
              <LoaderCircle
                size={24}
                className="animate-spin text-[#6d7175]"
              />
            </div>
          ) : isError ? (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
              <p className="font-medium text-[#202223]">
                Unable to load brands
              </p>
            </div>
          ) : availableBrands.length ===
            0 ? (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
              <p className="font-medium text-[#202223]">
                No brands found
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e1e3e5]">
              {availableBrands.map(
                (
                  brand
                ) => {
                  const imageUrl =
                    getBrandImageUrl(
                      brand
                    );

                  return (
                    <div
                      key={
                        brand.id
                      }
                      className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#f6f6f7]"
                    >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt={brand.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <ImageIcon
                            size={22}
                            className="text-[#8c9196]"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#202223]">
                          {brand.name}
                        </p>

                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6d7175]">
                          {brand.code ? (
                            <span>
                              {brand.code}
                            </span>
                          ) : null}

                          {brand.countryOfOrigin ? (
                            <span>
                              {
                                brand.countryOfOrigin
                              }
                            </span>
                          ) : null}

                          {brand.isFeatured ? (
                            <span>
                              Featured
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          onChange(
                            brand.id
                          )
                        }
                        className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium text-[#202223] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Check
                          size={16}
                        />

                        <span>
                          Select
                        </span>
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[#e1e3e5] bg-white">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-[#202223]">
              Selected brand
            </h3>

            <p className="mt-1 text-sm text-[#6d7175]">
              Products from this brand
              will be displayed.
            </p>
          </div>

          <span className="rounded-full bg-[#f1f2f3] px-3 py-1 text-xs font-semibold text-[#4b4f52]">
            {selectedId
              ? "1 selected"
              : "None"}
          </span>
        </div>

        {!selectedId ? (
          <div className="flex min-h-[160px] items-center justify-center p-6 text-center">
            <div>
              <Tags
                size={30}
                className="mx-auto text-[#8c9196]"
              />

              <p className="mt-3 font-medium text-[#202223]">
                No brand selected
              </p>
            </div>
          </div>
        ) : isSelectedLoading ? (
          <div className="flex min-h-[160px] items-center justify-center">
            <LoaderCircle
              size={24}
              className="animate-spin text-[#6d7175]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-[#f6f6f7]">
              {selectedBrand &&
              getBrandImageUrl(
                selectedBrand
              ) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={
                    getBrandImageUrl(
                      selectedBrand
                    ) || ""
                  }
                  alt={
                    selectedBrand.name
                  }
                  className="h-full w-full object-contain p-1"
                />
              ) : (
                <ImageIcon
                  size={22}
                  className="text-[#8c9196]"
                />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[#202223]">
                {selectedBrand
                  ?.name ||
                  "Selected brand"}
              </p>

              <p className="mt-1 truncate text-xs text-[#6d7175]">
                {selectedBrand
                  ?.code ||
                  selectedBrand
                    ?.slug ||
                  selectedId}
              </p>
            </div>

            <button
              type="button"
              disabled={disabled}
              onClick={() =>
                onChange(null)
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove brand"
            >
              <Trash2
                size={16}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
