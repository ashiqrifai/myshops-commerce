import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import CategoryPage from "@/components/storefront/category/CategoryPage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import StorefrontPageViewTracker from "@/components/storefront/tracking/StorefrontPageViewTracker";

import {
  getPublicCategory,
} from "@/lib/storefront/public-category-api";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

import type {
  PublicCategoryAttributeRange,
} from "@/types/publicCategory";

/*
|--------------------------------------------------------------------------
| Route Types
|--------------------------------------------------------------------------
*/

interface CategoryRouteProps {
  params: Promise<{
    slug: string;
  }>;

  searchParams: Promise<
    Record<
      string,
      string | string[] | undefined
    >
  >;
}

/*
|--------------------------------------------------------------------------
| Query Helpers
|--------------------------------------------------------------------------
*/

const getSingle = (
  value:
    | string
    | string[]
    | undefined
) =>
  Array.isArray(value)
    ? value[0]
    : value;

const parseCsv = (
  value:
    | string
    | string[]
    | undefined
) =>
  String(
    getSingle(value) ||
      ""
  )
    .split(",")
    .map(
      item =>
        item.trim()
    )
    .filter(Boolean);

const parseNumber = (
  value:
    | string
    | string[]
    | undefined
) => {
  const raw =
    getSingle(value);

  if (
    raw === undefined ||
    raw === ""
  ) {
    return undefined;
  }

  const parsed =
    Number(raw);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
};

const parseAttributeRanges = (
  query: Record<
    string,
    string | string[] | undefined
  >
) => {
  const ranges: Record<
    string,
    PublicCategoryAttributeRange
  > = {};

  Object.entries(
    query
  ).forEach(
    (
      [
        key,
        value,
      ]
    ) => {
      const match =
        key.match(
          /^attribute(Min|Max)\[([^\]]+)\]$/
        );

      if (!match) {
        return;
      }

      const boundary =
        match[1]
          .toLowerCase() as
          | "min"
          | "max";

      const attributeId =
        match[2];

      const numericValue =
        parseNumber(
          value
        );

      if (
        numericValue ===
        undefined
      ) {
        return;
      }

      ranges[
        attributeId
      ] = {
        ...(
          ranges[
            attributeId
          ] ||
          {}
        ),

        [boundary]:
          numericValue,
      };
    }
  );

  return ranges;
};

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  try {
    const {
      slug,
    } =
      await params;

    /*
     * public-category-api already has a Next.js
     * revalidation cache, so this metadata request
     * can be served from that cache.
     */
    const categoryData =
      await getPublicCategory({
        slug,

        query: {
          channel:
            "WEBSITE",
        },
      });

    const category =
      categoryData.category;

    const title =
      category.metaTitle ||
      category.name;

    const description =
      category.metaDescription ||
      category.shortDescription ||
      category.description ||
      undefined;

    const image =
      category.bannerAsset
        ?.publicUrl ||
      category.imageAsset
        ?.publicUrl ||
      undefined;

    return {
      title,
      description,

      alternates: {
        canonical:
          category
            .canonicalUrl ||
          `/category/${category.slug}`,
      },

      robots: {
        index:
          category
            .robotsIndex,

        follow:
          category
            .robotsFollow,
      },

      openGraph: {
        type:
          "website",

        title,

        description,

        url:
          `/category/${category.slug}`,

        images:
          image
            ? [
                {
                  url:
                    image,
                },
              ]
            : undefined,
      },
    };
  } catch {
    return {
      title:
        "Category | MyShops",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Category Page
|--------------------------------------------------------------------------
*/

export default async function CategoryRoute({
  params,
  searchParams,
}: CategoryRouteProps) {
  try {
    /*
     * Resolve Next.js route data together.
     */
    const [
      {
        slug,
      },
      query,
    ] =
      await Promise.all([
        params,
        searchParams,
      ]);

    /*
     * Build category query once.
     */
    const categoryQuery = {
      page:
        parseNumber(
          query.page
        ),

      pageSize:
        parseNumber(
          query.pageSize
        ),

      search:
        getSingle(
          query.search
        ),

      brandIds:
        parseCsv(
          query.brandIds
        ),

      attributeOptionIds:
        parseCsv(
          query
            .attributeOptionIds
        ),

      attributeRanges:
        parseAttributeRanges(
          query
        ),

      minPrice:
        parseNumber(
          query.minPrice
        ),

      maxPrice:
        parseNumber(
          query.maxPrice
        ),

      sort:
        getSingle(
          query.sort
        ),

      channel:
        "WEBSITE" as const,
    };

    /*
     * IMPORTANT:
     *
     * Both requests run concurrently.
     *
     * Do NOT change this to sequential awaits.
     */
    const [
      storefront,
      categoryData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getPublicCategory({
          slug,

          query:
            categoryQuery,
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront
          .page
          .sections
      );

    return (
      <StorefrontShell
        storefront={
          storefront
        }
      >
        <StorefrontHeader
          storefront={
            storefront
          }
          announcementSection={
            globalSections
              .announcementSection
          }
          headerSection={
            globalSections
              .headerSection
          }
          navigationSection={
            globalSections
              .navigationSection
          }
        />

        <StorefrontPageViewTracker
          activityType="VIEW_CATEGORY"
          categoryId={
            categoryData
              .category
              .id
          }
          source="CATEGORY_PAGE"
          metadata={{
            categoryName:
              categoryData
                .category
                .name,

            categorySlug:
              categoryData
                .category
                .slug,
          }}
        />

        <CategoryPage
          data={
            categoryData
          }
          currentQuery={
            query
          }
        />

        <StorefrontFooter
          storefront={
            storefront
          }
        />
      </StorefrontShell>
    );
  } catch (
    error
  ) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status ===
        404
    ) {
      notFound();
    }

    throw error;
  }
}