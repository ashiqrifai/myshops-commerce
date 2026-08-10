import type {
  Metadata,
} from "next";

import Link from "next/link";

import {
  ChevronRight,
} from "lucide-react";

import {
  notFound,
} from "next/navigation";

import ProductDetailsContent from "@/components/storefront/product/ProductDetailsContent";
import ProductPurchasePanel from "@/components/storefront/product/ProductPurchasePanel";
import ProductTemplateSections from "@/components/storefront/product/ProductTemplateSections";
import RecentlyViewedSection from "@/components/storefront/products/RecentlyViewedSection";

import StorefrontFooter from "@/components/storefront/StorefrontFooter";
import StorefrontHeader from "@/components/storefront/StorefrontHeader";
import StorefrontShell from "@/components/storefront/StorefrontShell";

import {
  getPublicProduct,
} from "@/lib/storefront/public-product-api";

import {
  getStorefrontPage,
  StorefrontApiError,
} from "@/lib/storefront/storefront-api";

import {
  splitGlobalStorefrontSections,
} from "@/lib/storefront/storefront-sections";

import type {
  StorefrontData,
} from "@/types/storefront";

interface ProductRouteProps {
  params:
    Promise<{
      slug:
        string;
    }>;
}

const getProductTemplate =
  async ():
    Promise<
      StorefrontData |
      null
    > => {
    try {
      return await getStorefrontPage({
        slug:
          "/product",

        channel:
          "WEBSITE",
      });
    } catch (
      error
    ) {
      if (
        error instanceof
          StorefrontApiError &&
        error.status ===
          404
      ) {
        return null;
      }

      throw error;
    }
  };

export async function generateMetadata({
  params,
}: ProductRouteProps): Promise<Metadata> {
  try {
    const {
      slug,
    } =
      await params;

    const data =
      await getPublicProduct({
        slug,
      });

    const {
      product,
    } =
      data;

    const image =
      product.gallery[0]
        ?.mediaAsset
        ?.publicUrl ||
      undefined;

    return {
      title:
        product.seo
          .title,

      description:
        product.seo
          .description ||
        undefined,

      keywords:
        product.seo
          .keywords
          .length
          ? product.seo
              .keywords
          : undefined,

      alternates: {
        canonical:
          product.seo
            .canonicalUrl,
      },

      openGraph: {
        type:
          "website",

        title:
          product.seo
            .title,

        description:
          product.seo
            .description ||
          undefined,

        url:
          product.productUrl,

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
        "Product | MyShops",
    };
  }
}

export default async function ProductRoute({
  params,
}: ProductRouteProps) {
  try {
    const {
      slug,
    } =
      await params;

    const [
      storefront,
      productTemplate,
      productData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",

          channel:
            "WEBSITE",
        }),

        getProductTemplate(),

        getPublicProduct({
          slug,

          channel:
            "WEBSITE",
        }),
      ]);

    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );

    const productTemplateSections =
      productTemplate
        ? splitGlobalStorefrontSections(
            productTemplate
              .page
              .sections
          ).pageSections
        : [];

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

        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              {productData
                .breadcrumbs
                .map(
                  (
                    breadcrumb,
                    index
                  ) => (
                    <span
                      key={
                        breadcrumb.url
                      }
                      className="flex items-center"
                    >
                      {index >
                      0 ? (
                        <ChevronRight
                          size={
                            14
                          }
                          className="mx-1"
                        />
                      ) : null}

                      <Link
                        href={
                          breadcrumb.url
                        }
                        className={
                          index ===
                          productData
                            .breadcrumbs
                            .length -
                            1
                            ? "font-bold text-storefront-text"
                            : "hover:text-storefront-primary"
                        }
                      >
                        {
                          breadcrumb.label
                        }
                      </Link>
                    </span>
                  )
                )}
            </nav>

            <ProductPurchasePanel
              data={
                productData
              }
            />

            <ProductDetailsContent
              data={
                productData
              }
            />

            <RecentlyViewedSection
              excludeProductId={
                productData
                  .product
                  .id
              }
              maximumItems={
                6
              }
            />
          </div>

          <ProductTemplateSections
            sections={
              productTemplateSections
            }
          />
        </main>

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
