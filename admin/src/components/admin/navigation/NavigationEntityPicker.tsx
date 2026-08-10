"use client";

import {
  Check,
  FileText,
  FolderTree,
  ImageIcon,
  LoaderCircle,
  PackageSearch,
  Search,
  Tags,
  X,
  Layers3
} from "lucide-react";

import {
  useGetCollectionsQuery,
} from "@/store/api/collectionApi";

import type {
  Collection,
} from "@/types/collection";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useGetBrandsQuery,
} from "@/store/api/brandApi";

import {
  useGetCategoriesQuery,
} from "@/store/api/categoryApi";

import {
  useGetCmsPagesQuery,
} from "@/store/api/cmsPagesApi";

import {
  useGetProductsQuery,
} from "@/store/api/productApi";

import type {
  Brand,
} from "@/types/brand";

import type {
  Category,
} from "@/types/category";

import type {
  CmsPage,
} from "@/types/cms";

import type {
  NavigationItemType,
} from "@/types/navigation";

import type {
  Product,
} from "@/types/product";

export type NavigationEntityType =
  | "CATEGORY"
  | "BRAND"
  | "PRODUCT"
  | "COLLECTION"
  | "CMS_PAGE";

type NavigationEntity =
  | Category
  | Brand
  | Product
  | Collection
  | CmsPage;

interface NavigationEntityPickerProps {
  isOpen: boolean;

  entityType:
    NavigationEntityType;

  selectedId:
    string | null;

  onClose: () => void;

  onSelect: (
    result:
      NavigationEntitySelection
  ) => void;
}

export interface NavigationEntitySelection {
  id: string;
  label: string;
  url: string;

  entity:
    NavigationEntity;
}

interface PickerItem {
  id: string;
  label: string;
  secondaryText:
    string | null;
  tertiaryText:
    string | null;
  url: string;
  imageUrl:
    string | null;
  entity:
    NavigationEntity;
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
  .replace(
    /\/$/,
    ""
  );

const toAbsoluteUrl = (
  value?:
    string | null
): string | null => {
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
};

const normalizeSlug = (
  value?:
    string | null
): string => {
  return (
    value
      ?.trim()
      .replace(
        /^\/+/,
        ""
      )
      .replace(
        /\/+$/,
        ""
      ) || ""
  );
};

const buildCategoryUrl = (
  category:
    Category
): string => {
  const slug =
    normalizeSlug(
      category.slug
    );

  return slug
    ? `/category/${slug}`
    : `/category/${category.id}`;
};

const buildBrandUrl = (
  brand:
    Brand
): string => {
  const slug =
    normalizeSlug(
      brand.slug
    );

  return slug
    ? `/brand/${slug}`
    : `/brand/${brand.id}`;
};

const buildProductUrl = (
  product:
    Product
): string => {
  const slug =
    normalizeSlug(
      product.slug
    );

  return slug
    ? `/products/${slug}`
    : `/products/${product.id}`;
};

const buildCollectionUrl = (
  collection: Collection
): string => {
  const slug =
    normalizeSlug(
      collection.slug
    );

  return slug
    ? `/collections/${slug}`
    : `/collections/${collection.id}`;
};

const buildCmsPageUrl = (
  page:
    CmsPage
): string => {
  const slug =
    normalizeSlug(
      page.slug
    );

  if (
    page.pageType ===
      "HOME" ||
    !slug ||
    slug.toLowerCase() ===
      "home"
  ) {
    return "/";
  }

  return `/${slug}`;
};

const getMediaAssetUrl = (
  asset:
    | Record<
        string,
        unknown
      >
    | null
    | undefined
): string | null => {
  if (!asset) {
    return null;
  }

  const publicUrl =
    typeof asset.publicUrl ===
    "string"
      ? asset.publicUrl
      : null;

  const previewUrl =
    typeof asset.previewUrl ===
    "string"
      ? asset.previewUrl
      : null;

  const thumbnailUrl =
    typeof asset.thumbnailUrl ===
    "string"
      ? asset.thumbnailUrl
      : null;

  const previewPath =
    typeof asset.previewPath ===
    "string"
      ? asset.previewPath
      : null;

  const thumbnailPath =
    typeof asset.thumbnailPath ===
    "string"
      ? asset.thumbnailPath
      : null;

  return (
    toAbsoluteUrl(
      publicUrl
    ) ||
    toAbsoluteUrl(
      previewUrl
    ) ||
    toAbsoluteUrl(
      thumbnailUrl
    ) ||
    (previewPath
      ? toAbsoluteUrl(
          `/media/${previewPath}`
        )
      : null) ||
    (thumbnailPath
      ? toAbsoluteUrl(
          `/media/${thumbnailPath}`
        )
      : null)
  );
};

const getCategoryImageUrl = (
  category:
    Category
): string | null => {
  const asset =
    category.thumbnailAsset ||
    category.imageAsset ||
    null;

  return (
    getMediaAssetUrl(
      asset as unknown as
        Record<
          string,
          unknown
        >
    ) ||
    toAbsoluteUrl(
      category.iconUrl
    )
  );
};

const getBrandImageUrl = (
  brand:
    Brand
): string | null => {
  const asset =
    brand.logoAsset ||
    brand.bannerAsset ||
    null;

  return getMediaAssetUrl(
    asset as unknown as
      Record<
        string,
        unknown
      >
  );
};

const getProductImageUrl = (
  product:
    Product
): string | null => {
  const activeImages =
    (
      product.images ||
      []
    )
      .filter(
        (image) =>
          image.isActive !==
          false
      )
      .sort(
        (
          first,
          second
        ) =>
          Number(
            first.displayOrder ||
              0
          ) -
          Number(
            second.displayOrder ||
              0
          )
      );

  const image =
    activeImages.find(
      (item) =>
        item.imageRole ===
        "PRIMARY"
    ) ||
    activeImages[0];

  return getMediaAssetUrl(
    image?.mediaAsset as unknown as
      Record<
        string,
        unknown
      >
  );
};


const getCollectionImageUrl = (
  collection: Collection
): string | null => {
  const asset =
    collection.thumbnailAsset ||
    collection.bannerAsset ||
    collection.mobileBannerAsset ||
    null;

  if (!asset) {
    return null;
  }

  const preferredVariant =
    asset.variants?.find(
      (variant) =>
        variant.isPrimary &&
        Boolean(
          variant.publicUrl
        )
    ) ||
    asset.variants?.find(
      (variant) =>
        Boolean(
          variant.publicUrl
        )
    );

  return (
    toAbsoluteUrl(
      preferredVariant?.publicUrl
    ) ||
    toAbsoluteUrl(
      asset.publicUrl
    )
  );
};

const getProductSku = (
  product:
    Product
): string => {
  return (
    product.parentSku ||
    product.variants?.find(
      (variant) =>
        variant.isDefault
    )?.sku ||
    product.variants?.[0]
      ?.sku ||
    "No SKU"
  );
};

const getBrandsFromResponse = (
  response:
    unknown
): Brand[] => {
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

  if (
    Array.isArray(
      root.data
    )
  ) {
    return root.data as Brand[];
  }

  if (
    root.data &&
    typeof root.data ===
      "object"
  ) {
    const data =
      root.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.brands
      )
    ) {
      return data.brands as Brand[];
    }
  }

  return [];
};

