"use client";

import {
  ArrowDown,
  ArrowUp,
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
  useGetBrandsQuery,
} from "@/store/api/brandApi";

import type {
  Brand,
} from "@/types/brand";

interface BrandCarouselContent {
  title?: string;
  subtitle?: string;
  brandIds?: string[];
}

interface BrandCarouselEditorProps {
  value: Record<
    string,
    unknown
  >;

  onChange: (
    value: Record<
      string,
      unknown
    >
  ) => void;
}

interface MediaAssetUrlShape {
  publicUrl?:
    | string
    | null;

  previewUrl?:
    | string
    | null;

  thumbnailUrl?:
    | string
    | null;

  storagePath?:
    | string
    | null;

  previewPath?:
    | string
    | null;

  thumbnailPath?:
    | string
    | null;

  variants?: Array<{
    publicUrl?:
      | string
      | null;

    storagePath?:
      | string
      | null;

    variantType?: string;
    isPrimary?: boolean;
  }>;
}

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_BACKEND_URL ||
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080"
)
  .replace(
    /\/api\/v\d+\/?$/i,
    ""
  )
  .replace(
    /\/api\/?$/i,
    ""
  )
  .replace(/\/+$/, "");

const toAbsoluteUrl = (
  value?:
    | string
    | null
): string | null => {
  if (!value) {
    return null;
  }

  const normalized =
    String(value).trim();

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
    ) ||
    normalized.startsWith(
      "blob:"
    )
  ) {
    return normalized;
  }

  const normalizedPath =
    normalized.startsWith("/")
      ? normalized
      : `/${normalized}`;

  return `${API_BASE_URL}${normalizedPath}`;
};

const toMediaPath = (
  path?:
    | string
    | null
): string | null => {
  if (!path) {
    return null;
  }

  const normalized =
    String(path).trim();

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
      "/media/"
    ) ||
    normalized.startsWith(
      "media/"
    )
  ) {
    return toAbsoluteUrl(
      normalized.startsWith(
        "media/"
      )
        ? `/${normalized}`
        : normalized
    );
  }

  return toAbsoluteUrl(
    `/media/${normalized.replace(
      /^\/+/,
      ""
    )}`
  );
};

const getBrandLogoUrl = (
  brand: Brand
): string | null => {
  const asset =
    brand.logoAsset as
      | (typeof brand.logoAsset &
          MediaAssetUrlShape)
      | null
      | undefined;

  if (!asset) {
    return null;
  }

  const variants =
    Array.isArray(
      asset.variants
    )
      ? asset.variants
      : [];

  const preferredVariant =
    variants.find(
      (variant) =>
        String(
          variant.variantType ||
            ""
        ).toUpperCase() ===
        "MEDIUM"
    ) ||
    variants.find(
      (variant) =>
        String(
          variant.variantType ||
            ""
        ).toUpperCase() ===
        "SMALL"
    ) ||
    variants.find(
      (variant) =>
        String(
          variant.variantType ||
            ""
        ).toUpperCase() ===
        "THUMBNAIL"
    ) ||
    variants.find(
      (variant) =>
        variant.isPrimary ===
        true
    ) ||
    variants[0];

  return (
    toAbsoluteUrl(
      preferredVariant
        ?.publicUrl
    ) ||
    toMediaPath(
      preferredVariant
        ?.storagePath
    ) ||
    toAbsoluteUrl(
      asset.publicUrl
    ) ||
    toAbsoluteUrl(
      asset.previewUrl
    ) ||
    toAbsoluteUrl(
      asset.thumbnailUrl
    ) ||
    toMediaPath(
      asset.previewPath
    ) ||
    toMediaPath(
      asset.thumbnailPath
    ) ||
    toMediaPath(
      asset.storagePath
    ) ||
    null
  );
};

const normalizeBrandIds = (
  value: unknown
): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter(
          (
            brandId
          ): brandId is string =>
            typeof brandId ===
            "string"
        )
        .map((brandId) =>
          brandId.trim()
        )
        .filter(Boolean)
    )
  );
};

