import type {
  Metadata,
} from "next";

import {
  notFound,
} from "next/navigation";

import PageRenderer from "@/components/storefront/PageRenderer";

import ProductsForYouSection from "@/components/storefront/products/ProductsForYouSection";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

import type {
  StorefrontSection,
} from "@/types/storefront";

/*
|--------------------------------------------------------------------------
| Metadata
|--------------------------------------------------------------------------
*/

export async function generateMetadata(): Promise<Metadata> {
  try {
    const storefront =
      await getStorefrontPage({
        slug: "/",
        channel: "WEBSITE",
      });

    const seo =
      storefront.page.seo;

    return {
      title:
        seo.title ||
        storefront.page.title ||
        storefront.company.name,

      description:
        seo.description ||
        storefront.page.description ||
        undefined,

      keywords:
        seo.keywords?.length
          ? seo.keywords
          : undefined,

      alternates: {
        canonical: "/",
      },

      openGraph: {
        type:
          "website",

        title:
          seo.title ||
          storefront.company.name,

        description:
          seo.description ||
          storefront.page
            .description ||
          undefined,

        siteName:
          storefront.company.name,

        locale:
          "en_AE",

        url:
          "/",

        images: [
          {
            url:
              "/myshops-social-share.png",

            width:
              1323,

            height:
              1189,

            alt:
              "MyShops - Your Future Shop",
          },
        ],

      },
    };
  } catch {
    return {
      title:
        "MyShops",

      description:
        "Shop electronics, technology and accessories from MyShops UAE.",
    };
  }
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ""
  )
    .trim()
    .toUpperCase();
}

/*
|--------------------------------------------------------------------------
| Recursive Content Search
|--------------------------------------------------------------------------
|
| CMS banner sections often store their URL/text
| inside nested arrays such as:
|
| banners[]
| slides[]
| items[]
| cards[]
|
| This searches ALL nested content.
|
|--------------------------------------------------------------------------
*/