const getPickerConfiguration = (
  entityType:
    NavigationEntityType
) => {
  switch (
    entityType
  ) {
    case "CATEGORY":
      return {
        eyebrow:
          "Category",

        title:
          "Select category",

        description:
          "Choose an active product category for this navigation item.",

        searchPlaceholder:
          "Search categories",

        emptyMessage:
          "No active categories found",
      };

    case "BRAND":
      return {
        eyebrow:
          "Brand",

        title:
          "Select brand",

        description:
          "Choose an active brand for this navigation item.",

        searchPlaceholder:
          "Search brands",

        emptyMessage:
          "No active brands found",
      };

    case "PRODUCT":
      return {
        eyebrow:
          "Product",

        title:
          "Select product",

        description:
          "Choose an active product for this navigation item.",

        searchPlaceholder:
          "Search by product name or SKU",

        emptyMessage:
          "No active products found",
      };
    
      case "COLLECTION":
        return {
          eyebrow:
            "Collection",
      
          title:
            "Select collection",
      
          description:
            "Choose an active product collection for this navigation item.",
      
          searchPlaceholder:
            "Search collections",
      
          emptyMessage:
            "No active collections found",
        };


    case "CMS_PAGE":
    default:
      return {
        eyebrow:
          "CMS page",

        title:
          "Select CMS page",

        description:
          "Choose a published and active CMS page for this navigation item.",

        searchPlaceholder:
          "Search by page name, code or slug",

        emptyMessage:
          "No published CMS pages found",
      };
  }
};

const PickerTypeIcon = ({
  entityType,
  size = 20,
}: {
  entityType:
    NavigationEntityType;

  size?: number;
}) => {
  switch (
    entityType
  ) {
    case "CATEGORY":
      return (
        <FolderTree
          size={size}
        />
      );

    case "BRAND":
      return (
        <Tags
          size={size}
        />
      );

    case "PRODUCT":
      return (
        <PackageSearch
          size={size}
        />
      );

      case "COLLECTION":
        return (
          <Layers3
            size={size}
          />
        );

    case "CMS_PAGE":
    default:
      return (
        <FileText
          size={size}
        />
      );
  }
};

