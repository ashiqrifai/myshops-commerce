import type {
  Metadata,
} from "next";

import ExpressDeliveryPage from "@/components/storefront/express-delivery/ExpressDeliveryPage";
import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getExpressDeliveryProducts,
} from "@/lib/storefront/express-delivery-api";

import type {
  ExpressDeliveryRegion,
} from "@/lib/storefront/express-delivery-api";

import {
  getStorefrontPage,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

export const metadata:
  Metadata = {
    title:
      "MyExpressDelivery | MyShops",

    description:
      "Shop products available for fast express delivery in Dubai, Sharjah and Abu Dhabi.",

    alternates: {
      canonical:
        "/express-delivery",
    },
  };

interface Props {
  searchParams:
    Promise<
      Record<
        string,
        string |
        string[] |
        undefined
      >
    >;
}

const getSingle = (
  value:
    | string
    | string[]
    | undefined
) =>
  Array.isArray(
    value
  )
    ? value[0]
    : value;

const parseNumber = (
  value:
    | string
    | string[]
    | undefined
) => {
  const parsed =
    Number(
      getSingle(
        value
      )
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : undefined;
};

const normalizeRegion = (
  value:
    | string
    | undefined
): ExpressDeliveryRegion =>
  String(
    value ||
    ""
  )
    .trim()
    .toUpperCase() ===
  "AUH"
    ? "AUH"
    : "DXB_SHJ";

export default async function ExpressDeliveryRoute({
  searchParams,
}: Props) {
  const query =
    await searchParams;

  const region =
    normalizeRegion(
      getSingle(
        query.region
      )
    );

  const [
    storefront,
    expressData,
  ] =
    await Promise.all([
      getStorefrontPage({
        slug:
          "/",

        channel:
          "WEBSITE",
      }),

      getExpressDeliveryProducts({
        region,

        page:
          parseNumber(
            query.page
          ) ||
          1,

        pageSize:
          parseNumber(
            query.pageSize
          ) ||
          24,

        search:
          getSingle(
            query.search
          ),

        categoryIds:
          String(
            getSingle(
              query.categoryIds
            ) ||
            ""
          )
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(
              Boolean
            ),

        brandIds:
          String(
            getSingle(
              query.brandIds
            ) ||
            ""
          )
            .split(",")
            .map(
              (item) =>
                item.trim()
            )
            .filter(
              Boolean
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
          ) ||
          "FEATURED",
      }),
    ]);

  const globalSections =
    splitGlobalStorefrontSections(
      storefront.page.sections
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

      <ExpressDeliveryPage
        data={
          expressData
        }
        region={
          region
        }
      />

      <StorefrontFooter
        storefront={
          storefront
        }
      />
    </StorefrontShell>
  );
}