function objectContainsValue(
  value: unknown,
  tests: string[]
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  /*
   * String
   */

  if (
    typeof value ===
    "string"
  ) {
    const normalized =
      value
        .trim()
        .toUpperCase();

    return tests.some(
      (test) =>
        normalized.includes(
          test
        )
    );
  }

  /*
   * Array
   */

  if (
    Array.isArray(
      value
    )
  ) {
    return value.some(
      (item) =>
        objectContainsValue(
          item,
          tests
        )
    );
  }

  /*
   * Object
   */

  if (
    typeof value ===
    "object"
  ) {
    return Object.values(
      value as Record<
        string,
        unknown
      >
    ).some(
      (item) =>
        objectContainsValue(
          item,
          tests
        )
    );
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| Identify Bottom Trust Section
|--------------------------------------------------------------------------
|
| ONLY:
|
| Free UAE Delivery
| Easy Return
| After Sale Support
|
|--------------------------------------------------------------------------
*/

function isBottomTrustSection(
  section:
    StorefrontSection
): boolean {
  const sectionTypeCode =
    normalizeText(
      section.type?.code
    );

  if (
    sectionTypeCode !==
    "TRUST_BENEFITS"
  ) {
    return false;
  }

  const content =
    section.content &&
    typeof section.content ===
      "object" &&
    !Array.isArray(
      section.content
    )
      ? (
          section.content as Record<
            string,
            unknown
          >
        )
      : {};

  const items =
    Array.isArray(
      content.items
    )
      ? content.items
      : [];

  const titles =
    items
      .map(
        (
          item
        ) => {
          if (
            !item ||
            typeof item !==
              "object" ||
            Array.isArray(
              item
            )
          ) {
            return "";
          }

          return normalizeText(
            (
              item as Record<
                string,
                unknown
              >
            ).title
          );
        }
      )
      .filter(
        Boolean
      );

  return (
    titles.includes(
      "FREE UAE DELIVERY"
    ) &&
    titles.includes(
      "EASY RETURN"
    ) &&
    titles.includes(
      "AFTER SALE SUPPORT"
    )
  );
}

/*
|--------------------------------------------------------------------------
| Identify Visit MyShop Store Section
|--------------------------------------------------------------------------
|
| This version checks:
|
| 1. Section code
| 2. Section name
| 3. ALL nested CMS content
| 4. Store URL such as /stores
|
|--------------------------------------------------------------------------
*/

function isVisitStoreSection(
  section:
    StorefrontSection
): boolean {
  const sectionCode =
    normalizeText(
      section.code
    );

  const sectionName =
    normalizeText(
      section.name
    );

  /*
   * Direct section code/name.
   */

  if (
    sectionCode.includes(
      "VISIT_STORE"
    ) ||
    sectionCode.includes(
      "STORE_VISIT"
    ) ||
    sectionCode.includes(
      "MYSHOP_STORE"
    ) ||
    sectionCode.includes(
      "MY_SHOP_STORE"
    )
  ) {
    return true;
  }

  if (
    sectionName.includes(
      "VISIT A MYSHOP STORE"
    ) ||
    sectionName.includes(
      "VISIT A MY SHOP STORE"
    ) ||
    sectionName.includes(
      "VISIT STORE"
    ) ||
    sectionName.includes(
      "STORE LOCATOR"
    )
  ) {
    return true;
  }

  /*
   * Search complete nested CMS content.
   *
   * This is the important part for your
   * Visit Store banner.
   */

  return objectContainsValue(
    section.content,
    [
      "VISIT A MYSHOP STORE",
      "VISIT A MY SHOP STORE",
      "FIND A STORE NEAR YOU",
      "VIEW STORE",

      /*
       * Exact internal store destination.
       */
      "/STORES",
    ]
  );
}

/*
|--------------------------------------------------------------------------
| Homepage
|--------------------------------------------------------------------------
*/

export default async function Home() {
  try {
    /*
    |--------------------------------------------------------------------------
    | Load Storefront
    |--------------------------------------------------------------------------
    */

    const storefront =
      await getStorefrontPage({
        slug: "/",
        channel: "WEBSITE",
      });

    /*
    |--------------------------------------------------------------------------
    | Split Global Sections
    |--------------------------------------------------------------------------
    */

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page.sections
      );

    /*
    |--------------------------------------------------------------------------
    | Sort CMS Sections
    |--------------------------------------------------------------------------
    |
    | Do this before splitting so the final
    | page always respects CMS display order.
    |
    |--------------------------------------------------------------------------
    */

    const orderedPageSections = [
      ...globalSections.pageSections,
    ].sort(
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

    /*
    |--------------------------------------------------------------------------
    | Extract Bottom Trust Section
    |--------------------------------------------------------------------------
    */

    const bottomTrustSections =
      orderedPageSections.filter(
        isBottomTrustSection
      );

    /*
    |--------------------------------------------------------------------------
    | Exclude Bottom Trust From Main CMS Flow
    |--------------------------------------------------------------------------
    */

    const mainSections =
      orderedPageSections.filter(
        (
          section
        ) =>
          !isBottomTrustSection(
            section
          )
      );

    /*
    |--------------------------------------------------------------------------
    | Find Visit Store Section
    |--------------------------------------------------------------------------
    */

    const visitStoreIndex =
      mainSections.findIndex(
        isVisitStoreSection
      );

    /*
    |--------------------------------------------------------------------------
    | Debug
    |--------------------------------------------------------------------------
    |
    | Temporarily useful when running npm build.
    | You can remove this later.
    |
    |--------------------------------------------------------------------------
    */

    console.log(
      "[Homepage placement]",
      {
        visitStoreIndex,

        visitStore:
          visitStoreIndex >=
          0
            ? {
                id:
                  mainSections[
                    visitStoreIndex
                  ].id,

                code:
                  mainSections[
                    visitStoreIndex
                  ].code,

                name:
                  mainSections[
                    visitStoreIndex
                  ].name,

                type:
                  mainSections[
                    visitStoreIndex
                  ].type
                    ?.code,
              }
            : null,

        totalSections:
          mainSections.length,
      }
    );

    /*
    |--------------------------------------------------------------------------
    | Sections BEFORE Visit Store
    |--------------------------------------------------------------------------
    */

    const sectionsBeforeVisitStore =
      visitStoreIndex >=
      0
        ? mainSections.slice(
            0,
            visitStoreIndex
          )
        : mainSections;

    /*
    |--------------------------------------------------------------------------
    | Visit Store Section Itself
    |--------------------------------------------------------------------------
    */

    const visitStoreSections =
      visitStoreIndex >=
      0
        ? [
            mainSections[
              visitStoreIndex
            ],
          ]
        : [];

    /*
    |--------------------------------------------------------------------------
    | Sections AFTER Visit Store
    |--------------------------------------------------------------------------
    */

    const sectionsAfterVisitStore =
      visitStoreIndex >=
      0
        ? mainSections.slice(
            visitStoreIndex +
              1
          )
        : [];

    /*
    |--------------------------------------------------------------------------
    | Page Objects
    |--------------------------------------------------------------------------
    */

    const pageBeforeVisitStore = {
      ...storefront.page,

      sections:
        sectionsBeforeVisitStore,
    };

    const visitStorePage = {
      ...storefront.page,

      sections:
        visitStoreSections,
    };

    const pageAfterVisitStore = {
      ...storefront.page,

      sections:
        sectionsAfterVisitStore,
    };

    const bottomTrustPage = {
      ...storefront.page,

      sections:
        bottomTrustSections,
    };

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    |
    | FINAL ORDER:
    |
    | Normal CMS content
    |
    | Products For You
    |
    | Visit a MyShop Store
    |
    | Remaining CMS content
    |
    | Free UAE Delivery / Easy Return /
    | After Sale Support
    |
    | Footer
    |
    |--------------------------------------------------------------------------
    */

    return (
      <StorefrontShell
        storefront={
          storefront
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */}

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

        {/*
        |--------------------------------------------------------------------------
        | CMS Before Visit Store
        |--------------------------------------------------------------------------
        */}

        {sectionsBeforeVisitStore.length >
        0 ? (
          <PageRenderer
            page={
              pageBeforeVisitStore
            }
          />
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Products For You
        |--------------------------------------------------------------------------
        */}

        <ProductsForYouSection />

        {/*
        |--------------------------------------------------------------------------
        | Visit a MyShop Store
        |--------------------------------------------------------------------------
        */}

        {visitStoreSections.length >
        0 ? (
          <PageRenderer
            page={
              visitStorePage
            }
          />
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | CMS Sections After Visit Store
        |--------------------------------------------------------------------------
        */}

        {sectionsAfterVisitStore.length >
        0 ? (
          <PageRenderer
            page={
              pageAfterVisitStore
            }
          />
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Bottom 3 Trust Cards
        |--------------------------------------------------------------------------
        */}

        {bottomTrustSections.length >
        0 ? (
          <PageRenderer
            page={
              bottomTrustPage
            }
          />
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Footer
        |--------------------------------------------------------------------------
        */}

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