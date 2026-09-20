import type {
    MetadataRoute,
  } from "next";
  
  /*
  |--------------------------------------------------------------------------
  | Configuration
  |--------------------------------------------------------------------------
  */
  
  const SITE_URL =
    (
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://myshops.ae"
    ).replace(/\/$/, "");
  
  const API_URL =
    (
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5080/api/v1"
    ).replace(/\/$/, "");
  
  const COMPANY_CODE =
    process.env.NEXT_PUBLIC_COMPANY_CODE ||
    "MYSHOPS";
  
  /*
  |--------------------------------------------------------------------------
  | Dynamic Sitemap
  |--------------------------------------------------------------------------
  |
  | Do not prerender this sitemap during next build.
  |
  |--------------------------------------------------------------------------
  */
  
  export const dynamic =
    "force-dynamic";
  
  /*
  |--------------------------------------------------------------------------
  | Types
  |--------------------------------------------------------------------------
  */
  
  interface SitemapRecord {
    slug: string;
    updatedAt?: string | null;
  }
  
  interface SitemapData {
    products: SitemapRecord[];
    categories: SitemapRecord[];
    brands: SitemapRecord[];
    collections: SitemapRecord[];
  
    meta?: {
      generatedAt?: string;
  
      counts?: {
        products?: number;
        categories?: number;
        brands?: number;
        collections?: number;
      };
    };
  }
  
  interface SitemapApiResponse {
    success: boolean;
    data?: SitemapData;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  
  function absoluteUrl(
    path: string
  ): string {
    const normalized =
      path.startsWith("/")
        ? path
        : `/${path}`;
  
    return `${SITE_URL}${normalized}`;
  }
  
  function validSlug(
    value?: string | null
  ): value is string {
    return Boolean(
      value &&
      value.trim()
    );
  }
  
  function parseDate(
    value?: string | null
  ): Date | undefined {
    if (!value) {
      return undefined;
    }
  
    const date =
      new Date(value);
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return undefined;
    }
  
    return date;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Sitemap API
  |--------------------------------------------------------------------------
  */
  
  async function getSitemapData():
    Promise<SitemapData> {
  
    const response =
      await fetch(
        `${API_URL}/public/storefront/sitemap-data`,
        {
          method:
            "GET",
  
          headers: {
            Accept:
              "application/json",
  
            "x-company-code":
              COMPANY_CODE,
          },
  
          /*
          |--------------------------------------------------------------------------
          | Avoid the normal storefront product/search APIs.
          |
          | The backend sitemap endpoint already returns only lightweight slug
          | and updatedAt records.
          |----------------------------------------------------------------------
          */
  
          cache:
            "no-store",
        }
      );
  
    if (
      !response.ok
    ) {
      throw new Error(
        `Unable to load sitemap data. HTTP ${response.status}`
      );
    }
  
    const payload =
      (
        await response.json()
      ) as SitemapApiResponse;
  
    if (
      !payload.success ||
      !payload.data
    ) {
      throw new Error(
        "The sitemap API returned an invalid response."
      );
    }
  
    return payload.data;
  }
  
  /*
  |--------------------------------------------------------------------------
  | Sitemap
  |--------------------------------------------------------------------------
  */
  
  export default async function sitemap():
    Promise<MetadataRoute.Sitemap> {
  
    const data =
      await getSitemapData();
  
    /*
    |--------------------------------------------------------------------------
    | Core Pages
    |--------------------------------------------------------------------------
    */
  
    const staticEntries:
      MetadataRoute.Sitemap = [
        {
          url:
            absoluteUrl("/"),
          changeFrequency:
            "daily",
          priority:
            1,
        },
  
        {
          url:
            absoluteUrl(
              "/about"
            ),
          changeFrequency:
            "yearly",
          priority:
            0.4,
        },
  
        {
          url:
            absoluteUrl(
              "/stores"
            ),
          changeFrequency:
            "monthly",
          priority:
            0.7,
        },
  
        {
          url:
            absoluteUrl(
              "/contact"
            ),
          changeFrequency:
            "yearly",
          priority:
            0.5,
        },
  
        {
          url:
            absoluteUrl(
              "/privacy"
            ),
          changeFrequency:
            "yearly",
          priority:
            0.3,
        },
  
        {
          url:
            absoluteUrl(
              "/returns"
            ),
          changeFrequency:
            "yearly",
          priority:
            0.4,
        },
  
        /*
        |--------------------------------------------------------------------------
        | Curated Product Listings
        |--------------------------------------------------------------------------
        */
  
        {
          url:
            absoluteUrl(
              "/products/new-arrivals"
            ),
          changeFrequency:
            "daily",
          priority:
            0.8,
        },
  
        {
          url:
            absoluteUrl(
              "/products/bestsellers"
            ),
          changeFrequency:
            "daily",
          priority:
            0.8,
        },
      ];
  
    /*
    |--------------------------------------------------------------------------
    | Products
    |--------------------------------------------------------------------------
    */
  
    const productEntries:
      MetadataRoute.Sitemap =
      data.products
        .filter(
          (product) =>
            validSlug(
              product.slug
            )
        )
        .map(
          (product) => ({
            url:
              absoluteUrl(
                `/products/${product.slug}`
              ),
  
            lastModified:
              parseDate(
                product.updatedAt
              ),
  
            changeFrequency:
              "weekly" as const,
  
            priority:
              0.6,
          })
        );
  
    /*
    |--------------------------------------------------------------------------
    | Categories
    |--------------------------------------------------------------------------
    */
  
    const categoryEntries:
      MetadataRoute.Sitemap =
      data.categories
        .filter(
          (category) =>
            validSlug(
              category.slug
            )
        )
        .map(
          (category) => ({
            url:
              absoluteUrl(
                `/category/${category.slug}`
              ),
  
            lastModified:
              parseDate(
                category.updatedAt
              ),
  
            changeFrequency:
              "daily" as const,
  
            priority:
              0.9,
          })
        );
  
    /*
    |--------------------------------------------------------------------------
    | Brands
    |--------------------------------------------------------------------------
    */
  
    const brandEntries:
      MetadataRoute.Sitemap =
      data.brands
        .filter(
          (brand) =>
            validSlug(
              brand.slug
            )
        )
        .map(
          (brand) => ({
            url:
              absoluteUrl(
                `/brands/${brand.slug}`
              ),
  
            lastModified:
              parseDate(
                brand.updatedAt
              ),
  
            changeFrequency:
              "weekly" as const,
  
            priority:
              0.7,
          })
        );
  
    /*
    |--------------------------------------------------------------------------
    | Collections
    |--------------------------------------------------------------------------
    */
  
    const collectionEntries:
      MetadataRoute.Sitemap =
      data.collections
        .filter(
          (collection) =>
            validSlug(
              collection.slug
            )
        )
        .map(
          (collection) => ({
            url:
              absoluteUrl(
                `/collections/${collection.slug}`
              ),
  
            lastModified:
              parseDate(
                collection.updatedAt
              ),
  
            changeFrequency:
              "daily" as const,
  
            priority:
              0.8,
          })
        );
  
    /*
    |--------------------------------------------------------------------------
    | Merge + De-duplicate
    |--------------------------------------------------------------------------
    */
  
    const allEntries = [
      ...staticEntries,
      ...categoryEntries,
      ...brandEntries,
      ...collectionEntries,
      ...productEntries,
    ];
  
    const uniqueEntries =
      new Map<
        string,
        MetadataRoute.Sitemap[number]
      >();
  
    for (
      const entry of
        allEntries
    ) {
      uniqueEntries.set(
        entry.url,
        entry
      );
    }
  
    return Array.from(
      uniqueEntries.values()
    );
  }