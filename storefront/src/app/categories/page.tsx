import type {
    Metadata,
  } from "next";
  
  import {
    ChevronRight,
    ImageIcon,
  } from "lucide-react";
  
  import Link from "next/link";
  
  import {
    getPublicCategories,
  } from "@/lib/storefront/public-category-api";
  
  import type {
    PublicCategory,
  } from "@/types/publicCategory";
  
  import type {
    StorefrontMediaAsset,
  } from "@/types/storefront";
  
  /*
  |--------------------------------------------------------------------------
  | Metadata
  |--------------------------------------------------------------------------
  */
  
  export const metadata: Metadata = {
    title:
      "Shop by Category | MyShops UAE",
  
    description:
      "Browse MyShops categories and discover mobiles, electronics, appliances, accessories and more.",
  };
  
  /*
  |--------------------------------------------------------------------------
  | Configuration
  |--------------------------------------------------------------------------
  */
  
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
  
  /*
  |--------------------------------------------------------------------------
  | Media Helpers
  |--------------------------------------------------------------------------
  */
  
  const toAbsoluteUrl = (
    value?:
      | string
      | null
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
      normalized.startsWith(
        "/"
      )
        ? normalized
        : `/${normalized}`
    }`;
  };
  
  const getCategoryAsset = (
    category:
      PublicCategory
  ): StorefrontMediaAsset | null => {
    return (
      category.thumbnailAsset ||
      category.image ||
      category.imageAsset ||
      category.bannerAsset ||
      null
    );
  };
  
  const getCategoryImageUrl = (
    category:
      PublicCategory
  ): string | null => {
    const asset =
      getCategoryAsset(
        category
      );
  
    return toAbsoluteUrl(
      asset?.publicUrl ||
        asset?.previewUrl ||
        asset?.thumbnailUrl ||
        null
    );
  };
  
  const getCategoryAltText = (
    category:
      PublicCategory
  ): string => {
    const asset =
      getCategoryAsset(
        category
      );
  
    return (
      asset?.altText ||
      asset?.title ||
      category.name
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Category Card
  |--------------------------------------------------------------------------
  */
  
  function CategoryCard({
    category,
  }: {
    category:
      PublicCategory;
  }) {
    const imageUrl =
      getCategoryImageUrl(
        category
      );
  
    return (
      <Link
        href={`/category/${encodeURIComponent(
          category.slug
        )}`}
        prefetch={
          false
        }
        className={[
          "group",
          "flex",
          "min-w-0",
          "flex-col",
          "overflow-hidden",
  
          "rounded-xl",
  
          "border",
          "border-storefront-light",
  
          "bg-white",
  
          "transition",
          "duration-200",
  
          "hover:-translate-y-0.5",
          "hover:border-storefront-primary/30",
          "hover:shadow-md",
  
          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-storefront-primary",
          "focus-visible:ring-offset-2",
        ].join(
          " "
        )}
      >
        {/* Image */}
  
        <div className="p-2.5 sm:p-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#f7f7f8]">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={
                  imageUrl
                }
                alt={getCategoryAltText(
                  category
                )}
                loading="lazy"
                className="h-full w-full object-contain p-2 transition duration-300 ease-out group-hover:scale-[1.035]"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-storefront-muted">
                <ImageIcon
                  size={
                    32
                  }
                  strokeWidth={
                    1.4
                  }
                />
  
                <span className="text-xs font-medium">
                  No image
                </span>
              </div>
            )}
          </div>
        </div>
  
        {/* Information */}
  
        <div className="flex min-h-[68px] flex-1 items-center justify-between gap-2 px-3 pb-3 sm:px-4 sm:pb-4">
          <div className="min-w-0">
            <h2 className="line-clamp-2 text-[13px] font-medium leading-5 text-storefront-text transition group-hover:text-storefront-primary sm:text-sm">
              {
                category.name
              }
            </h2>
          </div>
  
          <ChevronRight
            size={
              16
            }
            strokeWidth={
              1.8
            }
            className="shrink-0 text-storefront-muted transition group-hover:translate-x-0.5 group-hover:text-storefront-primary"
          />
        </div>
      </Link>
    );
  }
  
  /*
  |--------------------------------------------------------------------------
  | Categories Page
  |--------------------------------------------------------------------------
  */
  
  export default async function CategoriesPage() {
    const data =
      await getPublicCategories({
        channel:
          "WEBSITE",
      });
  
    const categories =
      Array.isArray(
        data.categories
      )
        ? data.categories.filter(
            (
              category
            ) =>
              Boolean(
                category?.id &&
                  category?.name &&
                  category?.slug
              )
          )
        : [];
  
    return (
      <main className="min-h-screen bg-white">
        {/* Breadcrumb */}
  
        <div className="border-b border-storefront-light bg-white">
          <div className="mx-auto flex w-full max-w-[1440px] items-center gap-2 px-4 py-3 text-xs text-storefront-muted sm:px-6 lg:px-8">
            <Link
              href="/"
              className="transition hover:text-storefront-primary"
            >
              Home
            </Link>
  
            <ChevronRight
              size={
                14
              }
            />
  
            <span className="font-medium text-storefront-text">
              Categories
            </span>
          </div>
        </div>
  
        {/* Header */}
  
        <section className="border-b border-storefront-light bg-[#fafafa]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-storefront-text sm:text-3xl">
              Shop by Category
            </h1>
  
            <p className="mt-2 max-w-2xl text-sm leading-6 text-storefront-muted sm:text-base">
              Browse our product categories and find exactly what you&apos;re looking for.
            </p>
          </div>
        </section>
  
        {/* Categories */}
  
        <section className="py-6 sm:py-8 lg:py-10">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            {categories.length >
            0 ? (
              <>
                <div className="mb-5 flex items-center justify-between gap-4">
                  <p className="text-sm text-storefront-muted">
                    <span className="font-medium text-storefront-text">
                      {
                        categories.length
                      }
                    </span>{" "}
                    {categories.length ===
                    1
                      ? "category"
                      : "categories"}
                  </p>
                </div>
  
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {categories.map(
                    (
                      category
                    ) => (
                      <CategoryCard
                        key={
                          category.id
                        }
                        category={
                          category
                        }
                      />
                    )
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-storefront-light bg-[#fafafa] px-6 py-16 text-center">
                <ImageIcon
                  size={
                    36
                  }
                  strokeWidth={
                    1.4
                  }
                  className="mx-auto text-storefront-muted"
                />
  
                <h2 className="mt-4 text-lg font-medium text-storefront-text">
                  No categories available
                </h2>
  
                <p className="mt-2 text-sm text-storefront-muted">
                  Please check back shortly.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    );
  }