export default function BrandCarouselEditor({
  value,
  onChange,
}: BrandCarouselEditorProps) {
  const content =
    value as BrandCarouselContent;

  const brandIds =
    normalizeBrandIds(
      content.brandIds
    );

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const deferredSearch =
    useDeferredValue(
      searchText.trim()
    );

  const {
    data: brandsResponse,
    isLoading,
    isFetching,
    isError,
  } = useGetBrandsQuery({
    page: 1,
    pageSize: 200,

    search:
      deferredSearch ||
      undefined,

    isActive: true,

    sortBy: "name",
    sortDirection: "ASC",
  });

  const brands =
    brandsResponse?.data ||
    [];

  const brandMap =
    useMemo(() => {
      return new Map(
        brands.map(
          (brand) => [
            brand.id,
            brand,
          ]
        )
      );
    }, [brands]);

  const selectedIdSet =
    useMemo(
      () =>
        new Set(
          brandIds
        ),
      [brandIds]
    );

  const availableBrands =
    useMemo(() => {
      return brands.filter(
        (brand) =>
          !selectedIdSet.has(
            brand.id
          )
      );
    }, [
      brands,
      selectedIdSet,
    ]);

  const updateContent = (
    changes:
      Partial<BrandCarouselContent>
  ) => {
    onChange({
      ...value,
      ...changes,
    });
  };

  const addBrand = (
    brandId: string
  ) => {
    if (
      selectedIdSet.has(
        brandId
      )
    ) {
      return;
    }

    updateContent({
      brandIds: [
        ...brandIds,
        brandId,
      ],
    });
  };

  const removeBrand = (
    brandId: string
  ) => {
    updateContent({
      brandIds:
        brandIds.filter(
          (currentId) =>
            currentId !==
            brandId
        ),
    });
  };

  const moveBrand = (
    brandId: string,
    direction:
      | "UP"
      | "DOWN"
  ) => {
    const currentIndex =
      brandIds.indexOf(
        brandId
      );

    if (
      currentIndex < 0
    ) {
      return;
    }

    const destinationIndex =
      direction === "UP"
        ? currentIndex - 1
        : currentIndex + 1;

    if (
      destinationIndex < 0 ||
      destinationIndex >=
        brandIds.length
    ) {
      return;
    }

    const nextBrandIds = [
      ...brandIds,
    ];

    [
      nextBrandIds[
        currentIndex
      ],
      nextBrandIds[
        destinationIndex
      ],
    ] = [
      nextBrandIds[
        destinationIndex
      ],
      nextBrandIds[
        currentIndex
      ],
    ];

    updateContent({
      brandIds:
        nextBrandIds,
    });
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <h2 className="text-base font-semibold text-[#202223]">
          Section content
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Choose the brands shown
          in the carousel and control
          their display order.
        </p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="brand-carousel-title"
              className="mb-1.5 block text-sm font-medium"
            >
              Title
            </label>

            <input
              id="brand-carousel-title"
              type="text"
              value={
                content.title ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  title:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Top Brands"
            />
          </div>

          <div>
            <label
              htmlFor="brand-carousel-subtitle"
              className="mb-1.5 block text-sm font-medium"
            >
              Subtitle
            </label>

            <input
              id="brand-carousel-subtitle"
              type="text"
              value={
                content.subtitle ||
                ""
              }
              onChange={(
                event
              ) =>
                updateContent({
                  subtitle:
                    event.target
                      .value,
                })
              }
              className="admin-input"
              placeholder="Shop from leading brands"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
          <div className="border-b border-[#e1e3e5] bg-[#fafbfb] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]">
                <Tags
                  size={20}
                />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#202223]">
                  Add brands
                </h3>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Search the brand
                  master and select the
                  brands to display.
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
                value={
                  searchText
                }
                onChange={(
                  event
                ) =>
                  setSearchText(
                    event.target
                      .value
                  )
                }
                placeholder="Search by brand name, code or country"
                className="admin-input pl-10 pr-10"
              />

              {isFetching ? (
                <LoaderCircle
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6d7175]"
                />
              ) : null}
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="text-center">
                  <LoaderCircle
                    size={25}
                    className="mx-auto animate-spin text-[#6d7175]"
                  />

                  <p className="mt-3 text-sm text-[#6d7175]">
                    Loading brands...
                  </p>
                </div>
              </div>
            ) : isError ? (
              <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
                <div>
                  <p className="font-medium text-[#202223]">
                    Unable to load
                    brands
                  </p>

                  <p className="mt-1 text-sm text-[#6d7175]">
                    Check the brands API
                    and try again.
                  </p>
                </div>
              </div>
            ) : availableBrands.length ===
              0 ? (
              <div className="flex min-h-[220px] items-center justify-center p-6 text-center">
                <div>
                  <Tags
                    size={30}
                    className="mx-auto text-[#8c9196]"
                  />

                  <p className="mt-3 font-medium text-[#202223]">
                    No brands found
                  </p>

                  <p className="mt-1 max-w-sm text-sm text-[#6d7175]">
                    Try another search.
                    All matching brands
                    may already be
                    selected.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#e1e3e5]">
                {availableBrands.map(
                  (brand) => {
                    const logoUrl =
                      getBrandLogoUrl(
                        brand
                      );

                    return (
                      <button
                        key={
                          brand.id
                        }
                        type="button"
                        onClick={() =>
                          addBrand(
                            brand.id
                          )
                        }
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#f6f6f7]"
                      >
                        <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                          {logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={
                                logoUrl
                              }
                              alt={`${brand.name} logo`}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <ImageIcon
                              size={24}
                              className="text-[#8c9196]"
                            />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[#202223]">
                            {
                              brand.name
                            }
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#6d7175]">
                            <span>
                              {
                                brand.code
                              }
                            </span>

                            {brand.countryOfOrigin ? (
                              <span>
                                {
                                  brand.countryOfOrigin
                                }
                              </span>
                            ) : null}

                            {brand.isFeatured ? (
                              <span className="font-medium text-[#16828b]">
                                Featured
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#202223]">
                          <Check
                            size={17}
                          />
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
          <div className="flex items-center justify-between border-b border-[#e1e3e5] bg-[#fafbfb] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[#202223]">
                Selected brands
              </h3>

              <p className="mt-1 text-sm text-[#6d7175]">
                This order controls
                the order used in the
                brand carousel.
              </p>
            </div>

            <span className="rounded-full bg-[#f1f2f3] px-3 py-1 text-xs font-semibold text-[#4b4f52]">
              {
                brandIds.length
              }{" "}
              selected
            </span>
          </div>

          {brandIds.length ===
          0 ? (
            <div className="flex min-h-[190px] items-center justify-center p-6 text-center">
              <div>
                <Tags
                  size={30}
                  className="mx-auto text-[#8c9196]"
                />

                <p className="mt-3 font-medium text-[#202223]">
                  No brands selected
                </p>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Search and add brands
                  from the list above.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e1e3e5]">
              {brandIds.map(
                (
                  brandId,
                  index
                ) => {
                  const brand =
                    brandMap.get(
                      brandId
                    );

                  const logoUrl =
                    brand
                      ? getBrandLogoUrl(
                          brand
                        )
                      : null;

                  return (
                    <div
                      key={
                        brandId
                      }
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f1f2f3] text-xs font-semibold text-[#4b4f52]">
                        {index +
                          1}
                      </div>

                      <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#e1e3e5] bg-white">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              logoUrl
                            }
                            alt={
                              brand
                                ? `${brand.name} logo`
                                : "Brand logo"
                            }
                            className="h-full w-full object-contain p-2"
                          />
                        ) : (
                          <ImageIcon
                            size={24}
                            className="text-[#8c9196]"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#202223]">
                          {brand
                            ?.name ||
                            "Selected brand"}
                        </p>

                        <p className="mt-1 truncate text-xs text-[#6d7175]">
                          {brand
                            ?.code ||
                            brandId}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={
                            index ===
                            0
                          }
                          onClick={() =>
                            moveBrand(
                              brandId,
                              "UP"
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#202223] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move ${
                            brand
                              ?.name ||
                            "brand"
                          } up`}
                        >
                          <ArrowUp
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          disabled={
                            index ===
                            brandIds.length -
                              1
                          }
                          onClick={() =>
                            moveBrand(
                              brandId,
                              "DOWN"
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#babfc3] bg-white text-[#202223] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={`Move ${
                            brand
                              ?.name ||
                            "brand"
                          } down`}
                        >
                          <ArrowDown
                            size={16}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            removeBrand(
                              brandId
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-600 transition hover:bg-red-50"
                          aria-label={`Remove ${
                            brand
                              ?.name ||
                            "brand"
                          }`}
                        >
                          <Trash2
                            size={16}
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
      </div>
    </section>
  );
}