export default function NavigationEntityPicker({
  isOpen,
  entityType,
  selectedId,
  onClose,
  onSelect,
}: NavigationEntityPickerProps) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const deferredSearch =
    useDeferredValue(
      search.trim()
    );

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [
    isOpen,
  ]);

  const categoryQuery =
    useGetCategoriesQuery(
      {
        page: 1,
        pageSize: 200,

        search:
          deferredSearch ||
          undefined,

        isActive:
          true,
      },
      {
        skip:
          !isOpen ||
          entityType !==
            "CATEGORY",
      }
    );

  const brandQuery =
    useGetBrandsQuery(
      {
        page: 1,
        pageSize: 200,

        search:
          deferredSearch ||
          undefined,

        isActive:
          true,

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          !isOpen ||
          entityType !==
            "BRAND",
      }
    );

  const productQuery =
    useGetProductsQuery(
      {
        page: 1,
        pageSize: 200,

        search:
          deferredSearch ||
          undefined,

        status:
          "ACTIVE",

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          !isOpen ||
          entityType !==
            "PRODUCT",
      }
    );

    const collectionQuery =
    useGetCollectionsQuery(
      {
        page: 1,
        pageSize: 200,
  
        search:
          deferredSearch ||
          undefined,
  
        isActive:
          true,
  
        sortBy:
          "name",
  
        sortDirection:
          "ASC",
      },
      {
        skip:
          !isOpen ||
          entityType !==
            "COLLECTION",
      }
    );

  const cmsPageQuery =
    useGetCmsPagesQuery(
      {
        page: 1,
        pageSize: 200,

        search:
          deferredSearch ||
          undefined,

        status:
          "PUBLISHED",

        isActive:
          true,

        sortBy:
          "name",

        sortDirection:
          "ASC",
      },
      {
        skip:
          !isOpen ||
          entityType !==
            "CMS_PAGE",
      }
    );

    const activeQuery =
    entityType ===
    "CATEGORY"
      ? categoryQuery
      : entityType ===
          "BRAND"
        ? brandQuery
        : entityType ===
            "PRODUCT"
          ? productQuery
          : entityType ===
              "COLLECTION"
            ? collectionQuery
            : cmsPageQuery;

  const items =
    useMemo<
      PickerItem[]
    >(() => {
      if (
        entityType ===
        "CATEGORY"
      ) {
        const categories =
          categoryQuery.data
            ?.data
            .categories ||
          [];

        return categories.map(
          (category) => ({
            id:
              category.id,

            label:
              category.name,

            secondaryText:
              category.categoryPath ||
              category.parent
                ?.name ||
              (category.level ===
              0
                ? "Root category"
                : `Level ${category.level}`),

            tertiaryText:
              category.name ||
              null,

            url:
              buildCategoryUrl(
                category
              ),

            imageUrl:
              getCategoryImageUrl(
                category
              ),

            entity:
              category,
          })
        );
      }

      if (
        entityType ===
        "BRAND"
      ) {
        const brands =
          getBrandsFromResponse(
            brandQuery.data
          );

        return brands.map(
          (brand) => ({
            id:
              brand.id,

            label:
              brand.name,

            secondaryText:
              brand.code ||
              brand.countryOfOrigin ||
              null,

            tertiaryText:
              brand.isFeatured
                ? "Featured brand"
                : null,

            url:
              buildBrandUrl(
                brand
              ),

            imageUrl:
              getBrandImageUrl(
                brand
              ),

            entity:
              brand,
          })
        );
      }

      if (
        entityType ===
        "PRODUCT"
      ) {
        const products =
          productQuery.data
            ?.data ||
          [];

        return products.map(
          (product) => ({
            id:
              product.id,

            label:
              product.name,

            secondaryText:
              getProductSku(
                product
              ),

            tertiaryText:
              product.brand
                ?.name ||
              null,

            url:
              buildProductUrl(
                product
              ),

            imageUrl:
              getProductImageUrl(
                product
              ),

            entity:
              product,
          })
        );
      }

      if (
        entityType ===
        "COLLECTION"
      ) {
        const collections =
          collectionQuery.data
            ?.data ||
          [];
      
        return collections.map(
          (collection) => ({
            id:
              collection.id,
      
            label:
              collection.name,
      
            secondaryText:
              `${collection.productCount || 0} ${
                collection.productCount === 1
                  ? "product"
                  : "products"
              }`,
      
            tertiaryText:
              collection.isFeatured
                ? "Featured collection"
                : collection.collectionType ===
                    "SMART"
                  ? "Smart collection"
                  : "Manual collection",
      
            url:
              buildCollectionUrl(
                collection
              ),
      
            imageUrl:
              getCollectionImageUrl(
                collection
              ),
      
            entity:
              collection,
          })
        );
      }

      const pages =
        cmsPageQuery.data
          ?.data ||
        [];

      return pages.map(
        (page) => ({
          id:
            page.id,

          label:
            page.name,

          secondaryText:
            page.code,

          tertiaryText:
            page.pageType,

          url:
            buildCmsPageUrl(
              page
            ),

          imageUrl:
            null,

          entity:
            page,
        })
      );
    }, [
      brandQuery.data,
      categoryQuery.data,
      cmsPageQuery.data,
      collectionQuery.data,
      entityType,
      productQuery.data,
    ]);

  const configuration =
    getPickerConfiguration(
      entityType
    );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[180] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="flex max-h-[86vh] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-2xl"
        onMouseDown={(
          event
        ) =>
          event.stopPropagation()
        }
      >
        <header className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8c9196]">
              {
                configuration.eyebrow
              }
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              {
                configuration.title
              }
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              {
                configuration.description
              }
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
            aria-label="Close picker"
          >
            <X
              size={19}
            />
          </button>
        </header>

        <div className="border-b border-[#e1e3e5] p-5">
          <div className="relative">
            <Search
              size={17}
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
              className="admin-input pl-10 pr-10"
              placeholder={
                configuration.searchPlaceholder
              }
              autoFocus
            />

            {search ? (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-[#6d7175] hover:bg-[#f1f2f3]"
                aria-label="Clear search"
              >
                <X
                  size={15}
                />
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-[340px] flex-1 overflow-y-auto">
          {activeQuery.isLoading ||
          activeQuery.isFetching ? (
            <div className="flex min-h-[340px] items-center justify-center">
              <div className="text-center">
                <LoaderCircle
                  size={26}
                  className="mx-auto animate-spin"
                />

                <p className="mt-3 text-sm text-[#6d7175]">
                  Loading{" "}
                  {configuration.eyebrow.toLowerCase()}
                  ...
                </p>
              </div>
            </div>
          ) : activeQuery.isError ? (
            <div className="flex min-h-[340px] items-center justify-center p-6">
              <div className="text-center">
                <p className="text-sm font-medium">
                  Unable to load{" "}
                  {configuration.eyebrow.toLowerCase()}
                  .
                </p>

                <button
                  type="button"
                  onClick={() =>
                    activeQuery.refetch()
                  }
                  className="mt-4 h-9 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : items.length ===
            0 ? (
            <div className="flex min-h-[340px] items-center justify-center p-6">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f2f3]">
                  <PickerTypeIcon
                    entityType={
                      entityType
                    }
                    size={23}
                  />
                </div>

                <p className="mt-3 text-sm font-medium">
                  {
                    configuration.emptyMessage
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#e1e3e5]">
              {items.map(
                (item) => {
                  const selected =
                    item.id ===
                    selectedId;

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onClick={() =>
                        onSelect({
                          id:
                            item.id,

                          label:
                            item.label,

                          url:
                            item.url,

                          entity:
                            item.entity,
                        })
                      }
                      className={[
                        "flex w-full items-center gap-4 px-5 py-4 text-left transition",

                        selected
                          ? "bg-[#eef4ff]"
                          : "hover:bg-[#fafafa]",
                      ].join(
                        " "
                      )}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#e1e3e5] bg-[#f1f2f3]">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.imageUrl
                            }
                            alt={
                              item.label
                            }
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <PickerTypeIcon
                            entityType={
                              entityType
                            }
                            size={20}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {
                            item.label
                          }
                        </p>

                        {item.secondaryText ? (
                          <p className="mt-1 truncate text-xs text-[#6d7175]">
                            {
                              item.secondaryText
                            }
                          </p>
                        ) : null}

                        <p className="mt-1 truncate font-mono text-[11px] text-[#8c9196]">
                          {
                            item.url
                          }
                        </p>
                      </div>

                      {item.tertiaryText ? (
                        <span className="hidden shrink-0 rounded-full bg-[#f1f2f3] px-2 py-1 text-[10px] font-medium text-[#5c5f62] sm:inline-flex">
                          {
                            item.tertiaryText
                          }
                        </span>
                      ) : null}

                      {selected ? (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#005bd3] text-white">
                          <Check
                            size={16}
                          />
                        </div>
                      ) : null}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4">
          <p className="text-xs text-[#6d7175]">
            {items.length}{" "}
            {items.length ===
            1
              ? "result"
              : "results"}
          </p>

          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium"
          >
            Cancel
          </button>
        </footer>
      </section>
    </div>
  );
}

export function isNavigationEntityType(
  value:
    NavigationItemType
): value is NavigationEntityType {
  return [
    "CATEGORY",
    "BRAND",
    "PRODUCT",
    "COLLECTION",
    "CMS_PAGE",
  ].includes(
    value
  );
}