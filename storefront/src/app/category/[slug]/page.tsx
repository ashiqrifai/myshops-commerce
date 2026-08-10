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
    getSingle(value) || ""
  )
    .split(",")
    .map((item) =>
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

  Object.entries(query).forEach(
    ([key, value]) => {
      const match = key.match(
        /^attribute(Min|Max)\[([^\]]+)\]$/
      );

      if (!match) {
        return;
      }

      const boundary =
        match[1].toLowerCase() as
          | "min"
          | "max";

      const attributeId =
        match[2];

      const numericValue =
        parseNumber(value);

      if (
        numericValue ===
        undefined
      ) {
        return;
      }

      ranges[attributeId] = {
        ...(ranges[
          attributeId
        ] || {}),

        [boundary]:
          numericValue,
      };
    }
  );

  return ranges;
};

export async function generateMetadata({
  params,
}: CategoryRouteProps): Promise<Metadata> {
  try {
    const { slug } =
      await params;

    const categoryData =
      await getPublicCategory({
        slug,
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
          category.canonicalUrl ||
          `/category/${category.slug}`,
      },

      robots: {
        index:
          category.robotsIndex,
        follow:
          category.robotsFollow,
      },

      openGraph: {
        type: "website",
        title,
        description,
        url:
          `/category/${category.slug}`,
        images: image
          ? [
              {
                url: image,
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

export default async function CategoryRoute({
  params,
  searchParams,
}: CategoryRouteProps) {
  try {
    const [
      { slug },
      query,
    ] =
      await Promise.all([
        params,
        searchParams,
      ]);

    const [
      storefront,
      categoryData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug: "/",
          channel: "WEBSITE",
        }),

        getPublicCategory({
          slug,

          query: {
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
                query.attributeOptionIds
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
              "WEBSITE",
          },
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page.sections
      );

    return (
      <StorefrontShell
        storefront={storefront}
      >
        <StorefrontHeader
          storefront={storefront}
          announcementSection={
            globalSections.announcementSection
          }
          headerSection={
            globalSections.headerSection
          }
          navigationSection={
            globalSections.navigationSection
          }
        />

        <CategoryPage
          data={categoryData}
          currentQuery={query}
        />

        <StorefrontFooter
          storefront={storefront}
        />
      </StorefrontShell>
    );
  } catch (error) {
    if (
      error instanceof
        StorefrontApiError &&
      error.status === 404
    ) {
      notFound();
    }

    throw error;
  }
}
